import React from 'react';
import { Text, TextProps } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

export interface StyledTextProps extends TextProps {
  variant?: keyof typeof Typography.size;
  weight?: 'regular' | 'bold' | 'italic' | 'boldItalic';
  color?: string;
  centered?: boolean;
}

export const StyledText: React.FC<StyledTextProps> = ({ 
  style, 
  variant = 'm', 
  weight = 'regular', 
  color = Colors.theme.text,
  centered = false,
  children,
  ...props 
}) => {
  return (
    <Text 
      style={[
        {
          fontFamily: Typography.fontFamily[weight],
          fontSize: Typography.size[variant],
          color: color,
          lineHeight: Typography.size[variant] * Typography.lineHeight.relaxed,
          textAlign: centered ? 'center' : 'auto',
        },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
