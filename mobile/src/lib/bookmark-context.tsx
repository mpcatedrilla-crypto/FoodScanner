import React, { createContext, useContext } from 'react';

// Deprecated: Save/Bookmarks feature has been completely removed
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

export const BookmarkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useBookmarks = () => useContext(BookmarkContext);
