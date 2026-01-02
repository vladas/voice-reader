import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { IFileSystem } from '../adapters/IFileSystem';

// Define the interface for the repository (for testing/mocking)
export interface IBookRepository {
  getBooks(): Promise<import('../storage/BookRepository').Book[]>;
  getBook(id: string): Promise<import('../storage/BookRepository').Book | undefined>;
  addBook(sourceUri: string): Promise<import('../storage/BookRepository').Book>;
  updateBookProgress(id: string, location: string, progress: number): Promise<void>;
  clearAll(): Promise<void>;
}

interface BookRepositoryContextValue {
  bookRepository: IBookRepository;
  fileSystem: IFileSystem;
}

const BookRepositoryContext = createContext<BookRepositoryContextValue | null>(null);

interface BookRepositoryProviderProps {
  children: ReactNode;
  repository: IBookRepository; // Required - no default to avoid import chain
  fileSystem: IFileSystem; // Required - no default to avoid import chain
}

export const BookRepositoryProvider = ({ 
  children, 
  repository,
  fileSystem
}: BookRepositoryProviderProps) => {
  const value = useMemo(() => ({
    bookRepository: repository,
    fileSystem: fileSystem
  }), [repository, fileSystem]);

  return (
    <BookRepositoryContext.Provider value={value}>
      {children}
    </BookRepositoryContext.Provider>
  );
};

export const useBookRepository = (): IBookRepository => {
  const context = useContext(BookRepositoryContext);
  if (!context) {
    throw new Error('useBookRepository must be used within a BookRepositoryProvider');
  }
  return context.bookRepository;
};

export const useFileSystem = (): IFileSystem => {
  const context = useContext(BookRepositoryContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a BookRepositoryProvider');
  }
  return context.fileSystem;
};
