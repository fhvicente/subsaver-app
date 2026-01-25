import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { userAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth, updateUser, isGuest } = useAuthStore();
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localCurrency, setLocalCurrency] = useState('USD');

  useEffect(() => {
    loadLocalSettings();
  }, []);

  const loadLocalSettings = async () => {
    const currency = await AsyncStorage.getItem('local_currency');
    if (currency) {
      setLocalCurrency(currency);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setCurrencyMenuVisible(false);
    setLoading(true);

    try {
      if (isGuest) {
        await AsyncStorage.setItem('local_currency', currency);
        setLocalCurrency(currency);
      } else {
        await userAPI.updateProfile({ currency });
        if (user) {
          updateUser({ ...user, currency });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const message = isGuest 
      ? 'Exit guest mode? Your local data will remain on this device.'
      : 'Are you sure you want to logout?';
    
    Alert.alert('Logout', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isGuest ? 'Exit' : 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/welcome');
        },
      },
    ]);
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Profile
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isGuest ? 'Guest Mode' : 'Manage your account settings'}
          </Text>
        </View>

        {isGuest ? (
          <Card style={styles.guestCard}>
            <Card.Content>
              <View style={styles.guestBanner}>
                <Ionicons name="information-circle" size={32} color="#6200ee" />
                <View style={styles.guestTextContainer}>
                  <Text variant="titleMedium" style={styles.guestTitle}>
                    You're using Guest Mode
                  </Text>
                  <Text variant="bodyMedium" style={styles.guestText}>
                    Create an account to sync your data across devices and never lose your subscriptions.
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleSignUp}
                style={styles.signUpButton}
                icon="account-plus"
              >
                Create Account
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Account Information
              </Text>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <Text variant="bodyLarge" style={styles.infoText}>
                  {user?.email}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Preferences
            </Text>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Ionicons name="cash-outline" size={20} color="#666" />
                <Text variant="bodyLarge" style={styles.preferenceText}>
                  Currency
                </Text>
              </View>
              <Menu
                visible={currencyMenuVisible}
                onDismiss={() => setCurrencyMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCurrencyMenuVisible(true)}
                    disabled={loading}
                    compact
                  >
                    {isGuest ? localCurrency : (user?.currency || 'USD')}
                  </Button>
                }
              >
                {CURRENCIES.map((currency) => (
                  <Menu.Item
                    key={currency}
                    onPress={() => handleCurrencyChange(currency)}
                    title={currency}
                  />
                ))}
              </Menu>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notifications
            </Text>
            <View style={styles.notificationPlaceholder}>
              <Ionicons name="notifications-outline" size={32} color="#ccc" />
              <Text variant="bodyMedium" style={styles.placeholderText}>
                Notification settings coming soon
              </Text>
              <Text variant="bodySmall" style={styles.placeholderSubtext}>
                Email and SMS notifications will be available in a future update
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#d32f2f"
          icon="logout"
        >
          {isGuest ? 'Exit Guest Mode' : 'Logout'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  card: {
    marginBottom: 16,
  },
  guestCard: {
    marginBottom: 16,
    backgroundColor: '#f3e5f5',
  },
  guestBanner: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  guestTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  guestTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestText: {
    color: '#666',
  },
  signUpButton: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 12,
    color: '#333',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    marginLeft: 12,
    color: '#333',
  },
  notificationPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  placeholderText: {
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 4,
  },
});
