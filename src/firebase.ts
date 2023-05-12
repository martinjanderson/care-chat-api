import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
}

admin.initializeApp();

export default admin;