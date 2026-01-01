import React, { useCallback , useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_400Regular_Italic, 
  Lora_700Bold_Italic 
} from '@expo-google-fonts/lora';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './src/constants/Colors';
import { AppNavigator } from './src/navigation/AppNavigator';
import { BookRepositoryProvider } from './src/contexts/BookRepositoryContext';
import { ExpoFileSystem } from './src/adapters/ExpoFileSystem';
import { BookRepository } from './src/storage/BookRepository';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
    Lora_700Bold_Italic,
  });

  // Create dependencies once
  const fileSystem = useMemo(() => new ExpoFileSystem(), []);
  const bookRepository = useMemo(() => new BookRepository(fileSystem), [fileSystem]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <BookRepositoryProvider repository={bookRepository} fileSystem={fileSystem}>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <StatusBar style="dark" />
          <AppNavigator />
        </View>
      </BookRepositoryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.theme.background,
  },
});
