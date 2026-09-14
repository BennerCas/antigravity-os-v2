import { create } from 'zustand';

export type TabId = 'discovery' | 'synthesis' | 'blueprint';

interface ChatMessage {
  id: string;
  role: 'human' | 'system' | 'agent';
  content: string;
  model?: string;
}

interface StudioState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  isFocusMode: boolean;
  setFocusMode: (focus: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  activeTab: 'discovery',
  setActiveTab: (tab) => set({ activeTab: tab }),
  chatMessages: [
    { id: '1', role: 'system', content: 'Welcome to AgentOS Studio. How can I help you build your system?' }
  ],
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString() }],
    })),
  isFocusMode: false,
  setFocusMode: (focus) => set({ isFocusMode: focus }),
}));
