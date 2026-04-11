import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import path from "path";
import fs from "fs";

// Initialize Firebase Client
const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

const app = initializeApp(firebaseAppletConfig);
const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId);

const SERVER_KEY = "ais_internal_server_key_778899";

async function seedData() {
  try {
    console.log("Seeding data to database:", firebaseAppletConfig.firestoreDatabaseId);
    
    // Seed Games
    const games = [
      {
        title: "Elden Ring",
        description: "A masterpiece of open-world design.",
        imageUrl: "https://picsum.photos/seed/elden/800/600",
        steamUrl: "https://store.steampowered.com/app/1245620/ELDEN_RING/",
        ourPrice: 49.99,
        steamPrice: 59.99,
        deliveryType: "Steam Key",
        deliveryDetails: "Instant delivery",
        createdAt: new Date().toISOString(),
        serverKey: SERVER_KEY
      },
      {
        title: "Cyberpunk 2077",
        description: "Night City awaits.",
        imageUrl: "https://picsum.photos/seed/cyber/800/600",
        steamUrl: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/",
        ourPrice: 29.99,
        steamPrice: 59.99,
        deliveryType: "Steam Key",
        deliveryDetails: "Instant delivery",
        createdAt: new Date().toISOString(),
        serverKey: SERVER_KEY
      }
    ];

    for (const game of games) {
      await addDoc(collection(db, "games"), game);
    }
    console.log("Games seeded.");

    // Seed Products
    const products = [
      {
        title: "1000 UC PUBG Mobile",
        description: "Top up your UC.",
        imageUrl: "https://picsum.photos/seed/pubg/800/600",
        price: 10.00,
        category: "Currency",
        createdAt: new Date().toISOString(),
        serverKey: SERVER_KEY
      },
      {
        title: "Discord Nitro 1 Month",
        description: "Boost your server.",
        imageUrl: "https://picsum.photos/seed/nitro/800/600",
        price: 9.99,
        category: "Subscription",
        createdAt: new Date().toISOString(),
        serverKey: SERVER_KEY
      }
    ];

    for (const product of products) {
      await addDoc(collection(db, "products"), product);
    }
    console.log("Products seeded.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
