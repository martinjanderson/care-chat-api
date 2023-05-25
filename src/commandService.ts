import admin from './firebase';
import { Room, Message } from './models';
import { getRoomScript } from './botService';

const db = admin.firestore();

// A function to extract a command from the request body, a command should start with a slash (/) 
// Return null if the command is not one of the following: /reset or /clear
export const getCommand = (text: string): string | null => {
    let command = null;
    if (text.startsWith('/')) {
        command = text.split(' ')[0].toLowerCase();
        command = command.replace('/', '');
    }

    if (command !== 'reset' && command !== 'clear') {
        command = null;
    }

    return command;
};

// A function to remove all messages from the room and update Firebase
export const reset = async (room: Room): Promise<Room> => {
  if(!room.id) { throw new Error('Cannot find room'); }
  const roomRef = db.collection('rooms').doc(room.id);
  await roomRef.collection('messages').get().then((snapshot) => {
      snapshot.docs.forEach(doc => {
          roomRef.collection('messages').doc(doc.id).delete();
      });
  });
  room.messages = [];
  return room;
};

// A function to add a new command-response message to the room 
// The message should have a userId of "command-response" and a text of all the messages in the room using getRoomScript
// Return the room
export const getScript = async (room: Room): Promise<Room> => {
  if(!room.id) { throw new Error('Cannot find room'); }
  const roomRef = db.collection('rooms').doc(room.id);
  const message: Message = {
    userId: 'command-response',
    text: getRoomScript(room),
    createdAt: new Date(),
  };
  await roomRef.collection('messages').add(message);
  room.messages.push(message);
  return room;
};


export const commandService = async (room: Room, text: string): Promise<Room | null> => {
    const command = getCommand(text);
    switch (command) {
      case 'reset':
      case 'clear':
        return await reset(room);
      case 'script':
        return await getScript(room);
      default:
        console.log(`Command ${command} not found`);
        return null;
    }
};

