import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { Household } from '@/types';

type AddChoreModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddChore: (chore: {
    name: string;
    type: string;
    location: string;
    frequency: string;
    hardness: number;
    estimatedTime: number;
    description: string;
  }) => void;
  onAutoAssign: () => void;
  household: Household | null;
};

export default function AddChoreModal({
  visible,
  onClose,
  onAddChore,
  onAutoAssign,
  household,
}: AddChoreModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [hardness, setHardness] = useState(1);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [description, setDescription] = useState('');

  const handleAddChore = () => {
    if (!name.trim()) {
      // Show error
      return;
    }

    onAddChore({
      name,
      type,
      location,
      frequency,
      hardness,
      estimatedTime: parseInt(estimatedTime) || 0,
      description,
    });

    // Reset form
    setName('');
    setType('');
    setLocation('');
    setFrequency('Daily');
    setHardness(1);
    setEstimatedTime('');
    setDescription('');
  };

  const frequencyOptions = ['Daily', 'Weekly', 'Monthly'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Chore</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.deepCharcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter chore name"
                placeholderTextColor={COLORS.darkGray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {household?.chore_types.map((choreType, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        type === choreType && styles.selectedOption,
                      ]}
                      onPress={() => setType(choreType)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          type === choreType && styles.selectedOptionText,
                        ]}
                      >
                        {choreType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {household?.locations.map((loc, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        location === loc && styles.selectedOption,
                      ]}
                      onPress={() => setLocation(loc)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          location === loc && styles.selectedOptionText,
                        ]}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {frequencyOptions.map((freq, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        frequency === freq && styles.selectedOption,
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          frequency === freq && styles.selectedOptionText,
                        ]}
                      >
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hardness (1-5)</Text>
              <View style={styles.hardnessContainer}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.hardnessButton,
                      hardness === value && styles.selectedHardness,
                    ]}
                    onPress={() => setHardness(value)}
                  >
                    <Text
                      style={[
                        styles.hardnessText,
                        hardness === value && styles.selectedHardnessText,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={COLORS.darkGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddChore}
            >
              <Text style={styles.buttonText}>Add Chore</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.assignButton]}
              onPress={onAutoAssign}
            >
              <Text style={styles.buttonText}>Auto-Assign Chores</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalContent: {
    backgroundColor: COLORS.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
    maxHeight: '70%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  textArea: {
    minHeight: 100,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  selectedOption: {
    backgroundColor: COLORS.warmCoral,
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.deepCharcoal,
  },
  selectedOptionText: {
    color: COLORS.pureWhite,
  },
  hardnessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hardnessButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedHardness: {
    backgroundColor: COLORS.warmCoral,
  },
  hardnessText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  selectedHardnessText: {
    color: COLORS.pureWhite,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.warmCoral,
  },
  assignButton: {
    backgroundColor: COLORS.freshMint,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.pureWhite,
  },
});
