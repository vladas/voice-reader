import { EpubParser } from './EpubParser';
import { IFileSystem } from '../adapters/IFileSystem';
import * as fs from 'fs';
import * as path from 'path';

// Use real epubjs
jest.unmock('epubjs');

// Create a Node.js-based file system for tests
const fixturePath = path.resolve(__dirname, '../__tests__/fixtures/sample.epub');
const createNodeFileSystem = (): IFileSystem => ({
    readBytes: jest.fn().mockImplementation(async (uri: string) => {
        // Handle file:// uri or absolute path
        const filePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        return new Uint8Array(buffer);
    }),
    writeBase64: jest.fn().mockResolvedValue(undefined),
    copyFile: jest.fn().mockResolvedValue(undefined),
    directoryExists: jest.fn().mockReturnValue(true),
    createDirectory: jest.fn(),
    deleteDirectory: jest.fn(),
    getDocumentPath: jest.fn().mockReturnValue('file:///documents'),
    joinPath: jest.fn((...parts) => parts.join('/')),
});

describe('EpubParser', () => {
  it('should parse a real epub file', async () => {
    // GIVEN a real fixture file URI and a file system
    const mockUri = `file://${fixturePath}`;
    const fileSystem = createNodeFileSystem();
    
    // WHEN we call parse with the file system
    const book = await EpubParser.parse(mockUri, fileSystem);

    // THEN it should have called readBytes
    expect(fileSystem.readBytes).toHaveBeenCalledWith(mockUri);

    // AND it should return valid metadata
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
    // For this test we still want to simulate the hang, so we mock epubjs locally
    jest.resetModules();
    jest.mock('epubjs', () => {
        return jest.fn(() => ({
            ready: Promise.resolve(),
            package: { metadata: { title: 'Hanging Book' } },
            coverUrl: () => new Promise(() => {}), // Never resolves
        }));
    });
    
    // Re-import after reset
    const { EpubParser: ParserWithMock } = require('./EpubParser');
    
    // Create a minimal file system that returns empty bytes
    const mockFileSystem: IFileSystem = {
        readBytes: jest.fn().mockResolvedValue(new Uint8Array([])),
        writeBase64: jest.fn().mockResolvedValue(undefined),
        copyFile: jest.fn().mockResolvedValue(undefined),
        directoryExists: jest.fn().mockReturnValue(true),
        createDirectory: jest.fn(),
        deleteDirectory: jest.fn(),
        getDocumentPath: jest.fn().mockReturnValue('file:///documents'),
        joinPath: jest.fn((...parts) => parts.join('/')),
    };

    const mockUri = 'file:///hanging.epub';
    const start = Date.now();
    const book = await ParserWithMock.parse(mockUri, mockFileSystem);
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(1900);
    expect(book.title).toBe('Hanging Book');
    expect(book.cover).toBeUndefined();
  }, 10000);
});
