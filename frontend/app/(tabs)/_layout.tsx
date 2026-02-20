import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";

export default function TabsLayout() {
	const insets = useSafeAreaInsets();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textSecondary,
				tabBarStyle: {
					height: 60 + insets.bottom,
					paddingBottom: Math.max(insets.bottom, 8),
					paddingTop: 8,
				},
			}}
		>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="stats-chart" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="subscriptions"
				options={{
					title: "Subscriptions",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="list" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
