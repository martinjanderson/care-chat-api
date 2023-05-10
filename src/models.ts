export interface Message {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface Room {
  id: string;
  ownerId: string;
  botId: string;
  participantIds: string[];
  createdAt: Date;
  messages: Message[];
}
