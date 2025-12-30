import * as FileSystem from 'expo-file-system';
import ePub from 'epubjs';
import { Buffer } from 'buffer';

export interface BookMetadata {
  title: string;
  author: string;
}

export const EpubParser = {
  parse: async (uri: string): Promise<BookMetadata> => {
    // Read the file from the device file system as a base64 string
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convert base64 to an ArrayBuffer which epub.js can consume
    const buffer = Buffer.from(base64, 'base64');

    // Initialize epub.js with the binary data
    // @ts-ignore: epubjs types might be missing or tricky
    const book = ePub(buffer.buffer); // passing the ArrayBuffer (underlying buffer of Buffer)

    // Wait for the book to be parsed
    await book.ready;

    // Extract metadata
    // @ts-ignore: epubjs types are incomplete
    const { title, creator } = book.package.metadata;

    return {
      title: title || 'Unknown Title',
      author: creator || 'Unknown Author',
    };
  }
};
