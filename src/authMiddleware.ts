import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from './types';
import admin from './firebase';

async function authMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log('Error verifying token:', error);
    res.status(401).send('Unauthorized');
  }
}

export default authMiddleware;
