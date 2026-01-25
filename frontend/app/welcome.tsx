import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={80} color="#6200ee" />
        </View>
        
        <Text variant="headlineLarge" style={styles.title}>
          Subscription Manager
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Track and manage all your recurring subscriptions in one place
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={24} color="#6200ee" />
            <Text variant="bodyMedium" style={styles.featureText}>
              Track monthly & annual spending
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={24} color="#6200ee" />
            <Text variant="bodyMedium" style={styles.featureText}>
              Never miss a renewal date
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={24} color="#6200ee" />
            <Text variant="bodyMedium" style={styles.featureText}>
              Organize by categories
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinueAsGuest}
            style={styles.guestButton}
            icon="arrow-right"
          >
            Continue as Guest
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/auth/register')}
            style={styles.registerButton}
          >
            Create Account
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.guestNote}>
          Guest mode stores data locally on your device
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  guestButton: {
    paddingVertical: 4,
  },
  loginButton: {
    paddingVertical: 4,
  },
  registerButton: {
    paddingVertical: 4,
  },
  guestNote: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
});
