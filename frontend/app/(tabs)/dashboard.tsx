import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, useWindowDimensions } from 'react-native';
import { Text, Card, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { subscriptionAPI } from '../../src/services/api';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useLocalSubscriptionStore } from '../../src/store/localSubscriptionStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { isGuest } = useAuthStore();
  const { subscriptions: localSubs, loadSubscriptions } = useLocalSubscriptionStore();

  useEffect(() => {
    if (isGuest) {
      loadSubscriptions();
    }
  }, [isGuest]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await subscriptionAPI.getAnalytics();
      return response.data;
    },
    enabled: !isGuest,
  });

  const localAnalytics = useMemo(() => {
    if (!isGuest || !localSubs) return null;

    const today = new Date();
    let monthlySpend = 0;
    let nextRenewal = null;
    let minDays = Infinity;
    const categoryBreakdown: Record<string, number> = {};

    localSubs.forEach((sub) => {
      const renewalDate = new Date(sub.renewal_date);
      const daysUntil = Math.floor((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      monthlySpend += sub.price;
      
      const category = sub.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + sub.price;
      
      if (daysUntil >= 0 && daysUntil < minDays) {
        minDays = daysUntil;
        nextRenewal = { ...sub, days_until_renewal: daysUntil };
      }
    });

    return {
      total_subscriptions: localSubs.length,
      monthly_spend: monthlySpend,
      annual_spend: monthlySpend * 12,
      next_renewal: nextRenewal,
      category_breakdown: categoryBreakdown,
    };
  }, [localSubs, isGuest]);

  const analytics = isGuest ? localAnalytics : data;

  if (isLoading && !isGuest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const analyticsData = analytics || {
    total_subscriptions: 0,
    monthly_spend: 0,
    annual_spend: 0,
    next_renewal: null,
    category_breakdown: {},
  };

  const handleRefresh = () => {
    if (isGuest) {
      loadSubscriptions();
    } else {
      refetch();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isGuest} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Dashboard
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isGuest ? 'Local Storage Mode' : 'Your subscription overview'}
          </Text>
        </View>

        <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <Card.Content>
              <View style={styles.metricIconRow}>
                <Ionicons name="wallet" size={24} color="#6200ee" />
              </View>
              <Text variant="headlineLarge" style={styles.metricValue}>
                ${analyticsData.monthly_spend.toFixed(2)}
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
                ${analyticsData.annual_spend.toFixed(2)}
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
                {analyticsData.total_subscriptions}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {analyticsData.next_renewal && (
          <Card style={styles.renewalCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Next Renewal
              </Text>
              <View style={styles.renewalContent}>
                <View style={styles.renewalInfo}>
                  <Text variant="bodyLarge" style={styles.serviceName}>
                    {analyticsData.next_renewal.service_name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.renewalDate}>
                    {format(new Date(analyticsData.next_renewal.renewal_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.renewalPrice}>
                  <Text variant="headlineSmall" style={styles.price}>
                    ${analyticsData.next_renewal.price.toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.daysUntil}>
                    in {analyticsData.next_renewal.days_until_renewal} days
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {Object.keys(analyticsData.category_breakdown).length > 0 && (
          <Card style={styles.categoryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Spending by Category
              </Text>
              {Object.entries(analyticsData.category_breakdown).map(([category, amount]: [string, any]) => (
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

        {analyticsData.total_subscriptions === 0 && (
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
    paddingBottom: 100, // Increased for FAB space
    minHeight: '100%', // Ensure full height on all devices
  },
  header: {
    marginBottom: 20,
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
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  metricCard: {
    flex: 1,
    minWidth: '45%', // Responsive minimum width
  },
  metricIconRow: {
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
    fontSize: 20, // Responsive font size
  },
  metricLabel: {
    color: '#666',
    fontSize: 12,
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
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
  },
  renewalInfo: {
    flex: 1,
    minWidth: 150, // Prevent text from being too squished
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
    flexWrap: 'wrap',
  },
  categoryAmount: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emptyCard: {
    marginTop: 20,
    minHeight: 200, // Ensure visible on all screens
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80, // Higher position to avoid tab bar
    backgroundColor: '#6200ee',
  },
});
