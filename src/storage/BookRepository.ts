import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  File,
  Directory,
  Paths
} from 'expo-file-system';
import { EpubParser } from '../utils/EpubParser';
import { Buffer } from 'buffer';

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
    // Use Paths.document if available, else standard URI construction
    // Docs say: new Directory(Paths.document, "books")
    
    // Check if Paths.document is available in the types we saw. 
    // Yes: static get document(): Directory;
    
    const booksDir = new Directory(Paths.document, 'books');
    const coversDir = new Directory(Paths.document, 'covers');
    
    // Ensure directories exist
    if (!booksDir.exists) {
      booksDir.create();
    }
    if (!coversDir.exists) {
      coversDir.create();
    }

    const destFile = new File(booksDir, `${id}.epub`);
    const sourceFile = new File(sourceUri);

    // 1. Copy file to app storage
    sourceFile.copy(destFile);

    // 2. Parse metadata
    let metadata;
    try {
      metadata = await EpubParser.parse(destFile.uri);
    } catch (e) {
      console.warn('Failed to parse metadata, using defaults', e);
      metadata = { title: 'Unknown Book', author: 'Unknown Author' };
    }

    const newBook: Book = {
      id,
      title: metadata.title,
      author: metadata.author,
      location: '',
      uri: destFile.uri,
      lastRead: Date.now(),
      progress: 0,
    };

    // 3. Save Cover if available
    if (metadata.cover) {
      try {
        const coverFile = new File(coversDir, `${id}.jpg`);
        // Remove data URI prefix if present
        const base64Data = metadata.cover.replace(/^data:image\/\w+;base64,/, "");
        
        // write(content: string | Uint8Array)
        // Check if write accepts base64 string automatically or needs specific handling.
        // The type signature says `content: string | Uint8Array`. usually fs writes strings as utf8.
        // But for image data we need base64 decoding usually. 
        // Docs for `write` options? `options?: FileWriteOptions`.
        // Let's assume we might need to convert to Uint8Array first or passed simple string.
        // Actually, the legacy `writeAsStringAsync` had `encoding` option. 
        // The new `write` might expect bytes for binary.
        
        const buffer = Buffer.from(base64Data, 'base64');
        coverFile.write(buffer);
        
        newBook.cover = coverFile.uri;
      } catch (e) {
        console.warn('Failed to save cover image', e);
      }
    }

    // 4. Save to list
    const books = await this.getBooks();
    const updatedBooks = [newBook, ...books];
    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

    return newBook;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(BOOKS_KEY);
    const booksDir = new Directory(Paths.document, 'books');
    const coversDir = new Directory(Paths.document, 'covers');
    
    if (booksDir.exists) booksDir.delete();
    if (coversDir.exists) coversDir.delete();
  }
};
