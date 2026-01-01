import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { RootStackParamList } from './types';
import { Colors } from '../constants/Colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Library"
        screenOptions={{
             headerStyle: { backgroundColor: Colors.theme.background },
             headerTintColor: Colors.theme.text,
             headerTitleStyle: { fontFamily: 'Lora_700Bold' },
             contentStyle: { backgroundColor: Colors.theme.background },
        }}
      >
        <Stack.Screen 
            name="Library" 
            component={LibraryScreen} 
            options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="Reader" 
            component={ReaderScreen}
            options={{ title: 'Reading' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
