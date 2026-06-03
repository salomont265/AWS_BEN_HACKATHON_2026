/**
 * Card Component - Reusable card container
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  noBorder?: boolean;
  elevated?: boolean;
}

export default function Card({ children, style, padding, noBorder = false, elevated = false }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        noBorder && styles.noBorder,
        elevated && styles.elevated,
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.unit(2),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noBorder: {
    borderWidth: 0,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
