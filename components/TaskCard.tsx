import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { Assignment } from '@/types';

type TaskCardProps = {
  task: Assignment;
  onPress: (task: Assignment) => void;
  onComplete?: (task: Assignment) => void;
};

export default function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  const handlePress = () => {
    onPress(task);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(task);
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isCompleted && styles.completedText]}>
            {task.title}
          </Text>
          {task.start_time && (
            <View style={styles.timeContainer}>
              <Clock size={14} color={COLORS.darkGray} />
              <Text style={styles.timeText}>
                {task.start_time}
                {task.end_time ? ` - ${task.end_time}` : ''}
              </Text>
            </View>
          )}
        </View>

        {task.description && (
          <Text
            style={[styles.description, isCompleted && styles.completedText]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}

        <View style={styles.footer}>
          {task.location && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color={COLORS.darkGray} />
              <Text style={styles.locationText}>{task.location}</Text>
            </View>
          )}

          {!isCompleted && onComplete && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <CheckCircle size={20} color={COLORS.warmCoral} />
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warmCoral,
  },
  completedContainer: {
    borderLeftColor: COLORS.freshMint,
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    flex: 1,
  },
  completedText: {
    color: COLORS.darkGray,
    textDecorationLine: 'line-through',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmCoralLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.warmCoral,
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: COLORS.freshMintLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.freshMint,
  },
});
