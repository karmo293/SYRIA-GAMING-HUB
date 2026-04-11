import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "fs";

import { initializeApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  doc as clientDoc, 
  getDoc as getClientDoc, 
  updateDoc as clientUpdateDoc, 
  increment as clientIncrement, 
  arrayUnion as clientArrayUnion,
  runTransaction as clientRunTransaction, 
  setDoc as clientSetDoc, 
  deleteDoc as clientDeleteDoc,
  collection as clientCollection,
  addDoc as addDocModular,
  getDocs as getDocsModular,
  where as whereModular,
  limit as limitModular,
  query as queryModular
} from "firebase/firestore";
import { getAuth as getClientAuth, signInWithCustomToken } from "firebase/auth";

// Initialize Firebase Admin
const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

// Initialize Client SDK on server for bypassing Admin SDK IAM issues
const clientApp = initializeApp(firebaseAppletConfig);
const clientDb = getClientFirestore(clientApp, firebaseAppletConfig.firestoreDatabaseId);
const clientAuth = getClientAuth(clientApp);

let serverAdminDb = clientDb;

async function ensureServerAdmin() {
  try {
    const customToken = await admin.auth().createCustomToken("SERVER_ADMIN", { admin: true });
    await signInWithCustomToken(clientAuth, customToken);
    console.log("DEBUG: Server Admin signed in successfully");
  } catch (error: any) {
    console.error("DEBUG: Server Admin sign-in failed:", error.message);
  }
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAppletConfig.projectId;

const firebaseConfig = {
  projectId: projectId,
};

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseAppletConfig.projectId,
  });
}

const auth = admin.auth();
const db = getFirestore(firebaseAppletConfig.firestoreDatabaseId);

// Shims to keep modular-like syntax with Admin SDK (which bypasses security rules)
// UPDATED: Using modular SDK with Server Admin token to bypass Admin SDK IAM issues
const doc = (db: any, pathOrColl: string, id?: string) => clientDoc(serverAdminDb, pathOrColl, id as string);
const collection = (db: any, path: string) => clientCollection(serverAdminDb, path);
const getDoc = async (docRef: any) => {
  const snap = await getClientDoc(docRef);
  return {
    exists: () => snap.exists(),
    data: () => snap.data() as any,
    id: snap.id,
    ref: snap.ref
  };
};
const getDocs = async (query: any) => {
  const snap = await getDocsModular(query);
  return {
    docs: snap.docs.map((doc: any) => ({
      exists: () => doc.exists(),
      data: () => doc.data() as any,
      id: doc.id,
      ref: doc.ref
    })),
    size: snap.size,
    empty: snap.empty
  };
};
const updateDoc = (docRef: any, data: any) => clientUpdateDoc(docRef, data);
const setDoc = (docRef: any, data: any) => clientSetDoc(docRef, data);
const addDoc = (collRef: any, data: any) => addDocModular(collRef, data);
const deleteDoc = (docRef: any) => clientDeleteDoc(docRef);
const runTransaction = (db: any, cb: any) => clientRunTransaction(serverAdminDb, async (t: any) => {
  const wrappedTransaction = {
    get: async (docRef: any) => {
      const snap = await t.get(docRef);
      return {
        exists: () => snap.exists(),
        data: () => snap.data() as any,
        id: snap.id,
        ref: snap.ref
      };
    },
    set: (docRef: any, data: any) => t.set(docRef, data),
    update: (docRef: any, data: any) => t.update(docRef, data),
    delete: (docRef: any) => t.delete(docRef)
  };
  return cb(wrappedTransaction);
});
const query = (collRef: any, ...constraints: any[]) => queryModular(collRef, ...constraints);
const where = (field: string, op: any, val: any) => whereModular(field, op, val);
const limit = (n: number) => limitModular(n);
const arrayUnion = (...args: any[]) => clientArrayUnion(...args);
const increment = (n: number) => clientIncrement(n);

console.log(`Firebase Admin initialized for project: ${projectId}, database: ${firebaseAppletConfig.firestoreDatabaseId}`);

