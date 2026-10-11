import { create } from 'zustand';

interface UIState {
  activeSheet: string | null;
  toasts: Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error'; }>;
  searchOpen: boolean;
  mobileNavOpen: boolean;
  
  openSheet: (id: string) => void;
  closeSheet: () => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>()((set, get) => ({
  activeSheet: null,
  toasts: [],
  searchOpen: false,
  mobileNavOpen: false,

  openSheet: (id) => set({ activeSheet: id }),
  closeSheet: () => set({ activeSheet: null }),
  
  addToast: (message, type = 'info') => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
