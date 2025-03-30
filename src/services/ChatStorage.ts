import {MMKV} from 'react-native-mmkv';
import {Chat, ChatHistory, Message} from '../types/chat';

// Use MMKV as local storage
const storage = new MMKV();
const CHAT_HISTORY_KEY = 'chat_history';

// Helper function to generate unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

// Get chat history
export const getChatHistory = (): ChatHistory => {
  const stored = storage.getString(CHAT_HISTORY_KEY);
  if (!stored) {
    return {chats: {}, currentChatId: null};
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse chat history:', error);
    return {chats: {}, currentChatId: null};
  }
};

// Save chat history
export const saveChatHistory = (history: ChatHistory): void => {
  storage.set(CHAT_HISTORY_KEY, JSON.stringify(history));
};

// Create new chat session
export const createChat = (modelName: string): Chat => {
  const now = Date.now();
  const chatId = generateId();

  const newChat: Chat = {
    id: chatId,
    title: `New Conversation ${new Date(now).toLocaleTimeString()}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
    modelName,
  };

  const history = getChatHistory();
  history.chats[chatId] = newChat;
  history.currentChatId = chatId;
  saveChatHistory(history);

  return newChat;
};

// Add message to chat session
export const addMessage = (chatId: string, role: 'user' | 'assistant', content: string): Message => {
  const history = getChatHistory();
  const chat = history.chats[chatId];

  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }

  const message: Message = {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };

  chat.messages.push(message);
  chat.updatedAt = Date.now();

  // If it's a user message, can update the conversation title based on content
  if (role === 'user' && chat.messages.length <= 2) {
    // Take the first 20 characters of the user's first message as the title
    chat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
  }

  saveChatHistory(history);
  return message;
};

// Get a specific chat session
export const getChat = (chatId: string): Chat | null => {
  const history = getChatHistory();
  return history.chats[chatId] || null;
};

// Delete chat session
export const deleteChat = (chatId: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    delete history.chats[chatId];

    // If the deleted chat is the current session, need to reset currentChatId
    if (history.currentChatId === chatId) {
      const chatIds = Object.keys(history.chats);
      history.currentChatId = chatIds.length > 0 ? chatIds[0] : null;
    }

    saveChatHistory(history);
  }
};

// Update chat title
export const updateChatTitle = (chatId: string, title: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    history.chats[chatId].title = title;
    saveChatHistory(history);
  }
};

// Set the current active chat session
export const setCurrentChat = (chatId: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    history.currentChatId = chatId;
    saveChatHistory(history);
  }
};
