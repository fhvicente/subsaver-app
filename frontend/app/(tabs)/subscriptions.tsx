import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import {
	ActivityIndicator,
	Button,
	Card,
	FAB,
	Menu,
	Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { subscriptionAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { useLocalSubscriptionStore } from "../../src/store/localSubscriptionStore";

type SortType = "date" | "price-asc" | "price-desc" | "name";

export default function SubscriptionsScreen() {
	const router = useRouter();
	const tabBarHeight = useBottomTabBarHeight();
	const [sortBy, setSortBy] = useState<SortType>("date");
	const [menuVisible, setMenuVisible] = useState(false);
	const { isGuest } = useAuthStore();
	const { subscriptions: localSubs, loadSubscriptions } =
		useLocalSubscriptionStore();

	useEffect(() => {
		if (isGuest) {
			loadSubscriptions();
		}
	}, [isGuest, loadSubscriptions]);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["subscriptions"],
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
			const daysUntil = Math.floor(
				(renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
			);

			return {
				...sub,
				monthly_cost: sub.price,
				annual_cost: sub.price * 12,
				days_until_renewal: daysUntil,
			};
		});
	}, [localSubs, isGuest]);

	const subscriptions = isGuest ? localSubsWithMetrics : data || [];

	const sortSubscriptions = (subs: any[]) => {
		if (!subs) return [];

		const sorted = [...subs];
		switch (sortBy) {
			case "date":
				return sorted.sort(
					(a, b) =>
						new Date(a.renewal_date).getTime() -
						new Date(b.renewal_date).getTime(),
				);
			case "price-asc":
				return sorted.sort((a, b) => a.price - b.price);
			case "price-desc":
				return sorted.sort((a, b) => b.price - a.price);
			case "name":
				return sorted.sort((a, b) =>
					a.service_name.localeCompare(b.service_name),
				);
			default:
				return sorted;
		}
	};

	const sortedSubscriptions = sortSubscriptions(subscriptions);

	const getSortLabel = () => {
		switch (sortBy) {
			case "date":
				return "Renewal Date";
			case "price-asc":
				return "Price (Low to High)";
			case "price-desc":
				return "Price (High to Low)";
			case "name":
				return "Name (A-Z)";
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
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
			<View className="flex-row items-center justify-between border-b border-neutral-200 bg-white p-4">
				<View>
					<Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
						Subscriptions
					</Text>
					<Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
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
							setSortBy("date");
							setMenuVisible(false);
						}}
						title="Renewal Date"
					/>
					<Menu.Item
						onPress={() => {
							setSortBy("price-asc");
							setMenuVisible(false);
						}}
						title="Price (Low to High)"
					/>
					<Menu.Item
						onPress={() => {
							setSortBy("price-desc");
							setMenuVisible(false);
						}}
						title="Price (High to Low)"
					/>
					<Menu.Item
						onPress={() => {
							setSortBy("name");
							setMenuVisible(false);
						}}
						title="Name (A-Z)"
					/>
				</Menu>
			</View>

			<ScrollView
				contentContainerStyle={{
					padding: 16,
					paddingBottom: tabBarHeight + 24,
				}}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching && !isGuest}
						onRefresh={handleRefresh}
					/>
				}
			>
				{sortedSubscriptions.length === 0 ? (
					<Card style={{ marginTop: 32 }}>
						<Card.Content>
							<View className="items-center py-8">
								<Ionicons
									name="add-circle-outline"
									size={64}
									color={colors.iconMuted}
								/>
								<Text
									variant="titleMedium"
									style={{ fontWeight: "bold", marginTop: 16, marginBottom: 8 }}
								>
									No Subscriptions Yet
								</Text>
								<Text
									variant="bodyMedium"
									style={{ color: colors.textSecondary, textAlign: "center" }}
								>
									Start tracking your subscriptions by tapping the + button
									below
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
							<Card className="mb-3">
								<Card.Content>
									<View className="mb-3 flex-row items-start justify-between">
										<View className="flex-1">
											<Text
												variant="titleMedium"
												style={{ fontWeight: "bold", marginBottom: 4 }}
											>
												{sub.service_name}
											</Text>
											{sub.category && (
												<Text
													variant="bodySmall"
													style={{
														color: colors.textSecondary,
														backgroundColor: colors.surfaceMuted,
														paddingHorizontal: 8,
														paddingVertical: 2,
														borderRadius: 4,
														alignSelf: "flex-start",
													}}
												>
													{sub.category}
												</Text>
											)}
										</View>
										<Text
											variant="titleLarge"
											style={{ fontWeight: "bold", color: colors.primary }}
										>
											${sub.price.toFixed(2)}
										</Text>
									</View>

									<View className="mb-3">
										<View className="mb-1 flex-row items-center">
											<Ionicons
												name="calendar-outline"
												size={16}
												color={colors.textSecondary}
											/>
											<Text
												variant="bodyMedium"
												style={{ marginLeft: 8, color: colors.textSecondary }}
											>
												Renews{" "}
												{format(new Date(sub.renewal_date), "MMM dd, yyyy")}
											</Text>
										</View>
										<View className="mb-1 flex-row items-center">
											<Ionicons
												name="time-outline"
												size={16}
												color={colors.textSecondary}
											/>
											<Text
												variant="bodyMedium"
												style={{ marginLeft: 8, color: colors.textSecondary }}
											>
												{sub.days_until_renewal >= 0
													? `${sub.days_until_renewal} days left`
													: "Overdue"}
											</Text>
										</View>
									</View>

									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											paddingTop: 8,
											borderTopWidth: 1,
											borderTopColor: colors.border,
										}}
									>
										<Text
											variant="bodySmall"
											style={{ color: colors.textSecondary }}
										>
											Monthly: ${sub.monthly_cost.toFixed(2)}
										</Text>
										<Text
											variant="bodySmall"
											style={{ color: colors.textSecondary }}
										>
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
				style={{
					position: "absolute",
					right: 16,
					bottom: tabBarHeight + 16,
					backgroundColor: colors.primary,
				}}
				onPress={() => router.push("/subscriptions/add")}
			/>
		</SafeAreaView>
	);
}
