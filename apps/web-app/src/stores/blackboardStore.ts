import { create } from 'zustand';

export interface BlackboardState {
  store: Record<string, any>;
  
  // Actions
  updateEntry: (key: string, value: any) => void;
  removeEntry: (key: string) => void;
  setStore: (newStore: Record<string, any>) => void;
  clearStore: () => void;
}

export const useBlackboardStore = create<BlackboardState>((set) => ({
  store: {},
  
  updateEntry: (key, value) => 
    set((state) => ({
      store: {
        ...state.store,
        [key]: value
      }
    })),
    
  removeEntry: (key) => 
    set((state) => {
      const newStore = { ...state.store };
      delete newStore[key];
      return { store: newStore };
    }),
    
  setStore: (newStore) => 
    set(() => ({
      store: newStore
    })),
    
  clearStore: () => 
    set(() => ({
      store: {}
    }))
}));
