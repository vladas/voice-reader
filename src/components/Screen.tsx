import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface ScreenProps extends ViewProps {
  useSafeArea?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ 
  children, 
  style, 
  useSafeArea = true,
  ...props 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container, 
        useSafeArea && { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.theme.background,
  },
});
