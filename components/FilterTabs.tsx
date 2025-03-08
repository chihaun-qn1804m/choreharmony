import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { TaskFilter, RewardFilter, HouseholdTab } from '@/types';

type FilterTabsProps<T extends string> = {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export default function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: FilterTabsProps<T>) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
            >
              <Text
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  activeTab: {
    backgroundColor: COLORS.warmCoral,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.deepCharcoal,
  },
  activeTabText: {
    color: COLORS.pureWhite,
  },
});
