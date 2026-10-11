import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type BookmarkType = 'problem' | 'day' | 'library';

export interface BookmarkItem {
  id: string;
  type: BookmarkType;
  addedAt: string;
}

interface BookmarkState {
  bookmarks: Record<string, BookmarkItem>;
  
  toggleBookmark: (id: string, type: BookmarkType) => void;
  isBookmarked: (id: string) => boolean;
  getBookmarksByType: (type: BookmarkType) => BookmarkItem[];
  removeBookmark: (id: string) => void;
  clearAll: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      
      toggleBookmark: (id, type) => {
        const state = get();
        if (state.bookmarks[id]) {
          const { [id]: _, ...rest } = state.bookmarks;
          set({ bookmarks: rest });
        } else {
          set({
            bookmarks: {
              ...state.bookmarks,
              [id]: { id, type, addedAt: new Date().toISOString() },
            },
          });
        }
      },
      
      isBookmarked: (id) => !!get().bookmarks[id],
      
      getBookmarksByType: (type) =>
        Object.values(get().bookmarks)
          .filter((b) => b.type === type)
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
      
      removeBookmark: (id) => {
        const { [id]: _, ...rest } = get().bookmarks;
        set({ bookmarks: rest });
      },
      
      clearAll: () => set({ bookmarks: {} }),
    }),
    {
      name: 'dsa-sheet-bookmarks-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