// JWKS URL for Firebase ID tokens
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-01-27-alpha",
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function startServer() {
  await ensureServerAdmin();
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
        admin: !!payload.admin || (payload.email === 'karmo2931@gmail.com' && payload.email_verified),
        ...payload
      };

      req.user = decodedToken;
      
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

  app.post("/api/admin/set-admin", authenticate, async (req: any, res: any) => {
    const { targetUserId, admin: isAdmin } = req.body;

    // Only existing admins can set roles
    if (req.user.role !== "admin" && !req.user.admin) {
      // Bootstrap: If no admins exist, allow the first one
      const usersSnap = await getDocs(collection(db, "users"));
      const usersCount = usersSnap.size;
      if (usersCount > 1) {
         return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    }

    try {
      await auth.setCustomUserClaims(targetUserId, { admin: isAdmin });
      await updateDoc(doc(db, "users", targetUserId), { 
        role: isAdmin ? 'admin' : 'user'
      });
      res.json({ success: true, message: `Admin status set to ${isAdmin} for user ${targetUserId}.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Set Custom Claims (One-time setup or via admin panel)
  app.post("/api/admin/set-role", authenticate, async (req: any, res: any) => {
    const { targetUserId, role } = req.body;

    // Only existing admins can set roles
    if (req.user.role !== "admin" && !req.user.admin) {
      // Bootstrap: If no admins exist, allow the first one (or use a secret key)
      const usersSnap = await getDocs(collection(db, "users"));
      const usersCount = usersSnap.size;
      if (usersCount > 1) { // Assuming bootstrap happened
         return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    }

    try {
      await auth.setCustomUserClaims(targetUserId, { role });
      await updateDoc(doc(db, "users", targetUserId), { 
        role
      });
      res.json({ success: true, message: `Role ${role} set for user ${targetUserId}. User must re-login or refresh token.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Endpoints
  app.post("/api/ai/chat", async (req, res) => {
    const { message, history } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: history || [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    const { games } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        بناءً على قائمة ألعاب المستخدم: ${games.join(', ')}.
        اقترح 3 ألعاب أو منتجات رقمية (مثل عملات ألعاب أو بطاقات شحن) قد تهمه من متجرنا.
        المتجر يوفر: مفاتيح ألعاب، عملات (UC, Discord Nitro, Steam Wallet)، وحسابات ألعاب.
        
        أرجع النتيجة بصيغة JSON كقائمة من الأشياء المقترحة مع سبب الاقتراح.
        مثال: [{ "title": "Elden Ring: Shadow of the Erdtree", "reason": "بما أنك لعبت Elden Ring الأصلية..." }]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Clean up potential markdown formatting
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      res.json(JSON.parse(jsonStr));
    } catch (error: any) {
      console.error("AI Recommendations Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet Payment Endpoint (Server-side order creation)
  app.post("/api/pay-with-wallet", authenticate, async (req: any, res: any) => {
    const { items: clientItems } = req.body;
    const userId = req.user.uid;

    try {
      const userRef = doc(db, "users", userId);
      
      // Fetch real prices from Firestore
      const items = [];
      let totalPrice = 0;
      for (const item of clientItems) {
        const details = await fetchItemDetails(item.id);
        if (details) {
          const quantity = item.quantity || 1;
          items.push({
            ...details,
            quantity
          });
          totalPrice += details.price * quantity;
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ error: "No valid items found" });
      }

      const timestamp = new Date().toISOString();
      const pointsEarned = Math.floor(totalPrice * 10);

      // Atomic transaction: Deduct balance, create order, and add notification
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        const currentBalance = userData?.walletBalance || 0;

        if (currentBalance < totalPrice) {
          throw new Error("Insufficient wallet balance");
        }

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
          notifications: arrayUnion(notification),
          updatedAt: timestamp
        });

        // 3. Create Order
        const orderId = Math.random().toString(36).substring(2, 15);
        const orderRef = doc(db, "orders", orderId);
        transaction.set(orderRef, {
          id: orderId,
          userId,
          userEmail: req.user.email || "",
          items,
          subtotal: totalPrice,
          discount: 0,
          totalAmount: totalPrice,
          currency: "USD",
          status: "completed",
          paymentMethod: "Wallet",
          paymentStatus: "paid",
          fulfillmentStatus: "fulfilled",
          orderStatus: "completed",
          createdAt: timestamp,
          updatedAt: timestamp,
          revealStatus: "hidden",
          warrantyStatus: "active"
        });
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Wallet payment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to fetch item details from Firestore
  const fetchItemDetails = async (itemId: string) => {
    // Try games collection
    const gameDoc = await getDoc(doc(db, "games", itemId));
    if (gameDoc.exists()) {
      const data = gameDoc.data();
      return {
        id: itemId,
        title: data.title,
        price: data.ourPrice,
        imageUrl: data.imageUrl,
        type: 'game' as const
      };
    }
    // Try products collection
    const productDoc = await getDoc(doc(db, "products", itemId));
    if (productDoc.exists()) {
      const data = productDoc.data();
      return {
        id: itemId,
        title: data.title,
        price: data.price,
        imageUrl: data.imageUrl,
        type: 'product' as const
      };
    }
    return null;
  };

  // Payment Endpoints
  app.post("/api/create-checkout-session", authenticate, async (req: any, res: any) => {
    const { items: clientItems } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    try {
      // Fetch real prices from Firestore to prevent tampering
      const items = [];
      for (const item of clientItems) {
        const details = await fetchItemDetails(item.id);
        if (details) {
          items.push({
            ...details,
            quantity: item.quantity || 1
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ error: "No valid items found" });
      }

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
            // Store a snapshot of items in metadata (compacted)
            items: JSON.stringify(items.map((i: any) => ({ 
              id: i.id, 
              q: i.quantity, 
              p: i.price, 
              t: i.title,
              ty: i.type
            }))),
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
        event = JSON.parse(req.body.toString()); // Fallback for testing
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, items: itemsMetadata } = session.metadata;
        const compactedItems = JSON.parse(itemsMetadata);
        
        // Map compacted items back to CartItem structure
        const parsedItems = compactedItems.map((i: any) => ({
          id: i.id,
          quantity: i.q,
          price: i.p,
          title: i.t,
          type: i.ty
        }));

        // Idempotency check: Ensure we don't process the same session twice
        const existingOrdersQuery = query(
          collection(db, "orders"),
          where("paymentId", "==", session.id),
          limit(1)
        );
        const existingOrdersSnap = await getDocs(existingOrdersQuery);
        if (!existingOrdersSnap.empty) {
          console.log(`Order for session ${session.id} already exists. Skipping.`);
          return res.json({ received: true });
        }

        const timestamp = new Date().toISOString();

        // Create order in Firestore
        const orderRef = await addDoc(collection(db, "orders"), {
          userId,
          userEmail: session.customer_email,
          items: parsedItems,
          totalAmount: session.amount_total / 100,
          subtotal: session.amount_total / 100,
          discount: 0,
          currency: "USD",
          status: "completed",
          paymentStatus: "paid",
          fulfillmentStatus: "fulfilled",
          orderStatus: "completed",
          createdAt: timestamp,
          updatedAt: timestamp,
          paymentId: session.id,
          revealStatus: "hidden",
          paymentMethod: "Stripe",
          warrantyStatus: "active"
        });

        // Update user profile
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newOwnedGames = [...(userData?.ownedGames || [])];
          parsedItems.forEach((item: any) => {
            if (item.type === 'game' && !newOwnedGames.includes(item.id)) {
              newOwnedGames.push(item.id);
            }
          });
          
          await updateDoc(userRef, { 
            ownedGames: newOwnedGames,
            updatedAt: timestamp
          });
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Order Management Endpoints
  app.post("/api/orders/cancel", authenticate, async (req: any, res: any) => {
    const { orderId } = req.body;
    const userId = req.user.uid;

    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderData = orderDoc.data();
      if (orderData.userId !== userId && !req.user.admin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (orderData.status !== "pending") {
        return res.status(400).json({ error: "Only pending orders can be cancelled" });
      }

      await updateDoc(orderRef, {
        status: "cancelled",
        orderStatus: "cancelled",
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders/log-warranty", authenticate, async (req: any, res: any) => {
    const { orderId, action } = req.body;
    const userId = req.user.uid;

    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderData = orderDoc.data();
      if (orderData.userId !== userId && !req.user.admin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const logEntry = {
        action,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };

      await updateDoc(orderRef, {
        warrantyLog: arrayUnion(logEntry),
        warrantyStatus: action === 'activate' ? 'active' : (orderData.warrantyStatus || 'inactive'),
        warrantyActivatedAt: action === 'activate' ? new Date().toISOString() : (orderData.warrantyActivatedAt || null),
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

    console.log(`Attempting to reveal code for order ${orderId} by user ${userId}`);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error("Order not found");
        }

        const orderData = orderDoc.data();
        
        // Verify ownership
        if (orderData?.userId !== userId && req.user.role !== "admin") {
          throw new Error("Forbidden: You do not own this order");
        }

        if (orderData?.revealStatus === "revealed" && orderData?.codes) {
          return { codes: orderData.codes };
        }

        const items = orderData?.items || [];
        const codes = [];

        for (const item of items) {
          const codesQuery = query(
            collection(db, "digitalCodes"),
            where("productId", "==", item.id),
            where("status", "==", "available"),
            limit(1)
          );
          
          const codesSnap = await getDocs(codesQuery);

          if (!codesSnap.empty) {
            const codeDoc = codesSnap.docs[0];
            const codeData = codeDoc.data();
            
            codes.push({ title: item.title, code: codeData.code });
            
            // Mark code as sold
            transaction.update(codeDoc.ref, { 
              status: "sold", 
              assignedOrderId: orderId, 
              assignedUserId: userId,
              updatedAt: new Date().toISOString()
            });
          } else {
            codes.push({ title: item.title, code: "PENDING_DELIVERY" });
          }
        }

        // Update order reveal status and store codes securely in the order
        transaction.update(orderRef, { 
          revealStatus: "revealed",
          codes: codes,
          updatedAt: new Date().toISOString()
        });

        return { codes };
      });

      res.json({ success: true, codes: result.codes });
    } catch (error: any) {
      console.error("Reveal code error details:", error.message);
      res.status(error.message.includes("Forbidden") ? 403 : 500).json({ error: error.message });
    }
  });

  // Admin Endpoints: Respond to Bids
  app.post("/api/bids/respond", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { bidId, status, response } = req.body;
    
    try {
      const bidRef = doc(db, "bids", bidId);
      await updateDoc(bidRef, {
        status,
        adminResponse: response || '',
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Bid response error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Endpoints: Manage Contact Messages
  app.post("/api/admin/messages/update-status", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { messageId, status } = req.body;
    try {
      const messageRef = doc(db, "contact_messages", messageId);
      await updateDoc(messageRef, { status, updatedAt: new Date().toISOString() });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/messages/delete", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { messageId } = req.body;
    try {
      const messageRef = doc(db, "contact_messages", messageId);
      await deleteDoc(messageRef);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Endpoints: Manage Orders
  app.post("/api/admin/orders/update-status", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { orderId, status, deliveryStatus, deliveryDetails } = req.body;
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (status) updateData.status = status;
      if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
      if (deliveryDetails !== undefined) updateData.deliveryDetails = deliveryDetails;
      
      await updateDoc(orderRef, updateData);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/notify", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { userId, title, message } = req.body;
    try {
      const userRef = doc(db, "users", userId);
      const notification = {
        id: Math.random().toString(36).substring(2, 15),
        userId,
        title,
        message,
        type: 'system',
        createdAt: new Date().toISOString(),
        read: false
      };
      await updateDoc(userRef, {
        notifications: arrayUnion(notification)
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Endpoints: Manage Games & Products
  app.post("/api/admin/inventory/add", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { collectionName, data } = req.body;
    try {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/inventory/update", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { collectionName, id, data } = req.body;
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/inventory/delete", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { collectionName, id } = req.body;
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/analyze-image", async (req, res) => {
    const { image, inventory } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const prompt = `
        Analyze this image and find the best matching items from our inventory.
        Inventory:
        ${JSON.stringify(inventory)}
        
        Task: Return a JSON array of IDs for the items that best match the product in the image.
        Return ONLY the JSON array.
      `;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      res.json(JSON.parse(jsonStr));
    } catch (error: any) {
      console.error("AI Image Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update User Wallet Balance
  app.post("/api/admin/update-wallet", authenticate, async (req: any, res: any) => {
    if (req.user.role !== "admin" && !req.user.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { targetUserId, amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        walletBalance: amount, // Admin sets absolute balance
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin wallet update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet Recharge Endpoint
  app.post("/api/wallet/recharge", authenticate, async (req: any, res: any) => {
    const { amount } = req.body;
    const userId = req.user.uid;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        walletBalance: increment(amount),
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Wallet recharge error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // XP Addition Endpoint
  app.post("/api/wallet/add-xp", authenticate, async (req: any, res: any) => {
    const { amount } = req.body;
    const userId = req.user.uid;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data();
      const currentXP = userData?.xp || 0;
      const newXP = currentXP + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Add XP error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Points Addition Endpoint (for rewards, etc.)
  app.post("/api/wallet/add-points", authenticate, async (req: any, res: any) => {
    const { amount } = req.body;
    const userId = req.user.uid;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        points: increment(amount),
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Add points error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // LootBox Endpoint
  app.post("/api/lootbox/open", authenticate, async (req: any, res: any) => {
    const userId = req.user.uid;
    const boxPrice = 5;

    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data();
      const currentBalance = userData?.walletBalance || 0;

      if (currentBalance < boxPrice) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // 1. Fetch items
      const gamesSnap = await getDocs(query(collection(db, 'games'), limit(10)));
      const productsSnap = await getDocs(query(collection(db, 'products'), limit(10)));
      
      const allItems = [
        ...gamesSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'game' })),
        ...productsSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'product' }))
      ];

      // 2. Pick a reward (Simple random for now, or use AI if needed)
      // For security, the server MUST pick the reward.
      const selectedItem = allItems[Math.floor(Math.random() * allItems.length)];

      if (!selectedItem) {
        throw new Error("No items available for reward");
      }

      // 3. Update user (Deduct balance, add XP, add reward to some 'inventory' or just log it)
      // In this app, rewards seem to be added to the user's "inventory" or just shown.
      // Let's assume we add it to an 'inventory' field in the user document.
      await updateDoc(userRef, {
        walletBalance: increment(-boxPrice),
        xp: increment(500),
        level: Math.floor(((userData?.xp || 0) + 500) / 1000) + 1,
        lootBoxRewards: arrayUnion({
          ...selectedItem,
          wonAt: new Date().toISOString()
        }),
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, reward: selectedItem });
    } catch (error: any) {
      console.error("LootBox error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Price Protection Endpoint
  app.post("/api/price-protection/lock", authenticate, async (req: any, res: any) => {
    const { itemId, itemTitle, currentPrice } = req.body;
    const userId = req.user.uid;
    const protectionFee = 0.99;

    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data();
      const currentBalance = userData?.walletBalance || 0;

      if (currentBalance < protectionFee) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await updateDoc(userRef, {
        walletBalance: increment(-protectionFee),
        lockedPrices: arrayUnion({
          itemId,
          price: currentPrice,
          expiresAt: expiresAt.toISOString()
        }),
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Price protection error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Quest Claim Endpoint
  app.post("/api/quests/claim", authenticate, async (req: any, res: any) => {
    const { questId } = req.body;
    const userId = req.user.uid;

    try {
      const questRef = doc(db, "quests", questId);
      const questDoc = await getDoc(questRef);
      if (!questDoc.exists()) return res.status(404).json({ error: "Quest not found" });
      
      const questData = questDoc.data();
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data();
      
      // Verify quest progress (simplified for this example)
      const userQuest = userData?.quests?.find((q: any) => q.id === questId);
      if (!userQuest || userQuest.completed || userQuest.progress < questData.target) {
        return res.status(400).json({ error: "Quest not ready to claim or already completed" });
      }

      const newXP = (userData?.xp || 0) + questData.rewardXp;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        walletBalance: increment(questData.rewardCoins),
        quests: userData.quests.map((q: any) => q.id === questId ? { ...q, completed: true } : q),
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Quest claim error:", error);
      res.status(500).json({ error: error.message });
    }
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
