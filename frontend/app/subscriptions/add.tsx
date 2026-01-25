import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<any>({});

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
    } else {
      const date = new Date(renewalDate);
      if (isNaN(date.getTime())) {
        newErrors.renewalDate = 'Invalid date format (use YYYY-MM-DD)';
      }
    }

    if (startDate) {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        newErrors.startDate = 'Invalid date format (use YYYY-MM-DD)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const data: any = {
      service_name: serviceName.trim(),
      price: parseFloat(price),
      renewal_date: new Date(renewalDate).toISOString(),
    };

    if (startDate) {
      data.start_date = new Date(startDate).toISOString();
    }
    if (category.trim()) {
      data.category = category.trim();
    }
    if (notes.trim()) {
      data.notes = notes.trim();
    }

    mutation.mutate(data);
  };

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

            <TextInput
              label="Renewal Date (YYYY-MM-DD) *"
              value={renewalDate}
              onChangeText={setRenewalDate}
              mode="outlined"
              placeholder="2025-12-31"
              style={styles.input}
              error={!!errors.renewalDate}
            />
            {errors.renewalDate && (
              <HelperText type="error">{errors.renewalDate}</HelperText>
            )}

            <TextInput
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              placeholder="2025-01-01"
              style={styles.input}
              error={!!errors.startDate}
            />
            {errors.startDate && (
              <HelperText type="error">{errors.startDate}</HelperText>
            )}

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
                loading={mutation.isPending}
                disabled={mutation.isPending}
                style={styles.submitButton}
              >
                Add Subscription
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
