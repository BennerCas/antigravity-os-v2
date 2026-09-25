import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  id: string;
  theme: string;
  flowName: string;
  detectedAgents: string[];
  updatedAt: string;
  snapshot: any;
}

interface HistoryState {
  historyItems: HistoryItem[];
  currentHistoryId: string | null;
  saveCurrentToHistory: (snapshot: any) => void;
  loadHistoryItem: (id: string, restoreCallback: (snapshot: any) => void) => void;
  deleteHistoryItem: (id: string) => void;
  setCurrentHistoryId: (id: string | null) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      historyItems: [],
      currentHistoryId: null,
      saveCurrentToHistory: (snapshot) => {
        let id = get().currentHistoryId;
        if (!id) {
          id = Date.now().toString();
          set({ currentHistoryId: id });
        }
        
        const firstUserMsg = snapshot.chatMessages?.find((m: any) => m.role === 'human')?.content || 'Nuevo Chat';
        const theme = firstUserMsg.substring(0, 50) + (firstUserMsg.length > 50 ? '...' : '');
        
        const flowNameRaw = snapshot.triageSummary || 'Sin Objetivo Definido';
        const flowName = flowNameRaw.substring(0, 40) + (flowNameRaw.length > 40 ? '...' : '');
        
        const detectedAgents = (snapshot.agentCards || []).map((c: any) => c.name);

        const newItem: HistoryItem = {
          id,
          theme,
          flowName,
          detectedAgents,
          updatedAt: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(snapshot))
        };

        set((state) => {
          const existingIndex = state.historyItems.findIndex(i => i.id === id);
          const newItems = [...state.historyItems];
          if (existingIndex >= 0) {
            newItems[existingIndex] = newItem;
          } else {
            newItems.unshift(newItem); // put at beginning
          }
          // Sort by updatedAt descending
          newItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          return { historyItems: newItems };
        });
      },
      loadHistoryItem: (id, restoreCallback) => {
        const item = get().historyItems.find(i => i.id === id);
        if (item) {
          set({ currentHistoryId: id });
          restoreCallback(item.snapshot);
        }
      },
      deleteHistoryItem: (id) => {
        set((state) => ({
          historyItems: state.historyItems.filter(i => i.id !== id),
          currentHistoryId: state.currentHistoryId === id ? null : state.currentHistoryId
        }));
      },
      setCurrentHistoryId: (id) => set({ currentHistoryId: id })
    }),
    {
      name: 'agentos-history-storage'
    }
  )
);
