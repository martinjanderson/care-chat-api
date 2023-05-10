
import express, { Request, Response } from 'express';

import { protectEndpoints } from './authMiddleware';
import { RequestWithUser } from './types';
import { getOrCreateRoom, addMessageToRoom, UnauthorizedError } from './roomService';
import morgan from 'morgan';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.use(morgan('combined'));
app.use(protectEndpoints(['GET:/healthcheck']));

// Configuration for a Firebase Firestore connection
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

// An endpoint that returns server status
app.get('/healthcheck', (req, res) => {
  res.sendStatus(200);
});

// An /api/room endpoint based on openapi.yaml
app.get('/api/room', async (req: RequestWithUser, res: Response) => {
  const ownerId = req.user!.uid; // Assuming you have already setup Firebase authentication and `req.user` contains the authenticated user.
  const messageLimit = Number(req.query.messageLimit) || 10; // Default limit is 10 if not provided.

  try {
    const room = await getOrCreateRoom(ownerId, messageLimit);
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// An /api/room/:roomId/messages endpoint based on openapi.yaml
app.post('/api/room/:roomId/messages', async (req: RequestWithUser, res: Response) => {
  const roomId = req.params.roomId;
  const userId = req.user!.uid; // Assuming you have already setup Firebase authentication and `req.user` contains the authenticated user.
  try {

    const message = await addMessageToRoom(roomId, userId, req.body.text);
    if (message === null) {
      res.status(404).send('Message not found');
    } else {
      res.json(message);
    }

  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).send('Unauthorized');
    } else {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});


export default app;