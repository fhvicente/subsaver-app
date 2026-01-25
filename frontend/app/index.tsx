import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const router = useRouter();
  const { token, isLoading, isGuest } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (token || isGuest) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/welcome');
      }
    }
  }, [token, isLoading, isGuest]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
