import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Notification, User } from '@/types';
import { Bell, ArrowLeft, Check } from 'lucide-react-native';
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';

type GroupedNotifications = {
  title: string;
  data: Notification[];
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotifications[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    groupNotifications();
  }, [notifications]);

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupNotifications = () => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    notifications.forEach(notification => {
      const date = parseISO(notification.created_at);
      
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else if (isThisWeek(date)) {
        thisWeek.push(notification);
      } else {
        older.push(notification);
      }
    });

    const grouped: GroupedNotifications[] = [];
    
    if (today.length > 0) {
      grouped.push({ title: 'Today', data: today });
    }
    
    if (yesterday.length > 0) {
      grouped.push({ title: 'Yesterday', data: yesterday });
    }
    
    if (thisWeek.length > 0) {
      grouped.push({ title: 'This Week', data: thisWeek });
    }
    
    if (older.length > 0) {
      grouped.push({ title: 'Older', data: older });
    }
    
    setGroupedNotifications(grouped);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
          
        if (error) {
          throw error;
        }
        
        // Update local state
        setNotifications(
          notifications.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      return dateString;
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('assigned')) {
      return '📋';
    } else if (title.includes('completed')) {
      return '✅';
    } else if (title.includes('reminder')) {
      return '⏰';
    } else if (title.includes('reward')) {
      return '🎁';
    } else if (title.includes('joined')) {
      return '👋';
    } else {
      return '📢';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => handleMarkAsRead(item)}
    >
      <View style={styles.notificationIconContainer}>
        <Text style={styles.notificationEmoji}>{getNotificationIcon(item.title)}</Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatTime(item.created_at)}
        </Text>
      </View>
      {!item.read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: GroupedNotifications }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color={COLORS.darkGray} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>You don't have any notifications yet.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.deepCharcoal} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {notifications.some(n => !n.read) && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Check size={20} color={COLORS.warmCoral} />
          </TouchableOpacity>
        )}
      </View>
      
      {notifications.some(n => !n.read) && (
        <TouchableOpacity
          style={styles.markAllContainer}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
      
      {groupedNotifications.length > 0 ? (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <View>
              {renderSectionHeader({ section: item })}
              {item.data.map((notification) => (
                <View key={notification.id}>
                  {renderNotificationItem({ item: notification })}
                </View>
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.warmCoral]}
              tintColor={COLORS.warmCoral}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyStateWrapper}>
          {renderEmptyState()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllContainer: {
    backgroundColor: COLORS.pureWhite,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  markAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.warmCoral,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.darkGray,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.pureWhite,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  unreadNotification: {
    backgroundColor: COLORS.warmCoralLight,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 4,
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  notificationTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.warmCoral,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
