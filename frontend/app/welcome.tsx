import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../src/constants/colors";
import { useAuthStore } from "../src/store/authStore";

export default function WelcomeScreen() {
    const router = useRouter();
    const continueAsGuest = useAuthStore((state) => state.continueAsGuest);

    const handleContinueAsGuest = async () => {
        await continueAsGuest();
        router.replace("/(tabs)/dashboard");
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="flex-1 justify-center p-6">
                <View className="mb-6 items-center">
                    <Ionicons name="wallet" size={80} color={colors.primary} />
                </View>

                <Text variant="headlineLarge" style={{ fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>
                    Subscription Manager
                </Text>
                <Text
                    variant="bodyLarge"
                    style={{
                        textAlign: "center",
                        color: colors.textSecondary,
                        marginBottom: 40,
                    }}
                >
                    Track and manage all your recurring subscriptions in one place
                </Text>

                <View className="mb-10">
                    <View className="mb-4 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        <Text variant="bodyMedium" style={{ marginLeft: 12, flex: 1 }}>
                            Track monthly & annual spending
                        </Text>
                    </View>
                    <View className="mb-4 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        <Text variant="bodyMedium" style={{ marginLeft: 12, flex: 1 }}>
                            Never miss a renewal date
                        </Text>
                    </View>
                    <View className="mb-4 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        <Text variant="bodyMedium" style={{ marginLeft: 12, flex: 1 }}>
                            Organize by categories
                        </Text>
                    </View>
                </View>

                <View className="gap-3">
                    <Button
                        mode="contained"
                        onPress={handleContinueAsGuest}
                        style={{ paddingVertical: 4 }}
                        icon="arrow-right"
                    >
                        Continue as Guest
                    </Button>

                    <Button mode="outlined" onPress={() => router.push("/auth/login")} style={{ paddingVertical: 4 }}>
                        Sign In
                    </Button>

                    <Button mode="text" onPress={() => router.push("/auth/register")} style={{ paddingVertical: 4 }}>
                        Create Account
                    </Button>
                </View>

                <Text
                    variant="bodySmall"
                    style={{
                        textAlign: "center",
                        color: colors.textMuted,
                        marginTop: 16,
                    }}
                >
                    Guest mode stores data locally on your device
                </Text>
            </View>
        </SafeAreaView>
    );
}
