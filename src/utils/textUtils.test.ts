import { splitIntoSentences } from './textUtils';

describe('splitIntoSentences', () => {
    it('splits simple sentences', () => {
        const text = "Hello world. This is a test.";
        const result = splitIntoSentences(text);
        expect(result).toEqual(["Hello world.", "This is a test."]);
    });

    it('handles exclamation and question marks', () => {
        const text = "Hello! How are you? I am fine.";
        const result = splitIntoSentences(text);
        expect(result).toEqual(["Hello!", "How are you?", "I am fine."]);
    });

    it('handles quotes', () => {
        const text = '"This is a quote." He said.';
        const result = splitIntoSentences(text);
        expect(result).toEqual(['"This is a quote."', "He said."]);
    });

    it('merges newlines into spaces', () => {
        const text = "This is a sentence\nspread across lines.";
        const result = splitIntoSentences(text);
        expect(result).toEqual(["This is a sentence spread across lines."]);
    });

    it('handles single sentence', () => {
        const text = "Just one sentence.";
        const result = splitIntoSentences(text);
        expect(result).toEqual(["Just one sentence."]);
    });
    
    it('handles no punctuation at end', () => {
        const text = "This is a sentence";
        const result = splitIntoSentences(text);
        expect(result).toEqual(["This is a sentence"]);
    });
});
