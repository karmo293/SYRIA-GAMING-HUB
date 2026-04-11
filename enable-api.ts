import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function enableApi() {
  try {
    const firebaseAppletConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAppletConfig.projectId;

    console.log(`Attempting to enable Identity Toolkit API for project: ${projectId}`);

    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const serviceUsage = google.serviceusage({ version: 'v1', auth });

    const res = await serviceUsage.services.enable({
      name: `projects/${projectId}/services/identitytoolkit.googleapis.com`,
    });

    console.log('API enabling operation started:', res.data);
    
    // Wait a bit for propagation
    console.log('Waiting 30 seconds for propagation...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('Done waiting.');
  } catch (error) {
    console.error('Error enabling API:', error);
    process.exit(1);
  }
}

enableApi();
