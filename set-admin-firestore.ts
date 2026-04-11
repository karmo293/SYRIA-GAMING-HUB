import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAppletConfig.projectId;

const firebaseConfig = {
  projectId: projectId,
};

const app = !admin.apps.length ? admin.initializeApp(firebaseConfig) : admin.app();

const db = getFirestore(firebaseAppletConfig.firestoreDatabaseId);
const uid = "tRjEQ5uxjXdW97tyiQjD68Oa7pF3";

async function setAdminInFirestore() {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.set({ role: 'admin' }, { merge: true });
    console.log(`Admin role assigned in Firestore successfully to UID: ${uid}`);
    process.exit(0);
  } catch (error) {
    console.error("Error assigning admin role in Firestore:", error);
    process.exit(1);
  }
}

setAdminInFirestore();
