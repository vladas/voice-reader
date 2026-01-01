import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LibraryScreen } from './LibraryScreen';
import * as DocumentPicker from 'expo-document-picker';
import { BookRepository } from '../storage/BookRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock DocumentPicker
jest.mock('expo-document-picker');

// Manual Mock for AsyncStorage to ensure behavior
const mockAsyncStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => {
    return Promise.resolve(mockAsyncStorage[key] || null);
  }),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    for (const key in mockAsyncStorage) delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test-directory/',
  File: jest.fn().mockImplementation((uri) => ({
    uri,
    copy: jest.fn().mockResolvedValue(true),
    exists: true,
    bytes: jest.fn().mockResolvedValue(new Uint8Array()),
  })),
  Directory: jest.fn().mockImplementation((uri) => ({
    uri,
    exists: false,
    create: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock EpubParser
jest.mock('../utils/EpubParser', () => ({
  EpubParser: {
    parse: jest.fn().mockResolvedValue({
      title: 'Test Book',
      author: 'Test Author',
    }),
  },
}));

describe('US-1.1: Library Import (E2E-like)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('Scenario: Import valid EPUB -> Book appears in list', async () => {
    const { getByText, queryByText } = render(<LibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('Your library is empty')).toBeTruthy();
    });

    // WHEN
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://source.epub' }]
    });

    fireEvent.press(getByText('Import'));

    // THEN
    await waitFor(async () => {
      // Wait for the book to appear first (positive assertion)
      // This ensures we wait for the re-render where the state has updated
      expect(getByText('Test Book')).toBeTruthy();
      expect(getByText('Test Author')).toBeTruthy();
      
      // Then check that empty state is gone
      expect(queryByText('Your library is empty')).toBeNull();
    });

    // Verify repository infrastructure calls (optional but good for confidence)
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({ type: 'application/epub+zip' });
    
    // Verify it was actually saved to storage
    const storedBooks = await BookRepository.getBooks();
    expect(storedBooks).toHaveLength(1);
    expect(storedBooks[0]).toMatchObject({
      title: 'Test Book',
      author: 'Test Author',
      uri: expect.stringContaining('file:///test-directory/books/'),
    });
  });

  it('Scenario: Handle cancelled import', async () => {
    const { getByText } = render(<LibraryScreen />);

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    fireEvent.press(getByText('Import'));

    await waitFor(async () => {
      const storedBooks = await BookRepository.getBooks();
      expect(storedBooks).toHaveLength(0);
    });
  });
});
