import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { subscriptionAPI } from '../../src/services/api';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await subscriptionAPI.getAnalytics();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const analytics = data || {
    total_subscriptions: 0,
    monthly_spend: 0,
    annual_spend: 0,
    next_renewal: null,
    category_breakdown: {},
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Dashboard
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Your subscription overview
          </Text>
        </View>

        <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <Card.Content>
              <View style={styles.metricIconRow}>
                <Ionicons name="wallet" size={24} color="#6200ee" />
              </View>
              <Text variant="headlineLarge" style={styles.metricValue}>
                ${analytics.monthly_spend.toFixed(2)}
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Monthly Spend
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content>
              <View style={styles.metricIconRow}>
                <Ionicons name="calendar" size={24} color="#6200ee" />
              </View>
              <Text variant="headlineLarge" style={styles.metricValue}>
                ${analytics.annual_spend.toFixed(2)}
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Annual Projected
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text variant="bodyLarge">Active Subscriptions</Text>
              <Text variant="bodyLarge" style={styles.summaryValue}>
                {analytics.total_subscriptions}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {analytics.next_renewal && (
          <Card style={styles.renewalCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Next Renewal
              </Text>
              <View style={styles.renewalContent}>
                <View style={styles.renewalInfo}>
                  <Text variant="bodyLarge" style={styles.serviceName}>
                    {analytics.next_renewal.service_name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.renewalDate}>
                    {format(new Date(analytics.next_renewal.renewal_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.renewalPrice}>
                  <Text variant="headlineSmall" style={styles.price}>
                    ${analytics.next_renewal.price.toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.daysUntil}>
                    in {analytics.next_renewal.days_until_renewal} days
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {Object.keys(analytics.category_breakdown).length > 0 && (
          <Card style={styles.categoryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Spending by Category
              </Text>
              {Object.entries(analytics.category_breakdown).map(([category, amount]: [string, any]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text variant="bodyLarge">{category}</Text>
                  <Text variant="bodyLarge" style={styles.categoryAmount}>
                    ${amount.toFixed(2)}/mo
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {analytics.total_subscriptions === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContent}>
                <Ionicons name="add-circle-outline" size={64} color="#ccc" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No Subscriptions Yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Start tracking your subscriptions by tapping the + button below
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/subscriptions/add')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
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
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
  },
  metricIconRow: {
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#666',
  },
  summaryCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  renewalCard: {
    marginBottom: 16,
    backgroundColor: '#f3e5f5',
  },
  renewalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  renewalInfo: {
    flex: 1,
  },
  serviceName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  renewalDate: {
    color: '#666',
  },
  renewalPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  daysUntil: {
    color: '#666',
  },
  categoryCard: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryAmount: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
