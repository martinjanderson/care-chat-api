import admin from './firebase';
import { Room, Message } from './models';
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const db = admin.firestore();


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const botId = 'CareBot v0.0.1'; // TODO: Replace with a better versioning system

export const botService = async (room: Room): Promise<Room | null> => {
  console.log("Asking bot for response...");
  if(!room.id){
    throw new Error("Room id is undefined");
  }
  const roomId = room.id!;
  try {
    const basePrompt = "The following is a conversation with a counselor with a background in psychology. The counselor is empethetic, curious, and can reflect and ask open questions.\n\n";
    
    const contextPrompt = getRoomScript(room);
    const endPrompt = "\nCounselor: \n\n###\n\n"

    const finalPrompt = basePrompt + contextPrompt + endPrompt;
    
    console.log("Final prompt:");
    console.log(finalPrompt);
    
    const response = await botResponse(finalPrompt, determineModelType(room));
    if (response) {
      console.log("Response received from bot:");
      console.log(response);
      // Add the bot response as a new message in the room
      const roomsCollection = db.collection('rooms');
      const roomRef = roomsCollection.doc(roomId);
      const doc = await roomRef.get();
      const room: Room = doc.data() as Room
      room.id = doc.id;
      await roomRef.collection('messages').add(response);
      const messagesSnapshot = await db.collection('rooms').doc(room.id).collection('messages').orderBy('createdAt', 'desc').limit(50).get();
      room.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      return room;
    }
  } catch (error) {
    console.log(error);
  }

  console.log("Not sending a response to the room.");
  return null;
};

export const botResponse = async (prompt: string, modelType: string): Promise<Message | null> => {
  try {
    let model = 'davinci:ft-martin-anderson-personal-2023-04-28-17-55-38';
    switch(modelType){
      case 'reflections':
        model = 'davinci:ft-martin-anderson-s-lab:reflections-2023-05-24-18-30-31';
        break;
      case 'questions':
        model = 'davinci:ft-martin-anderson-s-lab:open-questions-2023-05-23-19-43-05';
        break;
    };

    const completion = await openai.createCompletion({
      model: model,
      prompt: prompt,
      max_tokens: 256,
      temperature: 0.7,
      stop: ["END", "Client", "\n"]
    });

    console.log("Bot response data:");
    console.log(completion.data);

    const message = newBotMessage(completion.data.choices[0].text.trim(), modelType);

    return message;
  } catch (error) {
    console.log(error);
  }

  return null;
};

// A simple OARS algorithm to determine the model type based on the room message history
function determineModelType(room: Room): string {
  // If there are less than three messages, the bot should respond with a reflection
  if(room.conversationMessages().length < 3){
    return 'reflections';
  }
  // Get the last three messages in the room, only those sent by the bot, messages are ordered desc
  const lastThreeMessages: Message[] = room.conversationMessages().filter(message => message.userId.startsWith("CareBot")).slice(0, 3);
  console.log("Last three counselor messages:");
  console.log(lastThreeMessages);
  // If the messages are reflections, or are messing a meta.type, the bot should respond with a question
  if(lastThreeMessages.every(message => message.meta?.type === 'reflections')){
    return 'questions';
  }
  
  // Othewrise continue with reflections
  return 'reflections';
}

function newBotMessage(text: string, modelType: string): Message {
  return {
    userId: botId,
    text: text,
    createdAt: new Date(),
    meta: {
      type: modelType
    }
  };
}

// An exported non async function that returns a default welcome message string
export function getWelcomeMessage(): Message {
  return newBotMessage("Hello, I'm a bot trained in reflective listening. What can I help you with?", 'questions');
}


// Define a function that iterates over the messsages in a room and adds them to a String the function is not async
export function getRoomScript(room: Room): string {
  let initPrompt = "Counselor: Hello, I'm a bot trained in reflective listening. What can I help you with?\n"
  
  let lastTwenty = room.conversationMessages();
  // if the room has more than 20 messages, return the last 20 messages
  if (room.conversationMessages().length > 20) {
    lastTwenty = room.conversationMessages().slice(0, 20);
    initPrompt = "";
  }

  // if the message is from the bot, add a Counselor: prefix
  const messageTextPrefixed = getRoomScriptArray(lastTwenty);

  // if the last messagesPrefixed is from the bot, remove it from the array
  if (messageTextPrefixed[messageTextPrefixed.length - 1].startsWith("Counselor:")) {
    messageTextPrefixed.pop();
  }
  
  const text = initPrompt + messageTextPrefixed.join("\n");
  return text;
}

// Define a function that accepts the room message history and returns that history as an array of prefixed messages
export function getRoomScriptArray(messages: Message[]): string[] {
  const messageTextPrefixed = messages.reverse().map(message => {
    if (message.userId.startsWith("CareBot")) {
      return "Counselor: " + message.text;
    } else {
      return "Client: " + message.text;
    }
  });
  return messageTextPrefixed;
}