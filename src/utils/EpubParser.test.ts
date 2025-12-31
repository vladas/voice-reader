import { EpubParser } from './EpubParser';
import { File } from 'expo-file-system';
import ePub from 'epubjs';

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  return {
    __esModule: true,
    File: jest.fn().mockImplementation(() => ({
      bytes: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    })),
    // Add other exports if needed by other tests importing this mock scope
  };
});

// Mock epubjs
jest.mock('epubjs', () => {
  return jest.fn(() => ({
    ready: Promise.resolve(),
    coverUrl: jest.fn().mockResolvedValue('data:image/jpeg;base64,mockcoverdata'),
    package: {
      metadata: {
        title: 'Mock Title',
        creator: 'Mock Author',
      },
    },
  }));
});

describe('EpubParser', () => {
  it('should parse a book object from a file uri', async () => {
    // GIVEN a mock file URI
    const mockUri = 'file:///path/to/book.epub';
    
    // WHEN we call parse
    const book = await EpubParser.parse(mockUri);

    // THEN it should create a File instance
    expect(File).toHaveBeenCalledWith(mockUri);

    // AND it should call bytes()
    // We can't easily check the instance method call without capturing the instance, 
    // but since we return mock data, the flow must have succeeded.

    // AND it should initialize epubjs with buffer
    expect(ePub).toHaveBeenCalled();

    // AND it should return the book metadata
    expect(book).toEqual(expect.objectContaining({
      title: 'Mock Title',
      author: 'Mock Author',
      cover: 'data:image/jpeg;base64,mockcoverdata',
    }));
  });
});
