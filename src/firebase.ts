import * as admin from 'firebase-admin';
import * as serviceAccount from '../keys/care-chat-386021-1a8b55a04e7f.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
