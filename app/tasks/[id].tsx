import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, MapPin, User, CircleCheck as CheckCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Assignment, User as UserType } from '@/types';
import { format, parseISO } from 'date-fns';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<Assignment | null>(null);
  const [assignedUser, setAssignedUser] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTaskDetails();
    fetchCurrentUser();
  }, [id]);

  const fetchTaskDetails = async () => {
    if (!id) return;
    
    try {
      // Fetch task details
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTask(data);
      
      // Fetch assigned user details
      if (data.assigned_to) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.assigned_to)
          .single();
          
        if (userError) throw userError;
        setAssignedUser(userData);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (error) throw error;
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', task.id);
        
      if (error) throw error;
      
      // Update local state
      setTask({ ...task, status: 'completed' });
      Alert.alert('Success', 'Task marked as completed');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={COLORS.warmCoral} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={COLORS.warmCoral} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Task not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.warmCoral} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={[
            styles.statusBadge,
            task.status === 'completed' ? styles.completedBadge : styles.pendingBadge
          ]}>
            <Text style={[
              styles.statusText,
              task.status === 'completed' ? styles.completedText : styles.pendingText
            ]}>
              {task.status === 'completed' ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        {task.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Calendar size={20} color={COLORS.warmCoral} />
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{formatDate(task.due_date)}</Text>
          </View>

          {task.start_time && (
            <View style={styles.detailRow}>
              <Clock size={20} color={COLORS.warmCoral} />
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>
                {task.start_time}{task.end_time ? ` - ${task.end_time}` : ''}
              </Text>
            </View>
          )}

          {task.location && (
            <View style={styles.detailRow}>
              <MapPin size={20} color={COLORS.warmCoral} />
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{task.location}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <User size={20} color={COLORS.warmCoral} />
            <Text style={styles.detailLabel}>Assigned To:</Text>
            <Text style={styles.detailValue}>{assignedUser?.name || 'Unknown'}</Text>
          </View>
        </View>

        {task.status !== 'completed' && (currentUser?.id === task.assigned_to || currentUser?.is_house_owner) && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteTask}
            disabled={loading}
          >
            <CheckCircle size={20} color={COLORS.pureWhite} />
            <Text style={styles.completeButtonText}>
              {loading ? 'Updating...' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: COLORS.deepCharcoal,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.darkGray,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.deepCharcoal,
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: COLORS.freshMintLight,
  },
  pendingBadge: {
    backgroundColor: COLORS.warmCoralLight,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  completedText: {
    color: COLORS.freshMint,
  },
  pendingText: {
    color: COLORS.warmCoral,
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 12,
    width: 100,
  },
  detailValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    flex: 1,
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.warmCoral,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  completeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.pureWhite,
    marginLeft: 8,
  },
});
