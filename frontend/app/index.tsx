import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../src/constants/colors";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
	const router = useRouter();
	const { token, isLoading, isGuest } = useAuthStore();

	useEffect(() => {
		if (!isLoading) {
			if (token || isGuest) {
				router.replace("/(tabs)/dashboard");
			} else {
				router.replace("/welcome");
			}
		}
	}, [token, isLoading, isGuest, router.replace]);

	return (
		<View className="flex-1 items-center justify-center bg-white">
			<ActivityIndicator size="large" color={colors.primary} />
		</View>
	);
}
