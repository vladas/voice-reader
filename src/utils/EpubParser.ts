import { File } from 'expo-file-system';
import ePub from 'epubjs';
import { Buffer } from 'buffer';

export interface BookMetadata {
  title: string;
  author: string;
  cover?: string;
}

export const EpubParser = {
  parse: async (uri: string): Promise<BookMetadata> => {
    // Read the file from the device file system
    const file = new File(uri);
    const bytes = await file.bytes();

    // Convert to Buffer
    const buffer = Buffer.from(bytes);

    // Initialize epub.js with the binary data
    // @ts-ignore: epubjs types might be missing or tricky
    const book = ePub(buffer.buffer); // passing the ArrayBuffer (underlying buffer of Buffer)

    // Wait for the book to be parsed
    await book.ready;

    // Extract metadata
    // @ts-ignore: epubjs types are incomplete
    const { title, creator } = book.package.metadata;
    
    // @ts-ignore: epubjs types include coverUrl
    const coverUrl = await book.coverUrl();

    return {
      title: title || 'Unknown Title',
      author: creator || 'Unknown Author',
      cover: coverUrl || undefined,
    };
  }
};
