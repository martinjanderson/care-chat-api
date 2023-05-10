import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from './types';
import admin from './firebase';

const authenticate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).send('Unauthorized');
    }
  
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).send('Unauthorized');
    }
}

export const protectEndpoints = (skipEndpoints: string[], middleware = authenticate) => {
    const skippedEndpoints = new Set(skipEndpoints);
  
    return (req: Request, res: Response, next: NextFunction) => {
      const currentEndpoint = `${req.method}:${req.baseUrl}${req.path}`;
  
      if (skippedEndpoints.has(currentEndpoint)) {
        return next();
      }
  
      return middleware(req, res, next);
    };
  };

  
