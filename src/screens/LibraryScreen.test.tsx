import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LibraryScreen } from './LibraryScreen';
import * as DocumentPicker from 'expo-document-picker';
import { BookRepository } from '../storage/BookRepository';

// Mock dependencies
jest.mock('expo-document-picker');
jest.mock('../storage/BookRepository');

describe('US-1.1: Library Import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Scenario: Import valid EPUB -> Book appears in list', async () => {
    // GIVEN I am on the library screen
    // (and the library is initially empty)
    (BookRepository.getBooks as jest.Mock).mockResolvedValueOnce([]);
    
    const { getByText } = render(<LibraryScreen />);
    
    // Initially ensure empty state is visible
    await waitFor(() => {
      expect(getByText('Your library is empty')).toBeTruthy();
    });

    // WHEN I tap the "Import Book" button and select a valid .epub file
    const mockBook = {
      id: '123',
      title: 'Test Book',
      author: 'Test Author',
      uri: 'file://test.epub',
      location: '',
      lastRead: Date.now(),
      progress: 0,
    };

    // Setup mocks for the interaction
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://source.epub' }]
    });
    
    (BookRepository.addBook as jest.Mock).mockResolvedValue(mockBook);
    
    // The component re-fetches books after import, so we need to mock the next getBooks call
    (BookRepository.getBooks as jest.Mock).mockResolvedValueOnce([mockBook]);

    // Perform interaction
    fireEvent.press(getByText('Import'));

    // THEN the book should appear in my library list with its title and author
    await waitFor(() => {
      expect(getByText('Test Book')).toBeTruthy();
      expect(getByText('Test Author')).toBeTruthy();
    });

    // Verify repository calls
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({ type: 'application/epub+zip' });
    expect(BookRepository.addBook).toHaveBeenCalledWith('file://source.epub');
    expect(BookRepository.getBooks).toHaveBeenCalledTimes(2); // Initial load + refresh after import
  });

  it('Scenario: Handle cancelled import', async () => {
    // GIVEN I am on the library screen
    (BookRepository.getBooks as jest.Mock).mockResolvedValue([]);
    const { getByText } = render(<LibraryScreen />);

    await waitFor(() => expect(getByText('Import')).toBeTruthy());

    // WHEN I cancel the import
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    fireEvent.press(getByText('Import'));

    // THEN no book is added and repository is not called
    await waitFor(() => {
      expect(BookRepository.addBook).not.toHaveBeenCalled();
    });
  });
});
