import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LibraryScreen } from './LibraryScreen';
import * as DocumentPicker from 'expo-document-picker';
import { BookRepository, Book } from '../storage/BookRepository';
import { BookRepositoryProvider, IBookRepository } from '../contexts/BookRepositoryContext';
import { IFileSystem } from '../adapters/IFileSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock DocumentPicker
jest.mock('expo-document-picker');

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

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

// Mock EpubParser
jest.mock('../utils/EpubParser', () => ({
  EpubParser: {
    parse: jest.fn().mockResolvedValue({
      title: 'Test Book',
      author: 'Test Author',
    }),
  },
}));

// Create a mock file system for tests
const createMockFileSystem = (): IFileSystem => ({
  readBytes: jest.fn().mockResolvedValue(new Uint8Array([0x50, 0x4B])),
  writeBase64: jest.fn().mockResolvedValue(undefined),
  copyFile: jest.fn().mockResolvedValue(undefined),
  directoryExists: jest.fn().mockReturnValue(true),
  createDirectory: jest.fn(),
  deleteDirectory: jest.fn(),
  getDocumentPath: jest.fn().mockReturnValue('file:///test-directory'),
  joinPath: jest.fn((...parts) => parts.join('/')),
});

// Create test instances
const mockFileSystem = createMockFileSystem();
const testRepository = new BookRepository(mockFileSystem);

// Helper to render with provider
const renderWithProvider = (
  ui: React.ReactElement, 
  repository: IBookRepository = testRepository,
  fileSystem: IFileSystem = mockFileSystem
) => {
  return render(
    <BookRepositoryProvider repository={repository} fileSystem={fileSystem}>
      {ui}
    </BookRepositoryProvider>
  );
};

describe('US-1.1: Library Import (E2E-like)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('Scenario: Import valid EPUB -> Book appears in list', async () => {
    const { getByText, queryByText } = renderWithProvider(<LibraryScreen />);
    
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
    const storedBooks = await testRepository.getBooks();
    expect(storedBooks).toHaveLength(1);
    expect(storedBooks[0]).toMatchObject({
      title: 'Test Book',
      author: 'Test Author',
    });
  });

  it('Scenario: Handle cancelled import', async () => {
    const { getByText } = renderWithProvider(<LibraryScreen />);

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    fireEvent.press(getByText('Import'));

    await waitFor(async () => {
      const storedBooks = await testRepository.getBooks();
      expect(storedBooks).toHaveLength(0);
    });
  });

  it('Scenario: Pressing a book navigates to Reader', async () => {
    // Pre-populate a book
    await testRepository.addBook('file:///test-directory/pre-existing.epub');

    const { getByText } = renderWithProvider(<LibraryScreen />);

    // Wait for book to render
    await waitFor(() => {
       expect(getByText('Test Book')).toBeTruthy();
    });

    // Press the book
    fireEvent.press(getByText('Test Book'));

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('Reader', { bookId: expect.any(String) });
  });
});
