import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react-native';

export default function NotificationSettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [taskAssignments, setTaskAssignments] = useState(true);
  const [householdUpdates, setHouseholdUpdates] = useState(true);
  const [rewardUpdates, setRewardUpdates] = useState(true);
  const router = useRouter();

  const renderToggleItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => {
    return (
      <View style={styles.toggleItem}>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.mediumGray, true: COLORS.warmCoralLight }}
          thumbColor={value ? COLORS.warmCoral : COLORS.darkGray}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notification Settings"
        showNotification={false}
        showAvatar={false}
      />
      
      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.deepCharcoal} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          {renderToggleItem(
            'Push Notifications',
            'Receive notifications on your device',
            pushNotifications,
            setPushNotifications
          )}
          {renderToggleItem(
            'Email Notifications',
            'Receive notifications via email',
            emailNotifications,
            setEmailNotifications
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          {renderToggleItem(
            'Task Reminders',
            'Get reminded about upcoming tasks',
            taskReminders,
            setTaskReminders
          )}
          {renderToggleItem(
            'Task Assignments',
            'Get notified when you are assigned a new task',
            taskAssignments,
            setTaskAssignments
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          {renderToggleItem(
            'Household Updates',
            'Get notified about changes in your household',
            householdUpdates,
            setHouseholdUpdates
          )}
          {renderToggleItem(
            'Reward Updates',
            'Get notified about reward requests and approvals',
            rewardUpdates,
            setRewardUpdates
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginLeft: 8,
  },
  section: {
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
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 4,
  },
  toggleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
  },
});
