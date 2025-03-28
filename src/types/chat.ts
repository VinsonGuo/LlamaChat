export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelName: string;
}

export interface ChatHistory {
  chats: { [id: string]: Chat };
  currentChatId: string | null;
}

