import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO, addDays } from 'date-fns';
import { COLORS } from '@/constants/Colors';
import Header from '@/components/Header';
import Calendar from '@/components/Calendar';
import FilterTabs from '@/components/FilterTabs';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import FloatingActionButton from '@/components/FloatingActionButton';
import { supabase } from '@/lib/supabase';
import { Assignment, CalendarViewType, TaskFilter, User, Household, Chore } from '@/types';
import { ClipboardList, MapPin, Plus, Check, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { databaseTester } from '@/utils/databaseTester';

export default function TasksScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewType>('week');
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [savedChores, setSavedChores] = useState<Chore[]>([]);
  const [selectedChores, setSelectedChores] = useState<string[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.filter && typeof params.filter === 'string') {
      setActiveFilter(params.filter as TaskFilter);
    }
  }, [params]);

  useEffect(() => {
    // Test database connection on component mount
    const testConnection = async () => {
      const result = await databaseTester.testConnection();
      if (!result.success) {
        setConnectionError('Database connection failed. Please check your internet connection.');
        console.error('Connection test failed:', result.error);
      } else {
        setConnectionError(null);
      }
    };
    
    testConnection();
    fetchUserData();
    fetchTasks();
    fetchSavedChores();
    fetchHouseholdMembers();
    fetchNotifications();
  }, [selectedDate, activeFilter]);

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }
        
        console.log('User data fetched successfully:', userData);
        setUser(userData);
        
        if (userData.household_id) {
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .select('*')
            .eq('id', userData.household_id)
            .single();
            
          if (householdError) {
            console.error('Error fetching household data:', householdError);
            throw householdError;
          }
          
          console.log('Household data fetched successfully:', householdData);
          setHousehold(householdData);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        let query = supabase
          .from('assignments')
          .select('*, users:assigned_to(*)');
          
        // Apply filters
        switch (activeFilter) {
          case 'all':
            query = query.like('due_date', `${formattedDate}%`);
            break;
          case 'mine':
            query = query
              .eq('assigned_to', authUser.id)
              .eq('status', 'pending');
            break;
          case 'completed':
            query = query
              .eq('status', 'completed')
              .like('due_date', `${formattedDate}%`);
            break;
          case 'overdue':
            query = query
              .eq('status', 'pending')
              .lt('due_date', formattedDate);
            break;
          case 'upcoming':
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekFormatted = format(nextWeek, 'yyyy-MM-dd');
            
            query = query
              .eq('status', 'pending')
              .gte('due_date', formattedDate)
              .lte('due_date', nextWeekFormatted);
            break;
        }
        
        const { data, error } = await query.order('due_date', { ascending: true });
        
        if (error) {
          console.error('Error fetching tasks:', error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} tasks for filter "${activeFilter}"`);
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSavedChores = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', authUser.id)
          .single();
          
        if (userData?.household_id) {
          const { data, error } = await supabase
            .from('chores')
            .select('*')
            .eq('household', userData.household_id)
            .order('name');
            
          if (error) {
            console.error('Error fetching saved chores:', error);
            throw error;
          }
          
          console.log(`Fetched ${data?.length || 0} saved chores`);
          setSavedChores(data || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchSavedChores:', error);
    }
  };

  const fetchHouseholdMembers = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', authUser.id)
          .single();
          
        if (userData?.household_id) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('household_id', userData.household_id);
            
          if (error) {
            console.error('Error fetching household members:', error);
            throw error;
          }
          
          console.log(`Fetched ${data?.length || 0} household members`);
          setHouseholdMembers(data || []);
          if (data && data.length > 0) {
            setSelectedMember(data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchHouseholdMembers:', error);
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
          console.error('Error fetching notifications:', error);
          throw error;
        }
        
        setUnreadNotifications(data?.length || 0);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
    fetchSavedChores();
    fetchHouseholdMembers();
    fetchNotifications();
  }, [selectedDate, activeFilter]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewTypeChange = (viewType: CalendarViewType) => {
    setCalendarView(viewType);
  };

  const handleFilterChange = (filter: TaskFilter) => {
    setActiveFilter(filter);
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
        console.error('Error completing task:', error);
        throw error;
      }
      
      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error('Error in handleCompleteTask:', error);
    }
  };

  const handleChoreSelect = (choreId: string) => {
    if (selectedChores.includes(choreId)) {
      setSelectedChores(selectedChores.filter(id => id !== choreId));
    } else {
      setSelectedChores([...selectedChores, choreId]);
    }
  };

  const handleAssignChore = (chore: Chore) => {
    setSelectedChore(chore);
    setAssignModalVisible(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedChore) return;
    
    try {
      let assignedTo = selectedMember;
      
      // If auto-assign is enabled, find the best member to assign to
      if (autoAssign) {
        assignedTo = findBestMemberForChore(selectedChore);
      }
      
      // Calculate end time based on estimated time
      const startTime = '09:00';
      const endTime = calculateEndTime(startTime, selectedChore.estimated_time);
      
      // Create assignment
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          chore: selectedChore.id,
          assigned_to: assignedTo,
          assigned_date: new Date().toISOString(),
          due_date: selectedDate.toISOString(),
          start_time: startTime,
          end_time: endTime,
          status: 'pending',
          title: selectedChore.name,
          description: selectedChore.description,
          location: selectedChore.location,
        });
        
      if (error) {
        console.error('Error creating assignment:', error);
        throw error;
      }
      
      // Update user's hardness points
      await updateUserHardnessPoints(assignedTo, selectedChore.hardness);
      
      // Close modal and refresh tasks
      setAssignModalVisible(false);
      setSelectedChore(null);
      fetchTasks();
      
      Alert.alert('Success', 'Task assigned successfully');
    } catch (error) {
      console.error('Error in handleSaveAssignment:', error);
      Alert.alert('Error', 'Failed to assign task');
    }
  };

  const findBestMemberForChore = (chore: Chore): string => {
    // Sort members by total_hardness_points (ascending)
    const sortedMembers = [...householdMembers].sort(
      (a, b) => a.total_hardness_points - b.total_hardness_points
    );
    
    // Return the ID of the first member (with lowest points)
    return sortedMembers.length > 0 ? sortedMembers[0].id : '';
  };

  const updateUserHardnessPoints = async (userId: string, hardnessPoints: number) => {
    try {
      // Get current user points
      const { data, error } = await supabase
        .from('users')
        .select('total_hardness_points')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user points:', error);
        throw error;
      }
      
      // Update with new points
      const newPoints = (data.total_hardness_points || 0) + hardnessPoints;
      
      await supabase
        .from('users')
        .update({ total_hardness_points: newPoints })
        .eq('id', userId);
    } catch (error) {
      console.error('Error in updateUserHardnessPoints:', error);
    }
  };

  const calculateEndTime = (startTime: string, estimatedMinutes: number): string => {
    // Parse start time (assuming format like "09:00")
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Calculate end time
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + estimatedMinutes * 60000);
    
    // Format end time
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderSavedChoreItem = ({ item }: { item: Chore }) => (
    <TouchableOpacity 
      style={[
        styles.choreItem,
        selectedChores.includes(item.id) && styles.selectedChoreItem
      ]}
      onPress={() => handleChoreSelect(item.id)}
    >
      <View style={styles.choreCheckbox}>
        {selectedChores.includes(item.id) && (
          <Check size={16} color={COLORS.pureWhite} />
        )}
      </View>
      
      <View style={styles.choreInfo}>
        <Text style={styles.choreName}>{item.name}</Text>
        {item.location && (
          <View style={styles.choreLocation}>
            <MapPin size={12} color={COLORS.darkGray} />
            <Text style={styles.choreLocationText}>{item.location}</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => handleAssignChore(item)}
      >
        <Text style={styles.assignButtonText}>Assign</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'mine', label: 'Mine' },
    { id: 'completed', label: 'Completed' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'upcoming', label: 'Upcoming' },
  ] as { id: TaskFilter; label: string }[];

  // If there's a connection error, show it
  if (connectionError) {
    return (
      <View style={styles.container}>
        <Header
          title="Tasks"
          unreadCount={unreadNotifications}
          avatarUrl={user?.avatar}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{connectionError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Tasks"
        unreadCount={unreadNotifications}
        avatarUrl={user?.avatar}
      />
      
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={handleTaskPress}
            onComplete={handleCompleteTask}
          />
        )}
        ListHeaderComponent={
          <>
            <Calendar
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              viewType={calendarView}
              onViewTypeChange={handleViewTypeChange}
            />
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeFilter}
              onTabChange={handleFilterChange}
            />
            
            {tasks.length === 0 && !loading && (
              <EmptyState
                icon={<ClipboardList size={48} color={COLORS.darkGray} />}
                title="No tasks found"
                description="There are no tasks for the selected date and filter."
              />
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      
      <FloatingActionButton
        icon={<Plus size={24} color={COLORS.pureWhite} />}
        onPress={() => router.push('/tasks/new')}
      />
      
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Task</Text>
            
            {selectedChore && (
              <View style={styles.selectedChoreInfo}>
                <Text style={styles.selectedChoreName}>{selectedChore.name}</Text>
                {selectedChore.location && (
                  <View style={styles.choreLocation}>
                    <MapPin size={12} color={COLORS.darkGray} />
                    <Text style={styles.choreLocationText}>
                      {selectedChore.location}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.memberPickerContainer}>
              <Text style={styles.pickerLabel}>Assign to:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMember}
                  onValueChange={(value) => setSelectedMember(value)}
                  style={styles.picker}
                >
                  {householdMembers.map((member) => (
                    <Picker.Item
                      key={member.id}
                      label={member.name}
                      value={member.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.autoAssignToggle}
              onPress={() => setAutoAssign(!autoAssign)}
            >
              <View style={[
                styles.toggleCheckbox,
                autoAssign && styles.toggleCheckboxActive
              ]}>
                {autoAssign && <Check size={16} color={COLORS.pureWhite} />}
              </View>
              <Text style={styles.toggleText}>Auto-assign to best member</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAssignModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAssignment}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  choreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.pureWhite,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedChoreItem: {
    backgroundColor: COLORS.lightPrimary,
  },
  choreCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choreInfo: {
    flex: 1,
  },
  choreName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  choreLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  choreLocationText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  assignButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  assignButtonText: {
    color: COLORS.pureWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.pureWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  selectedChoreInfo: {
    marginBottom: 16,
  },
  selectedChoreName: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text,
  },
  memberPickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  autoAssignToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCheckboxActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.pureWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: COLORS.deepCharcoal,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.pureWhite,
    fontSize: 16,
    fontWeight: '500',
  },
});
