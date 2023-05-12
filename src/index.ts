
import express, { Request, Response } from 'express';
import http from 'http';
import { protectEndpoints } from './authMiddleware';
import { RequestWithUser } from './types';
import { getOrCreateRoom, addMessageToRoom, UnauthorizedError } from './roomService';
import morgan from 'morgan';
import cors from 'cors';
import { botService } from './botService';
import { Server as IoServer, Socket } from 'socket.io';
import admin from './firebase';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(protectEndpoints(['GET:/healthcheck']));

const port = 3000;
const httpServer = http.createServer(app);
const io = new IoServer(httpServer);

const userSockets: Record<string, Socket> = {};

io.on('connection', (socket: Socket) => {
  console.log('User connection attempt...');
  socket.on('authenticate', async (data) => {
    const { token } = data;

    // Do your authentication logic here
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // If successful, store the authenticated user on the socket
      (socket as any).user = decodedToken;
      userSockets[decodedToken.uid] = socket;
    } catch (error) {
      // If authentication fails, disconnect the socket
      console.error('Authentication error', error);
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
    // Remove this user's socket from the map
    const user = (socket as any).user;
    if (user) {
      delete userSockets[user.uid];
    }
    console.log('A user disconnected');
  });
});


// An endpoint that returns server status
app.get('/healthcheck', (req, res) => {
  res.sendStatus(200);
});

// An /api/room endpoint based on openapi.yaml
app.get('/api/room', async (req: RequestWithUser, res: Response) => {
  const ownerId = req.user!.uid; // Assuming you have already setup Firebase authentication and `req.user` contains the authenticated user.
  const messageLimit = Number(req.query.messageLimit) || 50; // Default limit is 50 if not provided.

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

    const room = await addMessageToRoom(roomId, userId, req.body.text);
    if (!room) {
      res.status(404).send('Room not found');
      return;
    }
    if (!room.lastClientMessage) {
      res.status(500).send('Last message not saved');
      return;
    }
    
    botService(room).then((room) => {
      const userSocket = userSockets[userId];
      if (userSocket) {
        userSocket.emit('room', room);
      }
    });
    res.json(room.lastClientMessage);
    
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).send('Unauthorized');
    } else {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  }

  
});

httpServer.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});



export default app;