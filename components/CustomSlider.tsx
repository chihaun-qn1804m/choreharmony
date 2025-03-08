import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { MapPin, Search, X, Check, Plus } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

const { width } = Dimensions.get('window');

// Default location suggestions
const DEFAULT_LOCATIONS = [
  { id: '1', name: 'Kitchen', address: 'Indoor' },
  { id: '2', name: 'Living Room', address: 'Indoor' },
  { id: '3', name: 'Bathroom', address: 'Indoor' },
  { id: '4', name: 'Bedroom', address: 'Indoor' },
  { id: '5', name: 'Outdoor', address: 'Exterior' },
  { id: '6', name: 'Garage', address: 'Exterior' },
  { id: '7', name: 'Basement', address: 'Indoor' },
];

type CustomSliderProps = {
  value?: number;
  onValueChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  labels?: string[];
  colorGradient?: boolean;
  startColor?: string;
  endColor?: string;
  showLocationPicker?: boolean;
  location?: string;
  onLocationChange?: (location: string) => void;
};

export default function CustomSlider({
  value = 0,
  onValueChange = () => {},
  minValue = 0,
  maxValue = 100,
  step = 1,
  labels = [],
  colorGradient = false,
  startColor = '#3498db',
  endColor = '#e74c3c',
  showLocationPicker = false,
  location = '',
  onLocationChange = () => {},
}: CustomSliderProps) {
  const [sliderValue, setSliderValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [filteredLocations, setFilteredLocations] = useState(DEFAULT_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState(location);
  const [newLocation, setNewLocation] = useState('');
  
  const sliderPosition = useRef(new Animated.Value(calculatePositionFromValue(value))).current;
  const sliderWidth = useRef(0);
  
  // Update the slider position when the value prop changes
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(value);
      sliderPosition.setValue(calculatePositionFromValue(value));
    }
  }, [value, isDragging]);
  
  // Update filtered locations based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchQuery, locations]);
  
  // Update selected location when location prop changes
  useEffect(() => {
    setSelectedLocation(location);
  }, [location]);
  
  // Calculate the position (0-100%) from a value
  function calculatePositionFromValue(val: number): number {
    return ((val - minValue) / (maxValue - minValue)) * 100;
  }
  
  // Calculate the value from a position (0-100%)
  function calculateValueFromPosition(position: number): number {
    let rawValue = minValue + (position / 100) * (maxValue - minValue);
    
    // Apply step if provided
    if (step > 0) {
      rawValue = Math.round(rawValue / step) * step;
    }
    
    // Ensure the value is within bounds
    return Math.max(minValue, Math.min(maxValue, rawValue));
  }
  
  // Get color based on position for gradient effect
  function getColorForPosition(position: number): string {
    if (!colorGradient) return startColor;
    
    // Create a gradient from startColor to endColor
    const startRGB = hexToRgb(startColor) || { r: 0, g: 0, b: 0 };
    const endRGB = hexToRgb(endColor) || { r: 255, g: 0, b: 0 };
    
    const ratio = position / 100;
    
    const r = Math.round(startRGB.r + ratio * (endRGB.r - startRGB.r));
    const g = Math.round(startRGB.g + ratio * (endRGB.g - startRGB.g));
    const b = Math.round(startRGB.b + ratio * (endRGB.b - startRGB.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Convert hex color to RGB
  function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  // Create pan responder for slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Store the current position to prevent jumps
        sliderPosition.setOffset(sliderPosition.__getValue());
        sliderPosition.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate position based on drag
        const containerWidth = sliderWidth.current;
        if (containerWidth <= 0) return;
        
        // Calculate percentage moved
        const dx = gestureState.dx;
        const percentageMoved = (dx / containerWidth) * 100;
        
        // Update the animated value
        sliderPosition.setValue(percentageMoved);
      },
      onPanResponderRelease: () => {
        // Combine offset and value
        sliderPosition.flattenOffset();
        
        // Get the current position
        const currentPosition = sliderPosition.__getValue();
        
        // Ensure position is within bounds (0-100%)
        const boundedPosition = Math.max(0, Math.min(100, currentPosition));
        
        // Calculate the value from the position
        const newValue = calculateValueFromPosition(boundedPosition);
        
        // Calculate the position from the snapped value
        const snappedPosition = calculatePositionFromValue(newValue);
        
        // Animate to the snapped position
        Animated.spring(sliderPosition, {
          toValue: snappedPosition,
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();
        
        // Update the value state
        setSliderValue(newValue);
        
        // Notify parent component of the value change
        onValueChange(newValue);
        
        // End dragging state
        setIsDragging(false);
      },
    })
  ).current;
  
  // Handle location selection
  const handleLocationSelect = (item: any) => {
    setSelectedLocation(item.name);
    onLocationChange(item.name);
    setShowLocationModal(false);
  };
  
  // Handle adding a new location
  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    
    // Create a new location object
    const newLocationObj = {
      id: Date.now().toString(),
      name: newLocation.trim(),
      address: 'Custom',
    };
    
    // Add to locations list
    const updatedLocations = [...locations, newLocationObj];
    setLocations(updatedLocations);
    setFilteredLocations(updatedLocations);
    
    // Select the new location
    setSelectedLocation(newLocation.trim());
    onLocationChange(newLocation.trim());
    
    // Clear the input
    setNewLocation('');
    
    // Close the modal
    setShowLocationModal(false);
  };
  
  // Handle slider layout to get width
  const onSliderLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    sliderWidth.current = width;
  };
  
  return (
    <View style={styles.container}>
      {/* Slider Component */}
      {!showLocationPicker && (
        <View style={styles.sliderContainer}>
          {labels.length > 0 && (
            <View style={styles.labelsContainer}>
              {labels.map((label, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.labelText,
                    { color: colorGradient ? getColorForPosition(index * 100 / (labels.length - 1)) : COLORS.darkGray }
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>
          )}
          
          <View 
            style={styles.sliderTrack}
            onLayout={onSliderLayout}
          >
            <Animated.View 
              style={[
                styles.sliderFill, 
                { 
                  width: sliderPosition.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: getColorForPosition(sliderValue / (maxValue - minValue) * 100)
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.sliderThumb, 
                { 
                  left: sliderPosition.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: getColorForPosition(sliderValue / (maxValue - minValue) * 100)
                }
              ]}
              {...panResponder.panHandlers}
            />
          </View>
          
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{sliderValue}</Text>
          </View>
        </View>
      )}
      
      {/* Location Picker (if enabled) */}
      {showLocationPicker && (
        <View style={styles.locationContainer}>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <MapPin size={20} color={COLORS.warmCoral} style={styles.locationIcon} />
            <Text style={styles.locationText}>
              {selectedLocation || 'Select a location'}
            </Text>
            <Plus size={20} color={COLORS.warmCoral} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Location Selection Modal */}
      {showLocationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowLocationModal(false)}
              >
                <X size={24} color={COLORS.deepCharcoal} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={COLORS.darkGray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for a location"
                  placeholderTextColor={COLORS.darkGray}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            
            <View style={styles.addLocationContainer}>
              <TextInput
                style={styles.addLocationInput}
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="Add a new location"
                placeholderTextColor={COLORS.darkGray}
              />
              <TouchableOpacity 
                style={[
                  styles.addLocationButton,
                  !newLocation.trim() && styles.disabledButton
                ]}
                onPress={handleAddLocation}
                disabled={!newLocation.trim()}
              >
                <Plus size={20} color={COLORS.pureWhite} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.suggestionItem,
                    selectedLocation === item.name && styles.selectedSuggestionItem
                  ]}
                  onPress={() => handleLocationSelect(item)}
                >
                  <MapPin size={16} color={selectedLocation === item.name ? COLORS.warmCoral : COLORS.darkGray} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={[
                      styles.suggestionTitle,
                      selectedLocation === item.name && styles.selectedSuggestionText
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={styles.suggestionAddress}>{item.address}</Text>
                  </View>
                  {selectedLocation === item.name && (
                    <Check size={16} color={COLORS.warmCoral} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>
                    No locations found. Add a new one above.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.darkGray,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    marginLeft: -12,
    borderWidth: 2,
    borderColor: COLORS.pureWhite,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  valueText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.deepCharcoal,
  },
  locationContainer: {
    marginTop: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.pureWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: COLORS.deepCharcoal,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  addLocationContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addLocationInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginRight: 8,
  },
  addLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.warmCoral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.mediumGray,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedSuggestionItem: {
    backgroundColor: COLORS.warmCoralLight,
  },
  suggestionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  selectedSuggestionText: {
    color: COLORS.warmCoral,
  },
  suggestionAddress: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  }
});
