import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Plus, Star, Info } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Household, User } from '@/types';
import CustomSlider from '@/components/CustomSlider';

export default function TasksNewScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState(1); // 1 = Daily, 2 = Every 2 days, 3 = Every 3 days, 7 = Weekly, 30 = Monthly
  const [hardness, setHardness] = useState(1);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [location, setLocation] = useState('');
  const [household, setHousehold] = useState<Household | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [starRating, setStarRating] = useState(3);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchUserAndHousehold();
  }, []);

  const fetchUserAndHousehold = async () => {
    setInitialLoading(true);
    try {
      console.log('Fetching user and household data...');
      // Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authUser) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      console.log('Auth user found:', authUser.id);
      
      // Fetch user data including household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (userError) {
        console.error('User data error:', userError);
        throw userError;
      }
      
      console.log('User data fetched:', userData);
      setUser(userData);
      
      if (userData.household_id) {
        // Fetch household data
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('*')
          .eq('id', userData.household_id)
          .single();
          
        if (householdError) {
          console.error('Household error:', householdError);
          throw householdError;
        }
        
        console.log('Household data fetched:', householdData);
        setHousehold(householdData);
      } else {
        console.log('User has no household');
      }
    } catch (error) {
      console.error('Error fetching user and household:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Chore name is required');
      return;
    }

    if (!user?.household_id) {
      Alert.alert('Error', 'You must be part of a household to create chores');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Saving chore template...');
      // Generate slug from name
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      
      // Convert frequency to string format
      let frequencyString = 'Daily';
      if (frequency === 2) frequencyString = 'Every 2 days';
      else if (frequency === 3) frequencyString = 'Every 3 days';
      else if (frequency === 7) frequencyString = 'Weekly';
      else if (frequency === 30) frequencyString = 'Monthly';
      
      console.log('Inserting chore with data:', {
        household: user.household_id,
        name,
        slug,
        description,
        frequency: frequencyString,
        hardness,
        estimated_time: parseInt(estimatedTime) || 0,
        location,
        stars: starRating,
      });
      
      // Insert into chores table
      const { data, error } = await supabase
        .from('chores')
        .insert({
          household: user.household_id,
          name,
          slug,
          description,
          frequency: frequencyString,
          hardness,
          estimated_time: parseInt(estimatedTime) || 0,
          location,
          stars: starRating,
        })
        .select();
        
      if (error) {
        console.error('Error saving chore:', error);
        throw error;
      }
      
      console.log('Chore saved successfully:', data);
      
      Alert.alert(
        'Success', 
        'Chore template saved successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push('/tasks')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error saving chore template:', error);
      setError(error.message || 'Error saving chore template');
      Alert.alert('Error', error.message || 'Error saving chore template');
    } finally {
      setLoading(false);
    }
  };
  
  const getFrequencyLabel = () => {
    if (frequency === 1) return 'Daily';
    if (frequency === 2) return 'Every 2 days';
    if (frequency === 3) return 'Every 3 days';
    if (frequency === 7) return 'Weekly';
    return 'Monthly';
  };
  
  const getHardnessLabel = () => {
    const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return labels[hardness - 1];
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setStarRating(star)}
            style={styles.starButton}
          >
            <Star
              size={32}
              color={COLORS.warmCoral}
              fill={star <= starRating ? COLORS.warmCoral : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.warmCoral} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.warmCoral} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Chore Template</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter chore name"
              placeholderTextColor={COLORS.darkGray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter chore description"
              placeholderTextColor={COLORS.darkGray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Frequency</Text>
              <Text style={styles.valueLabel}>{getFrequencyLabel()}</Text>
            </View>
            <CustomSlider
              value={frequency}
              onValueChange={setFrequency}
              minValue={1}
              maxValue={30}
              step={1}
              labels={['Daily', 'Weekly', 'Monthly']}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Hardness</Text>
              <Text style={styles.valueLabel}>{getHardnessLabel()}</Text>
            </View>
            <CustomSlider
              value={hardness}
              onValueChange={setHardness}
              minValue={1}
              maxValue={5}
              step={1}
              labels={['Easy', 'Medium', 'Hard']}
              colorGradient={true}
              startColor="#4CAF50"
              endColor="#F44336"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={estimatedTime}
              onChangeText={(text) => setEstimatedTime(text.replace(/[^0-9]/g, ''))}
              placeholder="Enter estimated time"
              placeholderTextColor={COLORS.darkGray}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <CustomSlider
              value={0}
              onValueChange={() => {}}
              showLocationPicker={true}
              location={location}
              onLocationChange={setLocation}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Stars Reward</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(true)}>
                <Info size={18} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>How many stars will members earn for completing this chore?</Text>
            {renderStarRating()}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveTemplate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.pureWhite} />
            ) : (
              <Text style={styles.saveButtonText}>Save Template</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Info Modal for Stars */}
      {showInfoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>About Star Rewards</Text>
            <Text style={styles.infoModalText}>
              Stars are earned by household members when they complete chores. These stars can be redeemed for rewards set by the household owner.
            </Text>
            <Text style={styles.infoModalText}>
              <Text style={styles.infoModalBold}>Recommended star values:</Text>
            </Text>
            <View style={styles.infoModalList}>
              <Text style={styles.infoModalListItem}>• 1 star: Very quick, easy tasks</Text>
              <Text style={styles.infoModalListItem}>• 2-3 stars: Average difficulty tasks</Text>
              <Text style={styles.infoModalListItem}>• 4-5 stars: Difficult or time-consuming tasks</Text>
            </View>
            <Text style={styles.infoModalText}>
              Stars should reflect both the difficulty and time required to complete the chore.
            </Text>
            <TouchableOpacity
              style={styles.infoModalCloseButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pureWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.pureWhite,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: COLORS.warmCoralLight,
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.error,
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.warmCoral,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  starButton: {
    padding: 8,
  },
  helperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: COLORS.warmCoral,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.pureWhite,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    backgroundColor: COLORS.pureWhite,
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 400,
    alignSelf: 'center',
  },
  infoModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.deepCharcoal,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoModalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 12,
    lineHeight: 22,
  },
  infoModalBold: {
    fontFamily: 'Inter-SemiBold',
  },
  infoModalList: {
    marginBottom: 12,
  },
  infoModalListItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
    paddingLeft: 8,
  },
  infoModalCloseButton: {
    backgroundColor: COLORS.warmCoral,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  infoModalCloseButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.pureWhite,
  },
});
