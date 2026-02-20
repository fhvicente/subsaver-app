import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { authAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function RegisterScreen() {
	const router = useRouter();
	const setAuth = useAuthStore((state) => state.setAuth);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
		if (!email || !password || !confirmPassword) {
			setError("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await authAPI.register(email, password);
			await setAuth(response.data.access_token, response.data.user);
			router.replace("/(tabs)/dashboard");
		} catch (err: any) {
			setError(
				err.response?.data?.detail || "Registration failed. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView contentContainerStyle={{ flexGrow: 1 }}>
					<View className="flex-1 justify-center p-6">
						<Text
							variant="headlineLarge"
							style={{
								fontWeight: "bold",
								marginBottom: 8,
								textAlign: "center",
							}}
						>
							Create Account
						</Text>
						<Text
							variant="bodyLarge"
							style={{
								color: colors.textSecondary,
								marginBottom: 32,
								textAlign: "center",
							}}
						>
							Start managing your subscriptions today
						</Text>

						<View className="w-full">
							<TextInput
								label="Email"
								value={email}
								onChangeText={setEmail}
								mode="outlined"
								keyboardType="email-address"
								autoCapitalize="none"
								style={{ marginBottom: 16 }}
							/>

							<TextInput
								label="Password"
								value={password}
								onChangeText={setPassword}
								mode="outlined"
								secureTextEntry
								style={{ marginBottom: 16 }}
							/>

							<TextInput
								label="Confirm Password"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								mode="outlined"
								secureTextEntry
								style={{ marginBottom: 16 }}
							/>

							{error ? (
								<HelperText type="error" visible={!!error}>
									{error}
								</HelperText>
							) : null}

							<Button
								mode="contained"
								onPress={handleRegister}
								loading={loading}
								disabled={loading}
								style={{ marginTop: 8, paddingVertical: 4 }}
							>
								Create Account
							</Button>

							<View className="mt-6 flex-row justify-center">
								<Text variant="bodyMedium">Already have an account? </Text>
								<TouchableOpacity onPress={() => router.push("/auth/login")}>
									<Text
										variant="bodyMedium"
										style={{ color: colors.primary, fontWeight: "bold" }}
									>
										Sign In
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
