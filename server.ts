import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";
import { createRemoteJWKSet, jwtVerify } from 'jose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "fs";

// Initialize Firebase Admin
const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const projectId = firebaseAppletConfig.projectId;

const firebaseConfig = {
  projectId: projectId,
};

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

const db = admin.firestore(firebaseAppletConfig.firestoreDatabaseId);
const auth = admin.auth();

// JWKS URL for Firebase ID tokens
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-01-27-alpha",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to verify Firebase ID Token and attach user to request
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      // Manual JWT verification using jose to bypass Identity Toolkit API requirement
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      const decodedToken: any = {
        uid: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        role: payload.role || 'user',
        ...payload
      };

      req.user = decodedToken;

      // Bootstrap: Automatically set admin claim for the owner email if not set
      if (decodedToken.email === "karmo2931@gmail.com" && decodedToken.role !== "admin") {
        try {
          await auth.setCustomUserClaims(decodedToken.uid, { role: "admin" });
          console.log(`Admin claim set for ${decodedToken.email}`);
          
          // Also update Firestore to ensure client-side fallback works
          await db.collection("users").doc(decodedToken.uid).update({ role: "admin" });
        } catch (claimError: any) {
          console.warn("Failed to set custom claims or update Firestore (Identity Toolkit API or permissions might be the issue):", claimError.message);
          // We still set it in the current request object so the user can proceed as admin
        }
        decodedToken.role = "admin";
      }
      
      next();
    } catch (error: any) {
      console.error("Token verification error:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.stack) console.error("Error stack:", error.stack);
      res.status(401).json({ error: "Invalid token", details: error.message });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Admin: Set Custom Claims (One-time setup or via admin panel)
  app.post("/api/admin/set-role", authenticate, async (req: any, res: any) => {
    const { targetUserId, role } = req.body;

    // Only existing admins can set roles
    if (req.user.role !== "admin") {
      // Bootstrap: If no admins exist, allow the first one (or use a secret key)
      const usersCount = (await db.collection("users").get()).size;
      if (usersCount > 1) { // Assuming bootstrap happened
         return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    }

    try {
      await auth.setCustomUserClaims(targetUserId, { role });
      await db.collection("users").doc(targetUserId).update({ role });
      res.json({ success: true, message: `Role ${role} set for user ${targetUserId}. User must re-login or refresh token.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet Payment Endpoint (Server-side order creation)
  app.post("/api/pay-with-wallet", authenticate, async (req: any, res: any) => {
    const { items, totalPrice, pointsEarned } = req.body;
    const userId = req.user.uid;

    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      const currentBalance = userData?.walletBalance || 0;

      if (currentBalance < totalPrice) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      const timestamp = new Date().toISOString();

      // Atomic transaction: Deduct balance, create order, and add notification
      await db.runTransaction(async (transaction) => {
        // 1. Deduct balance and update games
        const ownedGames = [...(userData?.ownedGames || [])];
        items.forEach((item: any) => {
          if (item.type === 'game' && !ownedGames.includes(item.id)) {
            ownedGames.push(item.id);
          }
        });

        // 2. Create Notification
        const notification = {
          id: Math.random().toString(36).substring(2, 15),
          userId,
          title: "تمت عملية الشراء بنجاح",
          message: `شكراً لشرائك. يمكنك الآن كشف أكواد ألعابك من صفحة الطلبات.`,
          type: "purchase",
          createdAt: timestamp,
          read: false
        };

        transaction.update(userRef, {
          walletBalance: currentBalance - totalPrice,
          points: (userData?.points || 0) + pointsEarned,
          ownedGames,
          notifications: admin.firestore.FieldValue.arrayUnion(notification)
        });

        // 3. Create Order
        const orderRef = db.collection("orders").doc();
        transaction.set(orderRef, {
          id: orderRef.id,
          userId,
          userEmail: req.user.email || "",
          items,
          totalAmount: totalPrice,
          status: "completed",
          paymentMethod: "Wallet",
          paymentStatus: "paid",
          createdAt: timestamp,
          revealStatus: "hidden"
        });
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Wallet payment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Payment Endpoints
  app.post("/api/create-checkout-session", async (req, res) => {
    const { items, userId, userEmail } = req.body;
    
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: items.map((item: any) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: item.title,
                images: [item.imageUrl],
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
          mode: "payment",
          success_url: `${req.headers.origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/cart`,
          customer_email: userEmail,
          metadata: {
            userId,
            items: JSON.stringify(items.map((i: any) => ({ id: i.id, quantity: i.quantity }))),
          },
        });

        res.json({ id: session.id, url: session.url });
      } else {
        // Mock session for development if no key is provided
        const sessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
        console.warn("STRIPE_SECRET_KEY not found, using mock session");
        res.json({ 
          id: sessionId,
          url: `${req.headers.origin}/orders?mock_success=true&session_id=${sessionId}`
        });
      }
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        event = req.body; // Fallback for testing
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, items } = session.metadata;
        const parsedItems = JSON.parse(items);

        // Create order in Firestore
        const orderRef = await db.collection("orders").add({
          userId,
          userEmail: session.customer_email,
          items: parsedItems,
          totalAmount: session.amount_total / 100,
          status: "completed",
          paymentStatus: "paid",
          createdAt: new Date().toISOString(),
          paymentId: session.id,
          revealStatus: "hidden"
        });

        // Update user profile (e.g., add owned games)
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const newOwnedGames = [...(userData?.ownedGames || [])];
          parsedItems.forEach((item: any) => {
            if (!newOwnedGames.includes(item.id)) {
              newOwnedGames.push(item.id);
            }
          });
          await userRef.update({ ownedGames: newOwnedGames });
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Steam Endpoints
  app.get("/api/steam/link", (req, res) => {
    res.json({ url: "https://steamcommunity.com/openid/login" });
  });

  app.post("/api/steam/sync", async (req, res) => {
    const { userId, steamId } = req.body;
    // In a real app, fetch games from Steam API
    res.json({ success: true, gamesCount: 12 });
  });

  // Secure Delivery Endpoints: Reveal Code
  app.post("/api/reveal-code", authenticate, async (req: any, res: any) => {
    const { orderId } = req.body;
    const userId = req.user.uid;

    try {
      const orderDoc = await db.collection("orders").doc(orderId).get();
      
      if (!orderDoc.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderData = orderDoc.data();
      
      // Verify ownership: Only the buyer or an admin can reveal the code
      if (orderData?.userId !== userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: You do not own this order" });
      }

      // In a real production app, we would fetch the code from a secure 'digitalCodes' collection
      // that is NOT accessible via the client SDK.
      const items = orderData?.items || [];
      const codes = [];

      for (const item of items) {
        const codeDoc = await db.collection("digitalCodes")
          .where("productId", "==", item.id)
          .where("status", "==", "available")
          .limit(1)
          .get();

        if (!codeDoc.empty) {
          const doc = codeDoc.docs[0];
          codes.push({ title: item.title, code: doc.data().code });
          // Mark code as sold
          await doc.ref.update({ status: "sold", assignedOrderId: orderId, assignedUserId: userId });
        } else {
          codes.push({ title: item.title, code: "PENDING_DELIVERY" });
        }
      }

      // Update order reveal status
      await orderDoc.ref.update({ revealStatus: "revealed" });

      res.json({ success: true, codes });
    } catch (error: any) {
      console.error("Reveal code error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Endpoints: Respond to Bids
  app.post("/api/bids/respond", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { bidId, response } = req.body;
    // Logic to update bid status
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
