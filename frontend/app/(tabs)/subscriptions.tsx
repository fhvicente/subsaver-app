import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, ActivityIndicator, FAB, Menu, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { subscriptionAPI } from '../../src/services/api';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useLocalSubscriptionStore } from '../../src/store/localSubscriptionStore';

type SortType = 'date' | 'price-asc' | 'price-desc' | 'name';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [menuVisible, setMenuVisible] = useState(false);
  const { isGuest } = useAuthStore();
  const { subscriptions: localSubs, loadSubscriptions } = useLocalSubscriptionStore();

  useEffect(() => {
    if (isGuest) {
      loadSubscriptions();
    }
  }, [isGuest]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await subscriptionAPI.getAll();
      return response.data;
    },
    enabled: !isGuest,
  });

  const localSubsWithMetrics = useMemo(() => {
    if (!isGuest || !localSubs) return [];
    
    const today = new Date();
    return localSubs.map((sub) => {
      const renewalDate = new Date(sub.renewal_date);
      const daysUntil = Math.floor((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...sub,
        monthly_cost: sub.price,
        annual_cost: sub.price * 12,
        days_until_renewal: daysUntil,
      };
    });
  }, [localSubs, isGuest]);

  const subscriptions = isGuest ? localSubsWithMetrics : (data || []);

  const sortSubscriptions = (subs: any[]) => {
    if (!subs) return [];

    const sorted = [...subs];
    switch (sortBy) {
      case 'date':
        return sorted.sort(
          (a, b) =>
            new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
        );
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) =>
          a.service_name.localeCompare(b.service_name)
        );
      default:
        return sorted;
    }
  };

  const sortedSubscriptions = sortSubscriptions(subscriptions);

  const getSortLabel = () => {
    switch (sortBy) {
      case 'date':
        return 'Renewal Date';
      case 'price-asc':
        return 'Price (Low to High)';
      case 'price-desc':
        return 'Price (High to Low)';
      case 'name':
        return 'Name (A-Z)';
    }
  };

  const handleRefresh = () => {
    if (isGuest) {
      loadSubscriptions();
    } else {
      refetch();
    }
  };

  if (isLoading && !isGuest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>
            Subscriptions
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {sortedSubscriptions.length} active
          </Text>
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              icon="sort"
              compact
            >
              {getSortLabel()}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSortBy('date');
              setMenuVisible(false);
            }}
            title="Renewal Date"
          />
          <Menu.Item
            onPress={() => {
              setSortBy('price-asc');
              setMenuVisible(false);
            }}
            title="Price (Low to High)"
          />
          <Menu.Item
            onPress={() => {
              setSortBy('price-desc');
              setMenuVisible(false);
            }}
            title="Price (High to Low)"
          />
          <Menu.Item
            onPress={() => {
              setSortBy('name');
              setMenuVisible(false);
            }}
            title="Name (A-Z)"
          />
        </Menu>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isGuest} onRefresh={handleRefresh} />
        }
      >
        {sortedSubscriptions.length === 0 ? (
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
        ) : (
          sortedSubscriptions.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscriptions/edit?id=${sub.id}`)}
            >
              <Card style={styles.subscriptionCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text variant="titleMedium" style={styles.serviceName}>
                        {sub.service_name}
                      </Text>
                      {sub.category && (
                        <Text variant="bodySmall" style={styles.category}>
                          {sub.category}
                        </Text>
                      )}
                    </View>
                    <Text variant="titleLarge" style={styles.price}>
                      ${sub.price.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text variant="bodyMedium" style={styles.detailText}>
                        Renews {format(new Date(sub.renewal_date), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text variant="bodyMedium" style={styles.detailText}>
                        {sub.days_until_renewal >= 0
                          ? `${sub.days_until_renewal} days left`
                          : 'Overdue'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.costRow}>
                    <Text variant="bodySmall" style={styles.costLabel}>
                      Monthly: ${sub.monthly_cost.toFixed(2)}
                    </Text>
                    <Text variant="bodySmall" style={styles.costLabel}>
                      Annual: ${sub.annual_cost.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  subscriptionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  price: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  costLabel: {
    color: '#666',
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
