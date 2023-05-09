import express from 'express';
import authMiddleware from './authMiddleware';

const app = express();
const port = 3000;
const router = express.Router();

router.use(authMiddleware);

// Configuration for a Firebase Firestore connection
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

router.get('/healthcheck', (req, res) => {
  res.sendStatus(200);
});

app.use(router);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});


export default app;