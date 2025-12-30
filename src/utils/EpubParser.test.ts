import { EpubParser } from './EpubParser';
import * as FileSystem from 'expo-file-system';
import ePub from 'epubjs';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// Mock epubjs
jest.mock('epubjs', () => {
  return jest.fn(() => ({
    ready: Promise.resolve(),
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
    
    // Mock FS response
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('mockbase64data');

    // WHEN we call parse
    const book = await EpubParser.parse(mockUri);

    // THEN it should read the file from FS
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(mockUri, { encoding: 'base64' });

    // AND it should initialize epubjs with buffer (we can't easily check the buffer content equality here without checking how we construct it, but we can check it was called)
    expect(ePub).toHaveBeenCalled();

    // AND it should return the book metadata
    expect(book).toEqual(expect.objectContaining({
      title: 'Mock Title',
      author: 'Mock Author',
    }));
  });
});

