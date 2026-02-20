import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { ActivityIndicator, Card, FAB, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { subscriptionAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { useLocalSubscriptionStore } from "../../src/store/localSubscriptionStore";

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
        queryKey: ["analytics"],
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

            const category = sub.category || "Uncategorized";
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
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
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
        <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
            <ScrollView
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 100,
                    minHeight: "100%",
                }}
                refreshControl={<RefreshControl refreshing={isRefetching && !isGuest} onRefresh={handleRefresh} />}
            >
                <View className="mb-5">
                    <Text variant="headlineMedium" style={{ fontWeight: "bold", marginBottom: 4 }}>
                        Dashboard
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                        {isGuest ? "Local Storage Mode" : "Your subscription overview"}
                    </Text>
                </View>

                <View className="mb-4 flex-row flex-wrap gap-3">
                    <Card style={{ flex: 1, minWidth: "45%" }}>
                        <Card.Content>
                            <View className="mb-2">
                                <Ionicons name="wallet" size={24} color={colors.primary} />
                            </View>
                            <Text
                                variant="headlineLarge"
                                style={{
                                    fontWeight: "bold",
                                    color: colors.primary,
                                    marginBottom: 4,
                                    fontSize: 20,
                                }}
                            >
                                ${analyticsData.monthly_spend.toFixed(2)}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                Monthly Spend
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={{ flex: 1, minWidth: "45%" }}>
                        <Card.Content>
                            <View className="mb-2">
                                <Ionicons name="calendar" size={24} color={colors.primary} />
                            </View>
                            <Text
                                variant="headlineLarge"
                                style={{
                                    fontWeight: "bold",
                                    color: colors.primary,
                                    marginBottom: 4,
                                    fontSize: 20,
                                }}
                            >
                                ${analyticsData.annual_spend.toFixed(2)}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                Annual Projected
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                <Card className="mb-4">
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                            Summary
                        </Text>
                        <View className="flex-row flex-wrap items-center justify-between">
                            <Text variant="bodyLarge">Active Subscriptions</Text>
                            <Text variant="bodyLarge" style={{ fontWeight: "bold", color: colors.primary }}>
                                {analyticsData.total_subscriptions}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {analyticsData.next_renewal && (
                    <Card style={{ marginBottom: 16, backgroundColor: colors.infoSurface }}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                                Next Renewal
                            </Text>
                            <View className="flex-row flex-wrap items-center justify-between">
                                <View style={{ flex: 1, minWidth: 150 }}>
                                    <Text variant="bodyLarge" style={{ fontWeight: "bold", marginBottom: 4 }}>
                                        {analyticsData.next_renewal.service_name}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                                        {format(new Date(analyticsData.next_renewal.renewal_date), "MMM dd, yyyy")}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text variant="headlineSmall" style={{ fontWeight: "bold", color: colors.primary }}>
                                        ${analyticsData.next_renewal.price.toFixed(2)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                                        in {analyticsData.next_renewal.days_until_renewal} days
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {Object.keys(analyticsData.category_breakdown).length > 0 && (
                    <Card className="mb-4">
                        <Card.Content>
                            <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                                Spending by Category
                            </Text>
                            {Object.entries(analyticsData.category_breakdown).map(
                                ([category, amount]: [string, any]) => (
                                    <View
                                        key={category}
                                        className="flex-row flex-wrap items-center justify-between py-2"
                                    >
                                        <Text variant="bodyLarge">{category}</Text>
                                        <Text variant="bodyLarge" style={{ fontWeight: "bold", color: colors.primary }}>
                                            ${amount.toFixed(2)}/mo
                                        </Text>
                                    </View>
                                ),
                            )}
                        </Card.Content>
                    </Card>
                )}

                {analyticsData.total_subscriptions === 0 && (
                    <Card style={{ marginTop: 20, minHeight: 200 }}>
                        <Card.Content>
                            <View className="items-center px-4 py-8">
                                <Ionicons name="add-circle-outline" size={64} color={colors.iconMuted} />
                                <Text
                                    variant="titleMedium"
                                    style={{ fontWeight: "bold", marginTop: 16, marginBottom: 8 }}
                                >
                                    No Subscriptions Yet
                                </Text>
                                <Text
                                    variant="bodyMedium"
                                    style={{
                                        color: colors.textSecondary,
                                        textAlign: "center",
                                        paddingHorizontal: 16,
                                    }}
                                >
                                    Start tracking your subscriptions by tapping the + button below
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 80,
                    backgroundColor: colors.primary,
                }}
                onPress={() => router.push("/subscriptions/add")}
            />
        </SafeAreaView>
    );
}
