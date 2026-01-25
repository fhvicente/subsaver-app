import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Appbar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { subscriptionAPI } from '../../src/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function EditSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<any>({});

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const response = await subscriptionAPI.getById(id as string);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (subscription) {
      setServiceName(subscription.service_name);
      setPrice(subscription.price.toString());
      setRenewalDate(subscription.renewal_date.split('T')[0]);
      setStartDate(subscription.start_date ? subscription.start_date.split('T')[0] : '');
      setCategory(subscription.category || '');
      setNotes(subscription.notes || '');
    }
  }, [subscription]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => subscriptionAPI.update(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      router.back();
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.detail || 'Failed to update subscription' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => subscriptionAPI.delete(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      router.back();
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

    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Subscription" />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text variant="bodyLarge" style={styles.formDescription}>
              Update subscription details
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
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                style={styles.submitButton}
              >
                Save Changes
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
