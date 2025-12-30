import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { StyledText } from '../components/StyledText';
import * as DocumentPicker from 'expo-document-picker';
import { Book, BookRepository } from '../storage/BookRepository';

// Minimal mock if nav not ready, but we should assume we will have it.
// For now, simple useEffect is enough if we are default screen.

export const LibraryScreen = () => {
  const [books, setBooks] = useState<Book[]>([]);

  const loadBooks = useCallback(async () => {
    const loaded = await BookRepository.getBooks();
    setBooks(loaded);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const { uri } = result.assets[0];
      await BookRepository.addBook(uri);
      await loadBooks();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to import book');
    }
  };

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookCover}>
        <StyledText variant="xl" weight="bold" color="#fff">{item.title[0]}</StyledText>
      </View>
      <View style={styles.bookInfo}>
        <StyledText variant="m" weight="bold" numberOfLines={1}>{item.title}</StyledText>
        <StyledText variant="s" color="#666" numberOfLines={1}>{item.author}</StyledText>
      </View>
    </View>
  );

  return (
    <Screen style={styles.content}>
      <View style={styles.header}>
        <StyledText variant="xxl" weight="bold">Library</StyledText>
        <TouchableOpacity onPress={handleImport} style={styles.importButton}>
          <StyledText variant="s" weight="bold" color="#fff">Import</StyledText>
        </TouchableOpacity>
      </View>
      
      {books.length === 0 ? (
        <View style={styles.emptyState}>
          <StyledText variant="l" centered>Your library is empty</StyledText>
          <StyledText variant="s" centered style={{ marginTop: 8, opacity: 0.7 }}>
            Import an EPUB to get started
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 59, 50, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  bookItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9F5F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 59, 50, 0.05)',
  },
  bookCover: {
    width: 50,
    height: 75,
    backgroundColor: '#4A3B32',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  }
});
