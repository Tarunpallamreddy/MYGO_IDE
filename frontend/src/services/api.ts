import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Determine backend URL - fallback to port 5000 during dev
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // File System
  getFileTree: async () => {
    const res = await client.get('/api/files/tree');
    return res.data;
  },
  readFile: async (path: string) => {
    const res = await client.get(`/api/files/read?path=${encodeURIComponent(path)}`);
    return res.data.content;
  },
  writeFile: async (path: string, content: string) => {
    const res = await client.post('/api/files/write', { path, content });
    return res.data;
  },
  createItem: async (path: string, isDirectory: boolean) => {
    const res = await client.post('/api/files/create', { path, isDirectory });
    return res.data;
  },
  renameItem: async (oldPath: string, newPath: string) => {
    const res = await client.post('/api/files/rename', { oldPath, newPath });
    return res.data;
  },
  deleteItem: async (path: string) => {
    const res = await client.post('/api/files/delete', { path });
    return res.data;
  },
  uploadFile: async (path: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post(`/api/files/upload?path=${encodeURIComponent(path)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // AI Assistant
  chatWithAI: async (messages: any[], filePath?: string | null, selectedText?: string | null, fileContent?: string | null, apiKeyOverride?: string) => {
    const res = await client.post('/api/ai/chat', {
      messages,
      filePath,
      selectedText,
      fileContent,
      apiKeyOverride,
    });
    return res.data;
  },
  runAIAgent: async (agentType: string, prompt: string, filePath?: string | null, fileContent?: string | null, apiKeyOverride?: string) => {
    const res = await client.post('/api/ai/agent', {
      agentType,
      prompt,
      filePath,
      fileContent,
      apiKeyOverride,
    });
    return res.data;
  },
  scanSecurity: async () => {
    const res = await client.post('/api/ai/scan');
    return res.data;
  },

  // Settings
  getSettings: async (userId: number) => {
    const res = await client.get(`/api/settings/${userId}`);
    return res.data;
  },
  updateSettings: async (userId: number, settings: any) => {
    const res = await client.put(`/api/settings/${userId}`, settings);
    return res.data;
  },
  // Auth
  login: async (credentials: any) => {
    const res = await client.post('/api/auth/login', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await client.post('/api/auth/register', userData);
    return res.data;
  },
};

// Singleton socket connection
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};
