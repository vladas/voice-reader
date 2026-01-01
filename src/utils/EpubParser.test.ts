import { EpubParser } from './EpubParser';
import { File } from 'expo-file-system';
import * as fs from 'fs';
import * as path from 'path';

// Use real epubjs
jest.unmock('epubjs');

// Mock expo-file-system to read from local fixture
jest.mock('expo-file-system', () => {
  const fs = require('fs');
  const path = require('path');
  return {
    __esModule: true,
    File: jest.fn().mockImplementation((uri) => ({
      bytes: jest.fn().mockImplementation(async () => {
        // Handle file:// uri or absolute path
        const filePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
      }),
    })),
  };
});

describe('EpubParser', () => {
  it('should parse a real epub file', async () => {
    // GIVEN a real fixture file URI
    const fixturePath = path.resolve(__dirname, '../__tests__/fixtures/sample.epub');
    const mockUri = `file://${fixturePath}`;
    
    // WHEN we call parse
    const book = await EpubParser.parse(mockUri);

    // THEN it should create a File instance
    expect(File).toHaveBeenCalledWith(mockUri);

    // AND it should return valid metadata
    // We check for truthy values since we don't know the exact content of the user's sample
    expect(book).toEqual(expect.objectContaining({
      title: expect.any(String),
      // We expect a valid cover string (base64 or url) from the real EPUB
      cover: expect.any(String),
    }));
    expect(book.cover).toBeDefined();
    expect(book.cover).toEqual(expect.any(String));

    // Verify the cover is a valid image by fetching the blob
    if (book.cover && book.cover.startsWith('blob:')) {
        const response = await fetch(book.cover);
        const buffer = await response.arrayBuffer();
        const uint8Header = new Uint8Array(buffer.slice(0, 4));
        
        // Check for JPEG (FF D8 FF) or PNG (89 50 4E 47) magic numbers
        const isJpeg = uint8Header[0] === 0xFF && uint8Header[1] === 0xD8 && uint8Header[2] === 0xFF;
        const isPng = uint8Header[0] === 0x89 && uint8Header[1] === 0x50 && uint8Header[2] === 0x4E && uint8Header[3] === 0x47;
        
        expect(isJpeg || isPng).toBe(true);
    } else {
        // Fallback for base64
       expect(book.cover).toMatch(/^data:image\/(jpeg|png);base64,/);
    }
  });

  it('should return metadata without cover if cover extraction hangs', async () => {
    // For this test we still want to simulate the hang, so we might need to mock epubjs again LOCALLY
    // OR we rely on the timeout logic working with a real book (which wouldn't hang).
    // To strictly test the *timeout logic*, we need to force a hang.
    // Since we unmocked epubjs globally, we need to spy on the internal book object creation
    // But EpubParser creates the book instance internally: `ePub(buffer.buffer)`.
    // We can mock `epubjs` just for this test using `doMock`.
    
    jest.resetModules(); // Reset to allow re-mocking
    jest.mock('epubjs', () => {
        return jest.fn(() => ({
            ready: Promise.resolve(),
            package: { metadata: { title: 'Hanging Book' } },
            coverUrl: () => new Promise(() => {}), // Never resolves
        }));
    });
    // Re-import after reset
    const { EpubParser: ParserWithMock } = require('./EpubParser');
    const { File: MockFile } = require('expo-file-system');

    // Ensure File mock is still preserved or re-applied if resetModules cleared it
    // resetModules clears the cache, but Jest mocks defined at top level might persist or need re-definition if they were factory-based? 
    // Actually resetModules clears registry. We'd need to re-mock expo-file-system too or rely on __mocks__.
    // Simplest approach: define checking logic in separate block or accept that we only test positive case now 
    // OR re-define mocks inline.
    
    // Re-mock expo-file-system for this isolation
    jest.mock('expo-file-system', () => ({
        File: jest.fn(() => ({ bytes: async () => new Uint8Array([]) }))
    }));

    const mockUri = 'file:///hanging.epub';
    const start = Date.now();
    const book = await ParserWithMock.parse(mockUri);
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(1900);
    expect(book.title).toBe('Hanging Book');
    expect(book.cover).toBeUndefined();
  }, 10000); // Increase timeout to allow for 7s wait
});
