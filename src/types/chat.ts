export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type ChatMode = 'conversation' | 'singleInteractive';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  mode: ChatMode;
  userPrompt: string;
  createdAt: number;
  updatedAt: number;
  modelName: string;
}

export interface ChatHistory {
  chats: { [id: string]: Chat };
  currentChatId: string | null;
}

