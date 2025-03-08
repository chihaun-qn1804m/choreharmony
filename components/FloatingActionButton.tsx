import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

type FloatingActionButtonProps = {
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export default function FloatingActionButton({
  onPress,
  style,
  icon,
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon || <Plus size={24} color={COLORS.pureWhite} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
