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
    let coverUrl: string | undefined;
    try {
      // @ts-ignore: epubjs book object has a cover property definition usually
      const coverPath = book.cover; // book.cover is usually the internal path to the image
      if (coverPath) {
        // Use timeout for manual extraction too, just in case
        const extractionPromise = book.archive.getBase64(coverPath);
        const timeoutPromise = new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 7000)
        );
        // @ts-ignore
        coverUrl = await Promise.race([extractionPromise, timeoutPromise]);
      } else {
        // Fallback to coverUrl() if internal path finding failed (unlikely)
         const coverPromise = book.coverUrl();
         const timeoutPromise = new Promise<string>((_, reject) => 
           setTimeout(() => reject(new Error('Timeout')), 7000)
         );
         // @ts-ignore
         coverUrl = await Promise.race([coverPromise, timeoutPromise]);
      }
    } catch (e) {
      console.warn('Cover extraction failed or timed out', e);
    }

    return {
      title: title || 'Unknown Title',
      author: creator || 'Unknown Author',
      cover: coverUrl || undefined,
    };
  }
};
