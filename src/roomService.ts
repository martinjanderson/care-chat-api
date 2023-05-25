import admin from './firebase';
import { IRoom, Room, Message } from './models';
import { getWelcomeMessage } from './botService';

const db = admin.firestore();

export const getOrCreateRoom = async (ownerId: string, messageLimit: number): Promise<Room | null> => {
  const roomsCollection = db.collection('rooms');

  // Check if room exists for the owner
  const snapshot = await roomsCollection.where('ownerId', '==', ownerId).limit(1).get();
  
  if (!snapshot.empty) {
    // Room exists
    const doc = snapshot.docs[0];
    // Instantiate room with doc.data()
    const room = new Room(doc.data() as IRoom);
    room.id = doc.id;
      
    return loadRoomMessages(room);
  } else {
    const botId = 'CareBot v0.0.1'; // TODO: Replace with bot management service

    // Create a new room when one does not exist
    const room = new Room({
      ownerId: ownerId,
      botId: botId,
      participantIds: [],
      createdAt: new Date(),
      messages: [],
    });
    
    const roomRef = await roomsCollection.add(room);
    room.id = roomRef.id;
    roomRef.collection('messages').add(getWelcomeMessage());

    return loadRoomMessages(room);
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

    const room = new Room(snapshot.data() as IRoom);
    room.id = snapshot.id;
    const message: Message = {
      userId: userId,
      text: text,
      createdAt: new Date(),
    };

    const docRef = await roomsCollection.doc(roomId).collection('messages').add(message);
    // Fetch the document again to get the most recent representation
    const docSnapshot = await docRef.get();
    const updatedMessage = docSnapshot.data() as Message;
    updatedMessage.id = docSnapshot.id;

    // Update the room's lastClientMessage with the updatedMessage
    room.lastClientMessage = updatedMessage;

    // TODO: Duplicate, need to consolidate room fetching
    return await loadRoomMessages(room);
  }
}

// Function to get all messages from the room collection specified by Room object and hydrate the Room.messages array
export const loadRoomMessages = async (room: Room): Promise<Room | null> => {
  if(room.id === undefined){ throw new Error("Room id is undefined"); }
  const messagesSnapshot = await db.collection('rooms').doc(room.id).collection('messages').orderBy('createdAt', 'desc').limit(50).get();
  room.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  return room;
}

// New error class for Unauthorized errors
export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}