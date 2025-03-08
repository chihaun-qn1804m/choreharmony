import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  MapPin,
  Search,
  Calendar as CalendarIcon,
  Droplets,
  X,
  ChevronDown,
  Check,
  Info,
} from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { Picker } from '@react-native-picker/picker';
import CustomSlider from '@/components/CustomSlider';

const { width } = Dimensions.get('window');

export default function WaterSchedulingScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0.33);
  const [location, setLocation] = useState('');
  const [waterHardness, setWaterHardness] = useState(50);
  const [frequency, setFrequency] = useState('daily');
  const [customFrequency, setCustomFrequency] = useState('1');
  const [showCustomFrequency, setShowCustomFrequency] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0.33)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleNextStep = () => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setProgress(nextStep / 3);
    } else {
      // Submit form
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setProgress(prevStep / 3);
    }
  };

  const handleFrequencyChange = (value) => {
    setFrequency(value);
    if (value === 'custom') {
      setShowCustomFrequency(true);
    } else {
      setShowCustomFrequency(false);
    }
  };

  const handleSubmit = () => {
    // In a real app, this would save the data to a database
    alert('Water scheduling saved successfully!');
    router.back();
  };

  const getHardnessLabel = () => {
    if (waterHardness < 30) return 'Soft';
    if (waterHardness < 70) return 'Medium';
    return 'Hard';
  };

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where are you watering?</Text>
      <Text style={styles.stepDescription}>
        Enter your location to help us determine the best watering schedule for your area.
      </Text>
      
      <CustomSlider
        showLocationPicker={true}
        location={location}
        onLocationChange={setLocation}
      />
      
      <View style={styles.mapPreview}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?q=80&w=1000&auto=format&fit=crop' }}
          style={styles.mapImage}
          contentFit="cover"
        />
        {location ? (
          <View style={styles.selectedLocationOverlay}>
            <MapPin size={24} color={COLORS.warmCoral} />
            <Text style={styles.selectedLocationText}>{location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderWaterHardnessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepTitleContainer}>
        <Text style={styles.stepTitle}>Water Hardness</Text>
        <TouchableOpacity onPress={() => setShowInfoModal(true)}>
          <Info size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
      <Text style={styles.stepDescription}>
        Set the hardness level of your water to optimize your watering schedule.
      </Text>
      
      <CustomSlider
        value={waterHardness}
        onValueChange={setWaterHardness}
        minValue={0}
        maxValue={100}
        step={1}
        labels={['Soft', 'Medium', 'Hard']}
        colorGradient={true}
        startColor="#3498db"
        endColor="#e74c3c"
      />
      
      <View style={styles.hardnessInfoContainer}>
        <View style={styles.hardnessInfoItem}>
          <Droplets size={20} color="rgb(52, 152, 219)" />
          <Text style={styles.hardnessInfoText}>
            <Text style={styles.hardnessInfoBold}>Soft water</Text> (0-30)
            {'\n'}Less minerals, gentle on plants
          </Text>
        </View>
        
        <View style={styles.hardnessInfoItem}>
          <Droplets size={20} color="rgb(155, 89, 182)" />
          <Text style={styles.hardnessInfoText}>
            <Text style={styles.hardnessInfoBold}>Medium water</Text> (31-70)
            {'\n'}Balanced mineral content
          </Text>
        </View>
        
        <View style={styles.hardnessInfoItem}>
          <Droplets size={20} color="rgb(231, 76, 60)" />
          <Text style={styles.hardnessInfoText}>
            <Text style={styles.hardnessInfoBold}>Hard water</Text> (71-100)
            {'\n'}High mineral content, may require more water
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFrequencyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Watering Frequency</Text>
      <Text style={styles.stepDescription}>
        How often would you like to water your plants?
      </Text>
      
      <View style={styles.frequencyContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={frequency}
            onValueChange={handleFrequencyChange}
            style={styles.picker}
          >
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Every 2 days" value="every2days" />
            <Picker.Item label="Every 3 days" value="every3days" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Custom" value="custom" />
          </Picker>
        </View>
        
        {showCustomFrequency && (
          <View style={styles.customFrequencyContainer}>
            <Text style={styles.customFrequencyLabel}>Every</Text>
            <TextInput
              style={styles.customFrequencyInput}
              value={customFrequency}
              onChangeText={setCustomFrequency}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.customFrequencyLabel}>days</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setShowCalendar(true)}
        >
          <CalendarIcon size={20} color="#4CAF50" />
          <Text style={styles.calendarButtonText}>Open Calendar View</Text>
          <ChevronDown size={16} color="#4CAF50" />
        </TouchableOpacity>
        
        <View style={styles.schedulePreview}>
          <Text style={styles.schedulePreviewTitle}>Your Watering Schedule</Text>
          
          <View style={styles.schedulePreviewContent}>
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Mon</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, styles.schedulePreviewActive]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Tue</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' ? styles.schedulePreviewActive : null]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Wed</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' || frequency === 'every2days' ? styles.schedulePreviewActive : null]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Thu</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' ? styles.schedulePreviewActive : null]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Fri</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' || frequency === 'every2days' ? styles.schedulePreviewActive : null]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Sat</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' || frequency === 'every3days' ? styles.schedulePreviewActive : null]} />
            </View>
            
            <View style={styles.schedulePreviewItem}>
              <View style={styles.schedulePreviewDay}>
                <Text style={styles.schedulePreviewDayText}>Sun</Text>
              </View>
              <View style={[styles.schedulePreviewIndicator, frequency === 'daily' || frequency === 'weekly' ? styles.schedulePreviewActive : null]} />
            </View>
          </View>
          
          <Text style={styles.schedulePreviewDescription}>
            {frequency === 'daily' && 'Watering every day'}
            {frequency === 'every2days' && 'Watering every 2 days'}
            {frequency === 'every3days' && 'Watering every 3 days'}
            {frequency === 'weekly' && 'Watering once a week'}
            {frequency === 'custom' && `Watering every ${customFrequency} days`}
          </Text>
        </View>
      </View>
    </View>
  );

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
          <ChevronLeft size={24} color={COLORS.deepCharcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Scheduling</Text>
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
      
      <View style={styles.stepsIndicator}>
        <TouchableOpacity 
          style={[styles.stepIndicator, currentStep >= 1 && styles.activeStepIndicator]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={[styles.stepIndicatorText, currentStep >= 1 && styles.activeStepIndicatorText]}>1</Text>
        </TouchableOpacity>
        <View style={styles.stepConnector} />
        <TouchableOpacity 
          style={[styles.stepIndicator, currentStep >= 2 && styles.activeStepIndicator]}
          onPress={() => currentStep >= 2 && setCurrentStep(2)}
        >
          <Text style={[styles.stepIndicatorText, currentStep >= 2 && styles.activeStepIndicatorText]}>2</Text>
        </TouchableOpacity>
        <View style={styles.stepConnector} />
        <TouchableOpacity 
          style={[styles.stepIndicator, currentStep >= 3 && styles.activeStepIndicator]}
          onPress={() => currentStep >= 3 && setCurrentStep(3)}
        >
          <Text style={[styles.stepIndicatorText, currentStep >= 3 && styles.activeStepIndicatorText]}>3</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentStep === 1 && renderLocationStep()}
        {currentStep === 2 && renderWaterHardnessStep()}
        {currentStep === 3 && renderFrequencyStep()}
      </ScrollView>
      
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrevStep}
          >
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 && !location && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={currentStep === 1 && !location}
        >
          <Text style={styles.nextButtonText}>
            {currentStep < 3 ? 'Next' : 'Save Schedule'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Select Watering Days</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarGrid}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    selectedDays.includes(index) && styles.selectedCalendarDay
                  ]}
                  onPress={() => {
                    if (selectedDays.includes(index)) {
                      setSelectedDays(selectedDays.filter(d => d !== index));
                    } else {
                      setSelectedDays([...selectedDays, index]);
                    }
                  }}
                >
                  <Text style={[
                    styles.calendarDayText,
                    selectedDays.includes(index) && styles.selectedCalendarDayText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.calendarPresets}>
              <Text style={styles.calendarPresetsTitle}>Quick Select:</Text>
              <View style={styles.calendarPresetsButtons}>
                <TouchableOpacity 
                  style={styles.calendarPresetButton}
                  onPress={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                >
                  <Text style={styles.calendarPresetButtonText}>Every Day</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.calendarPresetButton}
                  onPress={() => setSelectedDays([0, 2, 4, 6])}
                >
                  <Text style={styles.calendarPresetButtonText}>Alternate Days</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.calendarPresetButton}
                  onPress={() => setSelectedDays([0, 3, 6])}
                >
                  <Text style={styles.calendarPresetButtonText}>Every 3 Days</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.calendarPresetButton}
                  onPress={() => setSelectedDays([6])}
                >
                  <Text style={styles.calendarPresetButtonText}>Weekends Only</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.calendarApplyButton}
              onPress={() => {
                if (selectedDays.length > 0) {
                  setFrequency('custom');
                  setShowCalendar(false);
                } else {
                  alert('Please select at least one day');
                }
              }}
            >
              <Text style={styles.calendarApplyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableOpacity 
          style={styles.infoModalOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalContent}>
              <Text style={styles.infoModalTitle}>About Water Hardness</Text>
              <Text style={styles.infoModalText}>
                Water hardness refers to the mineral content in your water, primarily calcium and magnesium.
              </Text>
              
              <View style={styles.infoModalSection}>
                <Text style={styles.infoModalSectionTitle}>Why it matters:</Text>
                <Text style={styles.infoModalText}>
                  • Hard water can leave mineral deposits on plants and soil{'\n'}
                  • Soft water may lack essential minerals for plant growth{'\n'}
                  • Different plants have different preferences for water hardness
                </Text>
              </View>
              
              <View style={styles.infoModalSection}>
                <Text style={styles.infoModalSectionTitle}>How to measure:</Text>
                <Text style={styles.infoModalText}>
                  You can test your water hardness using a home test kit available at most garden centers or hardware stores.
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.infoModalCloseButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.infoModalCloseButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    color: '#333333',
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#F5F5F5',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepIndicator: {
    backgroundColor: '#3498db',
  },
  stepIndicatorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#9E9E9E',
  },
  activeStepIndicatorText: {
    color: '#FFFFFF',
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#333333',
    marginBottom: 8,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 24,
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  selectedLocationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectedLocationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  hardnessInfoContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
  },
  hardnessInfoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hardnessInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  hardnessInfoBold: {
    fontFamily: 'Inter-SemiBold',
  },
  frequencyContainer: {
    marginBottom: 24,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  customFrequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customFrequencyLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  customFrequencyInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  calendarButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#4CAF50',
    marginHorizontal: 8,
  },
  schedulePreview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
  },
  schedulePreviewTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  schedulePreviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  schedulePreviewItem: {
    alignItems: 'center',
  },
  schedulePreviewDay: {
    marginBottom: 8,
  },
  schedulePreviewDayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#9E9E9E',
  },
  schedulePreviewIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  schedulePreviewActive: {
    backgroundColor: '#3498db',
  },
  schedulePreviewDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  prevButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 16,
    marginRight: 8,
  },
  prevButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
  },
  nextButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  calendarModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  calendarModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#333333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  calendarDay: {
    width: (width - 48) / 7,
    height: (width - 48) / 7,
    borderRadius: (width - 48) / 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCalendarDay: {
    backgroundColor: '#3498db',
  },
  calendarDayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
  },
  selectedCalendarDayText: {
    color: '#FFFFFF',
  },
  calendarPresets: {
    marginBottom: 24,
  },
  calendarPresetsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  calendarPresetsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarPresetButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    width: '48%',
  },
  calendarPresetButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  calendarApplyButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  calendarApplyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  infoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  infoModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoModalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoModalSection: {
    marginBottom: 16,
  },
  infoModalSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  infoModalCloseButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  infoModalCloseButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
