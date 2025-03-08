import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Assignment, User } from '@/types';
import { Calendar, MapPin, Clock, User as UserIcon } from 'lucide-react-native';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [todayTasks, setTodayTasks] = useState<Assignment[]>([]);
  const [myTasks, setMyTasks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchTasks();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        throw error;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      console.log('Auth user found:', user.id);
      
      const { data, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('User data error:', userError);
        throw userError;
      }
      
      console.log('User data fetched:', data);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      // Get user data to get household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('User data error:', userError);
        throw userError;
      }
      
      if (!userData.household_id) {
        console.log('User has no household');
        setTodayTasks([]);
        setMyTasks([]);
        return;
      }
      
      // Fetch today's tasks
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      console.log('Fetching today\'s tasks for date:', formattedDate);
      console.log('Household ID:', userData.household_id);
      
      const { data: todayData, error: todayError } = await supabase
        .from('assignments')
        .select('*, users:assigned_to(*)')
        .eq('household', userData.household_id)
        .like('due_date', `${formattedDate}%`)
        .order('start_time', { ascending: true });
        
      if (todayError) {
        console.error('Today\'s tasks error:', todayError);
        throw todayError;
      }
      
      console.log('Today\'s tasks fetched:', todayData?.length || 0);
      setTodayTasks(todayData || []);
      
      // Fetch my tasks
      const { data: myData, error: myError } = await supabase
        .from('assignments')
        .select('*, users:assigned_to(*)')
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });
        
      if (myError) {
        console.error('My tasks error:', myError);
        throw myError;
      }
      
      console.log('My tasks fetched:', myData?.length || 0);
      setMyTasks(myData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false);
          
        if (error) {
          throw error;
        }
        
        setUnreadNotifications(data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    fetchNotifications();
  };

  const handleTaskPress = (task: Assignment) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleCompleteTask = async (task: Assignment) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', task.id);
        
      if (error) {
        throw error;
      }
      
      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const getFirstName = () => {
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  };

  const renderScheduleItem = ({ item }: { item: Assignment }) => {
    const assignedUser = item.users as unknown as User;
    
    return (
      <View style={styles.scheduleItem}>
        <Text style={styles.scheduleTime}>{item.start_time || '00:00'}</Text>
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.scheduleDescription}>{item.description}</Text>
          )}
          <View style={styles.scheduleDetails}>
            {item.location && (
              <View style={styles.scheduleDetail}>
                <MapPin size={14} color={COLORS.darkGray} />
                <Text style={styles.scheduleDetailText}>{item.location}</Text>
              </View>
            )}
            <View style={styles.scheduleDetail}>
              <UserIcon size={14} color={COLORS.darkGray} />
              <Text style={styles.scheduleDetailText}>{assignedUser?.name || 'Unassigned'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMyTaskItem = ({ item }: { item: Assignment }) => {
    return ( <TouchableOpacity 
        style={styles.myTaskItem}
        onPress={() => handleTaskPress(item)}
      >
        <View style={styles.myTaskContent}>
          <Text style={styles.myTaskTitle}>{item.title}</Text>
          <View style={styles.myTaskDetails}>
            {item.location && (
              <View style={styles.myTaskDetail}>
                <MapPin size={14} color={COLORS.darkGray} />
                <Text style={styles.myTaskDetailText}>{item.location}</Text>
              </View>
            )}
            {item.start_time && (
              <View style={styles.myTaskDetail}>
                <Clock size={14} color={COLORS.darkGray} />
                <Text style={styles.myTaskDetailText}>{item.start_time}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => handleCompleteTask(item)}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.warmCoral} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ChoreHarmony</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Image
              source={
                user?.avatar
                  ? { uri: user.avatar }
                  : { uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=100&auto=format&fit=crop' }
              }
              style={styles.avatar}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={[1]} // Just a dummy item to render the content
        keyExtractor={() => 'home-content'}
        renderItem={() => (
          <View style={styles.content}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {getFirstName()}!</Text>
              <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
            </View>
            
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <TouchableOpacity onPress={() => router.push('/tasks')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {todayTasks.length > 0 ? (
                <View style={styles.scheduleContainer}>
                  <View style={styles.timelineContainer}>
                    <View style={styles.timeline} />
                  </View>
                  
                  <FlatList
                    data={todayTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderScheduleItem}
                    scrollEnabled={false}
                  />
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Calendar size={40} color={COLORS.darkGray} />
                  <Text style={styles.emptyStateText}>No tasks scheduled for today</Text>
                </View>
              )}
            </View>
            
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Tasks</Text>
                <TouchableOpacity onPress={() => router.push('/tasks?filter=mine')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {myTasks.length > 0 ? (
                <View>
                  {myTasks.slice(0, 3).map((task) => (
                    <View key={task.id}>
                      {renderMyTaskItem({ item: task })}
                    </View>
                  ))}
                  {myTasks.length > 3 && (
                    <TouchableOpacity
                      style={styles.moreTasksButton}
                      onPress={() => router.push('/tasks?filter=mine')}
                    >
                      <Text style={styles.moreTasksText}>
                        +{myTasks.length - 3} more tasks
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Calendar size={40} color={COLORS.darkGray} />
                  <Text style={styles.emptyStateText}>No tasks assigned to you</Text>
                </View>
              )}
            </View>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.warmCoral,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.pureWhite,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.mediumGray,
  },
  content: {
    padding: 16,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.warmCoral,
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.darkGray,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.warmCoral,
  },
  scheduleContainer: {
    flexDirection: 'row',
  },
  timelineContainer: {
    width: 50,
    alignItems: 'center',
  },
  timeline: {
    width: 2,
    height: '100%',
    backgroundColor: COLORS.mediumGray,
    position: 'absolute',
    left: 24,
    top: 10,
    bottom: 0,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scheduleTime: {
    width: 50,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: COLORS.freshMintLight,
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  scheduleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 4,
  },
  scheduleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  scheduleDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  scheduleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  myTaskItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.pureWhite,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warmCoral,
  },
  myTaskContent: {
    flex: 1,
  },
  myTaskTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  myTaskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  myTaskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myTaskDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  completeButton: {
    backgroundColor: COLORS.warmCoralLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  completeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.warmCoral,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
    textAlign: 'center',
  },
  moreTasksButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginTop: 8,
  },
  moreTasksText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.deepCharcoal,
  }
});
