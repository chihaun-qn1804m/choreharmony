import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, User } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';

type HeaderProps = {
  title: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  unreadCount?: number;
  avatarUrl?: string | null;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
};

export default function Header({
  title,
  showNotification = true,
  showAvatar = true,
  unreadCount = 0,
  avatarUrl,
  onNotificationPress,
  onAvatarPress,
}: HeaderProps) {
  const router = useRouter();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/profile');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showNotification && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationPress}
          >
            <Bell size={24} color={COLORS.deepCharcoal} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightContainer}>
        {showAvatar && (
          <TouchableOpacity onPress={handleAvatarPress}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : { uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=100&auto=format&fit=crop' }
              }
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: COLORS.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.warmCoral,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.pureWhite,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.mediumGray,
  },
});
