import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalSubscription {
  id: string;
  service_name: string;
  price: number;
  renewal_date: string;
  start_date?: string;
  category?: string;
  notes?: string;
  created_at: string;
}

interface LocalSubscriptionState {
  subscriptions: LocalSubscription[];
  loadSubscriptions: () => Promise<void>;
  addSubscription: (sub: Omit<LocalSubscription, 'id' | 'created_at'>) => Promise<void>;
  updateSubscription: (id: string, sub: Partial<LocalSubscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  clearSubscriptions: () => Promise<void>;
}

const STORAGE_KEY = 'local_subscriptions';

export const useLocalSubscriptionStore = create<LocalSubscriptionState>((set, get) => ({
  subscriptions: [],

  loadSubscriptions: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        set({ subscriptions: JSON.parse(data) });
      }
    } catch (error) {
      console.error('Error loading local subscriptions:', error);
    }
  },

  addSubscription: async (sub) => {
    const newSub: LocalSubscription = {
      ...sub,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const updated = [...get().subscriptions, newSub];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ subscriptions: updated });
  },

  updateSubscription: async (id, updates) => {
    const updated = get().subscriptions.map((sub) =>
      sub.id === id ? { ...sub, ...updates } : sub
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ subscriptions: updated });
  },

  deleteSubscription: async (id) => {
    const updated = get().subscriptions.filter((sub) => sub.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ subscriptions: updated });
  },

  clearSubscriptions: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ subscriptions: [] });
  },
}));
