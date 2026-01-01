// Mock WebView - must be before any imports
import React from 'react';
import * as path from 'path';
import { render, waitFor } from '@testing-library/react-native';
import { ReaderScreen } from './ReaderScreen';
import { Book } from '../storage/BookRepository';
import { BookRepositoryProvider, IBookRepository } from '../contexts/BookRepositoryContext';
import { NodeFileSystem } from '../adapters/NodeFileSystem';

jest.mock('react-native-webview', () => {
    const { View, Text } = require('react-native');
    return {
        WebView: ({ source }: any) => (
            <View testID="webview">
                <Text>WebView Rendered</Text>
            </View>
        ),
    };
});

// Mock Navigation hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: { bookId: 'test-book-id' },
  }),
}));

// Use real NodeFileSystem with fixtures directory as base
const fixturePath = path.resolve(__dirname, '../__tests__/fixtures/sample.epub');
const nodeFileSystem = new NodeFileSystem(path.dirname(fixturePath));

// Create a mock repository for testing
const createMockRepository = (): IBookRepository => ({
    getBooks: jest.fn().mockResolvedValue([]),
    getBook: jest.fn().mockResolvedValue({
        id: 'test-book-id',
        title: 'Real Test Book',
        author: 'Test Author',
        uri: fixturePath, // Point to real fixture
        location: '',
    } as Book),
    addBook: jest.fn().mockResolvedValue({} as Book),
    clearAll: jest.fn().mockResolvedValue(undefined),
});

// Helper to render with provider
const renderWithProvider = (ui: React.ReactElement, repository?: IBookRepository) => {
    const mockRepo = repository ?? createMockRepository();
    return render(
        <BookRepositoryProvider repository={mockRepo} fileSystem={nodeFileSystem}>
            {ui}
        </BookRepositoryProvider>
    );
};

describe('ReaderScreen Integration', () => {
    it('renders WebView with book content', async () => {
        // WHEN rendering the screen with mock repository and real file system
        const { getByTestId, getByText } = renderWithProvider(<ReaderScreen />);

        // THEN the WebView should be rendered
        await waitFor(() => {
            expect(getByTestId('webview')).toBeTruthy();
            expect(getByText('WebView Rendered')).toBeTruthy();
        });
    });
});
