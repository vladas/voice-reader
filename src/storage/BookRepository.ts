import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { EpubParser } from '../utils/EpubParser';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  location: string;
  uri: string;
  lastRead?: number;
  progress?: number;
}

const BOOKS_KEY = '@voice_reader_books';

export const BookRepository = {
  async getBooks(): Promise<Book[]> {
    try {
      const json = await AsyncStorage.getItem(BOOKS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load books', e);
      return [];
    }
  },

  async addBook(sourceUri: string): Promise<Book> {
    const id = Date.now().toString();
    const booksDir = `${FileSystem.documentDirectory as string}books/`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(booksDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
    }

    const destUri = `${booksDir}${id}.epub`;

    // 1. Copy file to app storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri
    });

    // 2. Parse metadata
    let metadata;
    try {
      metadata = await EpubParser.parse(destUri);
    } catch (e) {
      console.warn('Failed to parse metadata, using defaults', e);
      metadata = { title: 'Unknown Book', author: 'Unknown Author' };
    }

    const newBook: Book = {
      id,
      title: metadata.title,
      author: metadata.author,
      location: '',
      uri: destUri,
      lastRead: Date.now(),
      progress: 0,
    };

    // 3. Save to list
    const books = await this.getBooks();
    const updatedBooks = [newBook, ...books];
    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

    return newBook;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(BOOKS_KEY);
    const booksDir = `${FileSystem.documentDirectory as string}books/`;
    await FileSystem.deleteAsync(booksDir, { idempotent: true });
  }
};
