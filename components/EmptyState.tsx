import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { ClipboardList } from 'lucide-react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
  message?: string; // For backward compatibility
  icon?: React.ReactNode;
};

export default function EmptyState({
  title,
  description,
  message, // For backward compatibility
  icon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon || <ClipboardList size={64} color={COLORS.darkGray} />}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{description || message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
