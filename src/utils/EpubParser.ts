import ePub from 'epubjs';
import { Buffer } from 'buffer';
import { IFileSystem } from '../adapters/IFileSystem';

export interface BookMetadata {
  title: string;
  author: string;
  cover?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export const EpubParser = {
  parse: async (uri: string, fileSystem: IFileSystem): Promise<BookMetadata> => {
    // Read the file using injected file system
    const bytes = await fileSystem.readBytes(uri);

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
            setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        // @ts-ignore
        coverUrl = await Promise.race([extractionPromise, timeoutPromise]);
      } else {
        // Fallback to coverUrl() if internal path finding failed (unlikely)
         const coverPromise = book.coverUrl();
         const timeoutPromise = new Promise<string>((_, reject) => 
           setTimeout(() => reject(new Error('Timeout')), 2000)
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
  },

  parseChapters: async (uri: string, fileSystem: IFileSystem): Promise<Chapter[]> => {
    try {
        const bytes = await fileSystem.readBytes(uri);
        const buffer = Buffer.from(bytes);
        // @ts-ignore
        const book = ePub(buffer.buffer);
        await book.ready;

        const chapters: Chapter[] = [];
        
        // Iterate over the spine to get linear reading order
        // @ts-ignore
        const spine = book.spine;
        // @ts-ignore
        const items = spine?.items || [];
        
        // Loop through spine items
        for (let i = 0; i < items.length; i++) {
           const item = items[i];
           try {
             // Retrieve the full Section object which has the .load method
             // @ts-ignore
             let section = spine.get(item.idref);
             if (!section) {
                 // Fallback to index if idref lookup fails
                 // @ts-ignore
                 section = spine.get(i);
             }

             if (section) {
                 // @ts-ignore
                 const loadedSection = await section.load(book.load.bind(book));
                 
                 // section is usually an HTML document or object. 
                 // In node/react-native environment without DOM, getting text might be tricky.
                 // However, depending on epubjs adapter, 'section' might be the raw text/xml.
                 
                 // Simplest extraction attempt: treat as string and strip tags?
                 // Or use simple regex.
                 const rawContent = loadedSection ? loadedSection.toString() : '';
                 
                 // Very naive HTML stripping for "Clean Text" prototype
                 // Replace block tags with newlines to preserve some structure
                 const plainText = rawContent
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>/gi, '\n\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                 
                 if (plainText.length > 0) {
                     chapters.push({
                         id: item.idref,
                         title: item.idref, // Title often requires resolving TOC, skipping for now
                         content: plainText
                     });
                 }
             }
           } catch (err) {
               console.warn(`Failed to load chapter ${item.idref}`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
           }
        }
        
        return chapters;

    } catch (e) {
        console.error('Failed to parse chapters', e);
        return [];
    }
  }
};
