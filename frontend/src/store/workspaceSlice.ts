import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
}

export interface UserState {
  id: number;
  username: string;
  email: string;
  role: string;
  mfa_enabled: boolean;
}

export interface UserSettings {
  theme: 'dark-theme' | 'light-theme';
  font_size: number;
  autosave: boolean;
  format_on_save: boolean;
  gemini_api_key?: string;
}

interface WorkspaceState {
  openFiles: string[];
  activeFile: string | null;
  fileTree: FileNode | null;
  selectedPanel: string;
  terminalSessions: string[];
  activeTerminal: string | null;
  aiSidebarOpen: boolean;
  user: UserState | null;
  settings: UserSettings;
  token: string | null;
}

const initialState: WorkspaceState = {
  openFiles: [],
  activeFile: null,
  fileTree: null,
  selectedPanel: 'explorer',
  terminalSessions: ['term-1'],
  activeTerminal: 'term-1',
  aiSidebarOpen: true,
  user: {
    id: 1,
    username: "mygo-user",
    email: "dev@mygo.internal",
    role: "Admin",
    mfa_enabled: false
  },
  settings: {
    theme: 'dark-theme',
    font_size: 14,
    autosave: true,
    format_on_save: true,
    gemini_api_key: ''
  },
  token: 'simulated-jwt-token-1'
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setFileTree(state, action: PayloadAction<FileNode | null>) {
      state.fileTree = action.payload;
    },
    openFile(state, action: PayloadAction<string>) {
      const filePath = action.payload;
      if (!state.openFiles.includes(filePath)) {
        state.openFiles.push(filePath);
      }
      state.activeFile = filePath;
    },
    closeFile(state, action: PayloadAction<string>) {
      const filePath = action.payload;
      state.openFiles = state.openFiles.filter(p => p !== filePath);
      if (state.activeFile === filePath) {
        state.activeFile = state.openFiles.length > 0 ? state.openFiles[state.openFiles.length - 1] : null;
      }
    },
    setActiveFile(state, action: PayloadAction<string | null>) {
      state.activeFile = action.payload;
    },
    setSelectedPanel(state, action: PayloadAction<string>) {
      state.selectedPanel = action.payload;
    },
    addTerminal(state, action: PayloadAction<string>) {
      state.terminalSessions.push(action.payload);
      state.activeTerminal = action.payload;
    },
    removeTerminal(state, action: PayloadAction<string>) {
      state.terminalSessions = state.terminalSessions.filter(id => id !== action.payload);
      if (state.activeTerminal === action.payload) {
        state.activeTerminal = state.terminalSessions.length > 0 ? state.terminalSessions[state.terminalSessions.length - 1] : null;
      }
    },
    setActiveTerminal(state, action: PayloadAction<string | null>) {
      state.activeTerminal = action.payload;
    },
    toggleAISidebar(state) {
      state.aiSidebarOpen = !state.aiSidebarOpen;
    },
    setAISidebarOpen(state, action: PayloadAction<boolean>) {
      state.aiSidebarOpen = action.payload;
    },
    setUser(state, action: PayloadAction<UserState | null>) {
      state.user = action.payload;
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    updateSettings(state, action: PayloadAction<Partial<UserSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    }
  }
});

export const {
  setFileTree,
  openFile,
  closeFile,
  setActiveFile,
  setSelectedPanel,
  addTerminal,
  removeTerminal,
  setActiveTerminal,
  toggleAISidebar,
  setAISidebarOpen,
  setUser,
  setToken,
  updateSettings
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
