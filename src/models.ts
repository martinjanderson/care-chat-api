export interface Message {
  id?: string;
  userId: string;
  text: string;
  createdAt: Date;
  meta?: Meta;
}

export interface Meta {
  type: string;
}

export interface IRoom {
  id?: string;
  ownerId: string;
  botId: string;
  participantIds: string[];
  createdAt: Date;
  messages: Message[];
  lastClientMessage?: Message;
}

export class Room {
  id?: string;
  ownerId: string;
  botId: string;
  participantIds: string[];
  createdAt: Date;
  messages: Message[];
  lastClientMessage?: Message;

  constructor(room: IRoom) {
    this.ownerId = room.ownerId;
    this.botId = room.botId;
    this.participantIds = room.participantIds;
    this.createdAt = room.createdAt;
    this.messages = room.messages;
    this.lastClientMessage = room.lastClientMessage;
  }

  // Method to retrieve messages that are not of userId "command-response"
  conversationMessages(): Message[] {
    return this.messages.filter(message => message.userId !== 'command-response');
  }
}