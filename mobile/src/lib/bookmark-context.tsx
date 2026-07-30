import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BookmarkContextType = {
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => Promise<void>;
  isBookmarked: (id: string) => boolean;
};

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarkedIds: [],
  toggleBookmark: async () => {},
  isBookmarked: () => false,
});

export const BookmarkProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load from local storage on mount
    AsyncStorage.getItem('@bookmarked_recipes').then((data) => {
      if (data) {
        try {
          setBookmarkedIds(JSON.parse(data));
        } catch (e) {
          console.error('Failed to parse bookmarks', e);
        }
      }
    });
  }, []);

  const toggleBookmark = async (id: string) => {
    setBookmarkedIds((prev) => {
      const isSaved = prev.includes(id);
      const next = isSaved ? prev.filter((item) => item !== id) : [...prev, id];
      // Save to local storage asynchronously
      AsyncStorage.setItem('@bookmarked_recipes', JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const isBookmarked = (id: string) => bookmarkedIds.includes(id);

  return (
    <BookmarkContext.Provider value={{ bookmarkedIds, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => useContext(BookmarkContext);
