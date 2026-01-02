import { BookRepository } from './BookRepository';
import { IFileSystem } from '../adapters/IFileSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Manual Mock for AsyncStorage
const mockAsyncStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    for (const key in mockAsyncStorage) delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
}));

// Mock FileSystem
const createMockFileSystem = (): IFileSystem => ({
  readBytes: jest.fn(),
  writeBase64: jest.fn(),
  copyFile: jest.fn().mockResolvedValue(undefined),
  directoryExists: jest.fn().mockReturnValue(true),
  createDirectory: jest.fn(),
  deleteDirectory: jest.fn(),
  getDocumentPath: jest.fn().mockReturnValue('file:///test'),
  joinPath: jest.fn((...parts) => parts.join('/')),
});

// Mock EpubParser
jest.mock('../utils/EpubParser', () => ({
  EpubParser: {
    parse: jest.fn().mockResolvedValue({ title: 'T', author: 'A' }),
  },
}));

describe('BookRepository', () => {
  let repository: BookRepository;
  let mockFileSystem: IFileSystem;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockFileSystem = createMockFileSystem();
    repository = new BookRepository(mockFileSystem);
  });

  it('updates book progress', async () => {
    // 1. Add a book
    const book = await repository.addBook('file:///source.epub');
    expect(book.location).toBe('');

    // 2. Update progress
    await repository.updateBookProgress(book.id, 'epubcfi(/6/4!/4/2)', 0.5);

    // 3. Verify in memory/storage
    const updatedBook = await repository.getBook(book.id);
    expect(updatedBook).toBeDefined();
    expect(updatedBook?.location).toBe('epubcfi(/6/4!/4/2)');
    expect(updatedBook?.progress).toBe(0.5);
    
    // Verify persistence
    const allBooks = await repository.getBooks();
    expect(allBooks[0].location).toBe('epubcfi(/6/4!/4/2)');
  });

  it('ignores update for non-existent book', async () => {
    await repository.updateBookProgress('fake-id', 'loc', 0.5);
    const books = await repository.getBooks();
    expect(books).toHaveLength(0);
  });
});
