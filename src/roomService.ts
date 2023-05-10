import admin from './firebase';
import { Room, Message } from './models';

const db = admin.firestore();

export const getOrCreateRoom = async (ownerId: string, messageLimit: number): Promise<Room | null> => {
  const roomsCollection = db.collection('rooms');

  // Check if room exists for the owner
  const snapshot = await roomsCollection.where('ownerId', '==', ownerId).limit(1).get();
  
  if (!snapshot.empty) {
    // Room exists
    const room = snapshot.docs[0].data() as Room;
    room.messages = room.messages.slice(0, messageLimit); // TODO: Performance?
    return room;
  } else {
    const botId = 'CareBot v0.0.1'; // TODO: Replace with bot management service
    // Create new room
    const room: Room = {
      id: '',
      ownerId: ownerId,
      botId: botId, 
      participantIds: [ownerId, botId],
      createdAt: new Date(),
      messages: [],
    };

    const docRef = await roomsCollection.add(room);
    room.id = docRef.id;

    return room;
  }
};

export const addMessageToRoom = async (roomId: string, userId: string, text: string): Promise<Message | null> => {
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
    const message = {
      id: '',
      userId: userId,
      text: text,
      createdAt: new Date(),
    };

    const docRef = await roomsCollection.doc(roomId).collection('messages').add(message);
    message.id = docRef.id;
    room.messages.push(message);

    return message;
  }
}

// New error class for Unauthorized errors
export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}