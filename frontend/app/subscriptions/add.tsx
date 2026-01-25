import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { subscriptionAPI } from '../../src/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useLocalSubscriptionStore } from '../../src/store/localSubscriptionStore';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();
  const { addSubscription: addLocalSubscription } = useLocalSubscriptionStore();
  
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [isRenewalDatePickerVisible, setRenewalDatePickerVisibility] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => subscriptionAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      router.back();
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.detail || 'Failed to add subscription' });
    },
  });

  const validateForm = () => {
    const newErrors: any = {};

    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    }

    if (!price || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be greater than zero';
    }

    if (!renewalDate) {
      newErrors.renewalDate = 'Renewal date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !renewalDate) return;

    const data: any = {
      service_name: serviceName.trim(),
      price: parseFloat(price),
      renewal_date: renewalDate.toISOString(),
    };

    if (startDate) {
      data.start_date = startDate.toISOString();
    }
    if (category.trim()) {
      data.category = category.trim();
    }
    if (notes.trim()) {
      data.notes = notes.trim();
    }

    if (isGuest) {
      setSubmitting(true);
      try {
        await addLocalSubscription(data);
        router.back();
      } catch (error) {
        setErrors({ submit: 'Failed to add subscription' });
      } finally {
        setSubmitting(false);
      }
    } else {
      mutation.mutate(data);
    }
  };

  const showRenewalDatePicker = () => {
    setRenewalDatePickerVisibility(true);
  };

  const hideRenewalDatePicker = () => {
    setRenewalDatePickerVisibility(false);
  };

  const handleRenewalDateConfirm = (date: Date) => {
    setRenewalDate(date);
    hideRenewalDatePicker();
  };

  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    hideStartDatePicker();
  };

  const loading = mutation.isPending || submitting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Subscription" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text variant="bodyLarge" style={styles.formDescription}>
              Track a new recurring subscription
            </Text>

            <TextInput
              label="Service Name *"
              value={serviceName}
              onChangeText={setServiceName}
              mode="outlined"
              style={styles.input}
              error={!!errors.serviceName}
            />
            {errors.serviceName && (
              <HelperText type="error">{errors.serviceName}</HelperText>
            )}

            <TextInput
              label="Price *"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              error={!!errors.price}
            />
            {errors.price && <HelperText type="error">{errors.price}</HelperText>}

            <TouchableOpacity onPress={showRenewalDatePicker}>
              <View pointerEvents="none">
                <TextInput
                  label="Renewal Date *"
                  value={renewalDate ? format(renewalDate, 'MMM dd, yyyy') : ''}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.renewalDate}
                  right={
                    <TextInput.Icon icon={() => <Ionicons name="calendar" size={24} color="#666" />} />
                  }
                  editable={false}
                />
              </View>
            </TouchableOpacity>
            {errors.renewalDate && (
              <HelperText type="error">{errors.renewalDate}</HelperText>
            )}

            <TouchableOpacity onPress={showStartDatePicker}>
              <View pointerEvents="none">
                <TextInput
                  label="Start Date (Optional)"
                  value={startDate ? format(startDate, 'MMM dd, yyyy') : ''}
                  mode="outlined"
                  style={styles.input}
                  right={
                    <TextInput.Icon icon={() => <Ionicons name="calendar" size={24} color="#666" />} />
                  }
                  editable={false}
                />
              </View>
            </TouchableOpacity>

            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              mode="outlined"
              placeholder="e.g., Streaming, Productivity"
              style={styles.input}
            />

            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            {errors.submit && (
              <HelperText type="error">{errors.submit}</HelperText>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                Add Subscription
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isRenewalDatePickerVisible}
        mode="date"
        onConfirm={handleRenewalDateConfirm}
        onCancel={hideRenewalDatePicker}
        minimumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartDatePicker}
        maximumDate={new Date()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    flex: 1,
  },
  formDescription: {
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
