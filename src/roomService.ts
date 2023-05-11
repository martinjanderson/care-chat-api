import admin from './firebase';
import { Room, Message } from './models';

const db = admin.firestore();

export const getOrCreateRoom = async (ownerId: string, messageLimit: number): Promise<Room | null> => {
  const roomsCollection = db.collection('rooms');

  // Check if room exists for the owner
  const snapshot = await roomsCollection.where('ownerId', '==', ownerId).limit(1).get();
  
  if (!snapshot.empty) {
    // Room exists
    const doc = snapshot.docs[0];
    const room: Room = doc.data() as Room
    room.id = doc.id;
      
    const messagesSnapshot = await db.collection('rooms').doc(room.id).collection('messages').orderBy('createdAt', 'desc').limit(messageLimit).get();
    room.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];

    return room;
  } else {
    const botId = 'CareBot v0.0.1'; // TODO: Replace with bot management service

    const room: Room = {
      ownerId: ownerId,
      botId: botId,
      participantIds: [],
      createdAt: new Date(),
      messages: [],
    };
    
    const docRef = await roomsCollection.add(room);
    room.id = docRef.id;

    return room;
  }
};

export const addMessageToRoom = async (roomId: string, userId: string, text: string): Promise<Room | null> => {
  const roomsCollection = db.collection('rooms');

  // Check if room exists for the owner
  const snapshot = await roomsCollection.doc(roomId).get();

  if (!snapshot.exists) {
    // Room does not exist
    return null;
  } else {
    // Throw an exception if the userId is not the owner of the room
    if (snapshot.data()?.ownerId !== userId) {
      throw new UnauthorizedError();
    }

    const room = snapshot.data() as Room;
    room.id = snapshot.id;
    const message: Message = {
      userId: userId,
      text: text,
      createdAt: new Date(),
    };

    const docRef = await roomsCollection.doc(roomId).collection('messages').add(message);
    message.id = docRef.id;
    room.lastClientMessage = message;

    // TODO: Duplicate, need to consolidate room fetching
    const messagesSnapshot = await db.collection('rooms').doc(room.id).collection('messages').orderBy('createdAt', 'desc').limit(50).get();
    room.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];

    return room;
  }
}

// New error class for Unauthorized errors
export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}