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

export const botService = async (room: Room): Promise<Message | null> => {
  console.log("Asking bot for response...");
  if(!room.id){
    throw new Error("Room id is undefined");
  }
  const roomId = room.id!;
  try {
    const basePrompt = "The following is a conversation with an AI counsler. The counselor is trained to listen to the client, reflect and ask open questions.\n\n";
    
    const contextPrompt = getRoomScript(room);
    const endPrompt = "\nCounselor:"

    const finalPrompt = basePrompt + contextPrompt + endPrompt;
    
    console.log("Final prompt:");
    console.log(finalPrompt);
    
    const response = await botResponse(finalPrompt);
    if (response) {
      console.log("Response received from bot:");
      console.log(response);
      // Add the bot response as a new message in the room
      const roomsCollection = db.collection('rooms');
      const roomRef = roomsCollection.doc(roomId);
      await roomRef.collection('messages').add(response);
      response.id = roomRef.id;
      return response;
    }
  } catch (error) {
    console.log(error);
  }

  console.log("Not sending a response to the room.");
  return null;
};

export const botResponse = async (prompt: string): Promise<Message | null> => {
  try {
    const completion = await openai.createCompletion({
      model: "davinci:ft-martin-anderson-personal-2023-04-28-17-55-38",
      prompt: prompt,
      max_tokens: 120,
      temperature: 0.7,
      stop: ["END", "\n", "Client"]
    });

    console.log("Bot response data:");
    console.log(completion.data);

    const message = newBotMessage(completion.data.choices[0].text.trim());

    return message;
  } catch (error) {
    console.log(error);
  }

  return null;
};

function newBotMessage(text: string): Message {
  return {
    userId: botId,
    text: text,
    createdAt: new Date(),
  };
}

// An exported non async function that returns a default welcome message string
export function getWelcomeMessage(): Message {
  return newBotMessage("Hello, I'm a bot trained in reflective listening. What can I help you with?");
}


// Define a function that iterates over the messsages in a room and adds them to a String the function is not async
function getRoomScript(room: Room): string {
  const initPrompt = `
Counselor: Hello, I'm a bot trained in reflective listening. What can I help you with?
Client: Hello, I'm looking for some help with my stress.
Counselor: I see what is causing your stress?
Client: `
  // if the room has less than three messages, return the initPrompt
  if (room.messages.length < 3) {
    return initPrompt;
  }

  let lastTwenty = room.messages;
  // if the room has more than 20 messages, return the last 20 messages
  if (room.messages.length > 20) {
    lastTwenty = room.messages.slice(0, 20);
  }

  // if the message is from the bot, add a Counselor: prefix
  const messageTextPrefixed = lastTwenty.reverse().map(message => {
    if (message.userId.startsWith("CareBot")) {
      return "Counselor: " + message.text;
    } else {
      return "Client: " + message.text;
    }
  });

  // if the last messagesPrefixed is from the bot, remove it from the array
  if (messageTextPrefixed[messageTextPrefixed.length - 1].startsWith("Counselor:")) {
    messageTextPrefixed.pop();
  }
  
  const text = messageTextPrefixed.join("\n");
  return text;
}