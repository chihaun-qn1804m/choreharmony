import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getDate, isSameDay, startOfMonth, endOfMonth, getDay, isToday } from 'date-fns';
import { CalendarViewType } from '@/types';

type CalendarProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewType: CalendarViewType;
  onViewTypeChange: (viewType: CalendarViewType) => void;
};

export default function Calendar({
  selectedDate,
  onDateChange,
  viewType,
  onViewTypeChange,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [monthDays, setMonthDays] = useState<Date[][]>([]);

  useEffect(() => {
    if (viewType === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start from Monday
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 }); // End on Sunday
      const days = eachDayOfInterval({ start, end });
      setWeekDays(days);
    } else {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // Get all days in the month
      const days = eachDayOfInterval({ start, end });
      
      // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
      const startDay = getDay(start);
      
      // Create an array for the days before the first day of the month
      const daysBeforeStart = [];
      for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
        daysBeforeStart.push(addDays(start, -i - 1));
      }
      daysBeforeStart.reverse();
      
      // Combine the days before, during, and potentially after the month
      const allDays = [...daysBeforeStart, ...days];
      
      // Ensure we have complete weeks (7 days each)
      const remainingDays = 7 - (allDays.length % 7);
      if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
          allDays.push(addDays(end, i));
        }
      }
      
      // Split into weeks
      const weeks: Date[][] = [];
      for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
      }
      
      setMonthDays(weeks);
    }
  }, [selectedDate, currentMonth, viewType]);

  const toggleViewType = () => {
    onViewTypeChange(viewType === 'week' ? 'month' : 'week');
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
  };

  const renderWeekView = () => {
    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekRow}>
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const dayNumber = getDate(day);
            const dayName = format(day, 'EEE');
            const isCurrentDay = isToday(day);
            const isWeekend = getDay(day) === 0 || getDay(day) === 6; // Sunday or Saturday

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  isSelected && styles.selectedDayItem,
                  isCurrentDay && styles.currentDayItem,
                  isWeekend && styles.weekendDayItem,
                ]}
                onPress={() => handleDateSelect(day)}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.selectedDayText,
                    isCurrentDay && styles.currentDayText,
                    isWeekend && styles.weekendDayText,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.selectedDayText,
                    isCurrentDay && styles.currentDayText,
                    isWeekend && styles.weekendDayText,
                  ]}
                >
                  {dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthView = () => {
    const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View style={styles.monthContainer}>
        <View style={styles.weekDayHeader}>
          {weekDayNames.map((name, index) => (
            <Text 
              key={index} 
              style={[
                styles.weekDayName,
                (index === 5 || index === 6) && styles.weekendDayName
              ]}
            >
              {name}
            </Text>
          ))}
        </View>

        {monthDays.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isCurrentDay = isToday(day);
              const isWeekend = dayIndex === 5 || dayIndex === 6; // Saturday or Sunday

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.monthDayItem,
                    isSelected && styles.selectedDayItem,
                    isCurrentDay && styles.currentDayItem,
                    !isCurrentMonth && styles.otherMonthDay,
                    isWeekend && styles.weekendMonthDayItem,
                  ]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text
                    style={[
                      styles.monthDayNumber,
                      isSelected && styles.selectedDayText,
                      isCurrentDay && styles.currentDayText,
                      !isCurrentMonth && styles.otherMonthDayText,
                      isWeekend && styles.weekendDayText,
                    ]}
                  >
                    {getDate(day)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleViewType}>
        <Text style={styles.monthYearText}>
          {format(selectedDate, 'MMMM yyyy')}
        </Text>
        {viewType === 'week' ? (
          <ChevronDown size={20} color={COLORS.deepCharcoal} />
        ) : (
          <ChevronUp size={20} color={COLORS.deepCharcoal} />
        )}
      </TouchableOpacity>

      {viewType === 'week' ? renderWeekView() : renderMonthView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginRight: 8,
  },
  weekContainer: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '13%', // Slightly narrower to fit all 7 days
    height: 60,
    borderRadius: 8,
  },
  weekendDayItem: {
    backgroundColor: COLORS.lightGray,
  },
  selectedDayItem: {
    backgroundColor: COLORS.warmCoralLight,
  },
  currentDayItem: {
    borderWidth: 1,
    borderColor: COLORS.warmCoral,
  },
  dayName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  weekendDayText: {
    color: COLORS.warmCoral,
  },
  dayNumber: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  selectedDayText: {
    color: COLORS.warmCoral,
  },
  currentDayText: {
    color: COLORS.warmCoral,
  },
  monthContainer: {
    width: '100%',
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.darkGray,
    width: '13%',
    textAlign: 'center',
  },
  weekendDayName: {
    color: COLORS.warmCoral,
  },
  monthDayItem: {
    width: '13%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  weekendMonthDayItem: {
    backgroundColor: COLORS.lightGray,
  },
  monthDayNumber: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  otherMonthDayText: {
    color: COLORS.darkGray,
  },
});
