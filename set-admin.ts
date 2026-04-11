import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin (using same logic as server.ts)
const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAppletConfig.projectId;

const firebaseConfig = {
  projectId: projectId,
};

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

const uid = "tRjEQ5uxjXdW97tyiQjD68Oa7pF3";

async function setAdmin() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Admin assigned successfully to UID: ${uid}`);
    process.exit(0);
  } catch (error) {
    console.error("Error assigning admin:", error);
    process.exit(1);
  }
}

setAdmin();
