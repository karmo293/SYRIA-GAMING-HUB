import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAppletConfig.projectId;

const firebaseConfig = {
  projectId: projectId,
};

const app = !admin.apps.length ? admin.initializeApp(firebaseConfig) : admin.app();
const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId);

async function listUsers() {
  try {
    const snapshot = await db.collection("users").limit(5).get();
    console.log("Users found:", snapshot.size);
    snapshot.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
    process.exit(0);
  } catch (error) {
    console.error("Error listing users:", error);
    process.exit(1);
  }
}

listUsers();
