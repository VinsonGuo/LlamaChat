import {MMKV} from 'react-native-mmkv';
import {Chat, ChatHistory, Message} from '../types/chat';

// 使用MMKV作为本地存储
const storage = new MMKV();
const CHAT_HISTORY_KEY = 'chat_history';

// 生成唯一ID的辅助函数
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

// 获取聊天历史
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

// 保存聊天历史
export const saveChatHistory = (history: ChatHistory): void => {
  storage.set(CHAT_HISTORY_KEY, JSON.stringify(history));
};

// 创建新的聊天会话
export const createChat = (modelName: string): Chat => {
  const now = Date.now();
  const chatId = generateId();

  const newChat: Chat = {
    id: chatId,
    title: `新对话 ${new Date(now).toLocaleTimeString()}`,
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

// 添加消息到聊天会话
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

  // 如果是用户消息，可以根据内容更新对话标题
  if (role === 'user' && chat.messages.length <= 2) {
    // 取用户第一条消息的前20个字符作为标题
    chat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
  }

  saveChatHistory(history);
  return message;
};

// 获取指定的聊天会话
export const getChat = (chatId: string): Chat | null => {
  const history = getChatHistory();
  return history.chats[chatId] || null;
};

// 删除聊天会话
export const deleteChat = (chatId: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    delete history.chats[chatId];

    // 如果删除的是当前会话，需要重置currentChatId
    if (history.currentChatId === chatId) {
      const chatIds = Object.keys(history.chats);
      history.currentChatId = chatIds.length > 0 ? chatIds[0] : null;
    }

    saveChatHistory(history);
  }
};

// 更新聊天标题
export const updateChatTitle = (chatId: string, title: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    history.chats[chatId].title = title;
    saveChatHistory(history);
  }
};

// 设置当前活动的聊天会话
export const setCurrentChat = (chatId: string): void => {
  const history = getChatHistory();

  if (history.chats[chatId]) {
    history.currentChatId = chatId;
    saveChatHistory(history);
  }
};
