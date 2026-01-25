import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { userAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth, updateUser } = useAuthStore();
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCurrencyChange = async (currency: string) => {
    setCurrencyMenuVisible(false);
    setLoading(true);

    try {
      await userAPI.updateProfile({ currency });
      if (user) {
        updateUser({ ...user, currency });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Profile
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage your account settings
          </Text>
        </View>

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
                    {user?.currency || 'USD'}
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
          Logout
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
