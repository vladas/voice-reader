// BookRepository.ts - Book storage management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EpubParser } from '../utils/EpubParser';
import { Buffer } from 'buffer';
import { IFileSystem } from '../adapters/IFileSystem';

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

export class BookRepository {
  private fileSystem: IFileSystem;

  constructor(fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
  }

  async getBooks(): Promise<Book[]> {
    try {
      const json = await AsyncStorage.getItem(BOOKS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load books', e);
      return [];
    }
  }

  async getBook(id: string): Promise<Book | undefined> {
    const books = await this.getBooks();
    return books.find(b => b.id === id);
  }

  async addBook(sourceUri: string): Promise<Book> {
    const id = Date.now().toString();
    const docPath = this.fileSystem.getDocumentPath();
    const booksPath = this.fileSystem.joinPath(docPath, 'books');
    const coversPath = this.fileSystem.joinPath(docPath, 'covers');
    
    // Ensure directories exist
    if (!this.fileSystem.directoryExists(booksPath)) {
      this.fileSystem.createDirectory(booksPath);
    }
    if (!this.fileSystem.directoryExists(coversPath)) {
      this.fileSystem.createDirectory(coversPath);
    }

    const destUri = this.fileSystem.joinPath(booksPath, `${id}.epub`);

    // 1. Copy file to app storage
    await this.fileSystem.copyFile(sourceUri, destUri);

    // 2. Parse metadata
    let metadata;
    try {
      metadata = await EpubParser.parse(destUri, this.fileSystem);
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

    // 3. Save Cover if available
    if (metadata.cover) {
      try {
        const coverUri = this.fileSystem.joinPath(coversPath, `${id}.jpg`);
        let buffer: Buffer;

        if (metadata.cover.startsWith('blob:')) {
          // It's a Blob URL, we need to fetch it
          const response = await fetch(metadata.cover);
          const arrayBuffer = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else {
          // Assume It's a Base64 Data URI
          // Remove data URI prefix if present
          const base64Data = metadata.cover.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(base64Data, 'base64');
        }

        // Write cover image
        const base64String = buffer.toString('base64');
        await this.fileSystem.writeBase64(coverUri, base64String);
        
        newBook.cover = coverUri;
      } catch (e) {
        console.warn('Failed to save cover image', e);
      }
    }

    // 4. Save to list
    const books = await this.getBooks();
    const updatedBooks = [newBook, ...books];
    await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

    return newBook;
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(BOOKS_KEY);
    const docPath = this.fileSystem.getDocumentPath();
    const booksPath = this.fileSystem.joinPath(docPath, 'books');
    const coversPath = this.fileSystem.joinPath(docPath, 'covers');
    
    this.fileSystem.deleteDirectory(booksPath);
    this.fileSystem.deleteDirectory(coversPath);
  }
}
