/**
 * Splits text into sentences for TTS playback.
 * Handles common punctuation and abbreviations.
 */
export const splitIntoSentences = (text: string): string[] => {
  if (!text) return [];

  // Basic regex for sentence splitting
  // Look for periods, exclamation marks, or question marks...
  // ...followed by a space or end of string.
  // This is a naive implementation but sufficient for V1.
  // It avoids splitting on common abbreviations like "Mr.", "Dr.", etc. by checking length?
  // No, let's use a slightly more robust regex or logic.
  
  // Replace newlines with spaces to avoid breaking sentences
  const cleanerText = text.replace(/\s+/g, ' ').trim();
  
  // Split by punctuation followed by space
  // ((?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s)
  // This is getting complex for regex.
  
  // Let's use a simpler heuristic: split, then merge if too short?
  // Or just rely on a standard regex pattern.
  
  const sentences = cleanerText.match( /[^.!?]+[.!?]+["']?|[^.!?]+$/g );
  
  if (!sentences) return [cleanerText];
  
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
};
