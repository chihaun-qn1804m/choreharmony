import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Clipboard,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import Header from '@/components/Header';
import FilterTabs from '@/components/FilterTabs';
import EmptyState from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { User, Household, HouseholdTab, RewardRequest } from '@/types';
import { Users, Award, Copy, Star, Trash2, ArrowLeft } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function HouseholdDetailsScreen() {
  const [activeTab, setActiveTab] = useState<HouseholdTab>('members');
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [rewards, setRewards] = useState<RewardRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch current user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (userError) {
          throw userError;
        }
        
        setCurrentUser(userData);
        
        if (userData.household_id) {
          // Fetch household
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .select('*')
            .eq('id', userData.household_id)
            .single();
            
          if (householdError) {
            throw householdError;
          }
          
          setHousehold(householdData);
          
          // Fetch members
          const { data: membersData, error: membersError } = await supabase
            .from('users')
            .select('*')
            .eq('household_id', userData.household_id)
            .order('stars', { ascending: false });
            
          if (membersError) {
            throw membersError;
          }
          
          setMembers(membersData || []);
          
          // Fetch rewards
          const { data: rewardsData, error: rewardsError } = await supabase
            .from('reward_requests')
            .select('*')
            .eq('household', userData.household_id)
            .order('created_at', { ascending: false });
            
          if (rewardsError) {
            throw rewardsError;
          }
          
          setRewards(rewardsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (household?.invite_code) {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(household.invite_code);
      } else {
        Clipboard.setString(household.invite_code);
      }
      Alert.alert('Success', 'Invite code copied to clipboard');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentUser?.is_house_owner) {
      Alert.alert('Error', 'Only household owners can remove members');
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the household?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update user to remove household_id
              const { error } = await supabase
                .from('users')
                .update({ household_id: null })
                .eq('id', memberId);
                
              if (error) {
                throw error;
              }
              
              // Refresh data
              fetchData();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleTabChange = (tab: HouseholdTab) => {
    setActiveTab(tab);
  };

  const renderMembersTab = () => {
    return (
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.memberItem}>
            <View style={styles.memberRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Image
              source={
                item.avatar
                  ? { uri: item.avatar }
                  : { uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=100&auto=format&fit=crop' }
              }
              style={styles.memberAvatar}
              contentFit="cover"
            />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.name}</Text>
              <View style={styles.memberStars}>
                <Star size={16} color={COLORS.warmCoral} />
                <Text style={styles.starsText}>{item.stars.toFixed(1)}</Text>
              </View>
            </View>
            {currentUser?.is_house_owner && item.id !== currentUser.id && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(item.id)}
              >
                <Trash2 size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No members"
            message="There are no members in this household yet."
            icon={<Users size={64} color={COLORS.darkGray} />}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderRewardsTab = () => {
    return (
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rewardItem}>
            <View style={styles.rewardHeader}>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <View style={styles.rewardCost}>
                <Star size={16} color={COLORS.warmCoral} />
                <Text style={styles.costText}>{item.cost.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.rewardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.rewardFooter}>
              <View
                style={[
                  styles.rewardStatus,
                  item.is_approved
                    ? styles.approvedStatus
                    : styles.pendingStatus,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.is_approved
                      ? styles.approvedStatusText
                      : styles.pendingStatusText,
                  ]}
                >
                  {item.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No rewards"
            message="There are no rewards in this household yet."
            icon={<Award size={64} color={COLORS.darkGray} />}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const tabs = [
    { id: 'members', label: 'Members' },
    { id: 'rewards', label: 'Rewards' },
  ] as { id: HouseholdTab; label: string }[];

  return (
    <View style={styles.container}>
      <Header
        title="Household Details"
        avatarUrl={currentUser?.avatar}
      />
      
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.deepCharcoal} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        {household ? (
          <>
            <View style={styles.householdCard}>
              <Text style={styles.householdName}>{household.name}</Text>
              <TouchableOpacity
                style={styles.inviteCodeContainer}
                onPress={handleCopyInviteCode}
              >
                <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
                <Text style={styles.inviteCode}>{household.invite_code}</Text>
                <Copy size={16} color={COLORS.warmCoral} />
              </TouchableOpacity>
            </View>
            
            <FilterTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            
            {activeTab === 'members' ? renderMembersTab() : renderRewardsTab()}
          </>
        ) : (
          <EmptyState
            title="No Household"
            message="You are not part of any household yet. Create or join a household to get started."
            icon={<Users size={64} color={COLORS.darkGray} />}
          />
        )}
      </View>
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
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginLeft: 8,
  },
  householdCard: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  householdName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.deepCharcoal,
    marginBottom: 12,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  inviteCodeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 8,
  },
  inviteCode: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    flex: 1,
    marginRight: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: COLORS.deepCharcoal,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.mediumGray,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 4,
  },
  memberStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  rewardItem: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rewardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    flex: 1,
    marginRight: 8,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmCoralLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.warmCoral,
    marginLeft: 4,
  },
  rewardDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rewardStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  approvedStatus: {
    backgroundColor: COLORS.freshMintLight,
  },
  pendingStatus: {
    backgroundColor: COLORS.lightGray,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  approvedStatusText: {
    color: COLORS.freshMint,
  },
  pendingStatusText: {
    color: COLORS.darkGray,
  },
});
