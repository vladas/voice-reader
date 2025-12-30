import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { StyledText } from '../components/StyledText';

export const LibraryScreen = () => {
  return (
    <Screen style={styles.content}>
      <View style={styles.header}>
        <StyledText variant="xxl" weight="bold">Library</StyledText>
      </View>
      <View style={styles.emptyState}>
        <StyledText variant="l" centered>Your library is empty</StyledText>
        <StyledText variant="s" centered style={{ marginTop: 8, opacity: 0.7 }}>
          Import an EPUB to get started
        </StyledText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 59, 50, 0.1)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
