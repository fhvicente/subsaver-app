import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Menu, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { userAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR"];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, clearAuth, updateUser, isGuest } = useAuthStore();
    const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localCurrency, setLocalCurrency] = useState("USD");

    useEffect(() => {
        loadLocalSettings();
    }, []);

    const loadLocalSettings = async () => {
        const currency = await AsyncStorage.getItem("local_currency");
        if (currency) {
            setLocalCurrency(currency);
        }
    };

    const handleCurrencyChange = async (currency: string) => {
        setCurrencyMenuVisible(false);
        setLoading(true);

        try {
            if (isGuest) {
                await AsyncStorage.setItem("local_currency", currency);
                setLocalCurrency(currency);
            } else {
                await userAPI.updateProfile({ currency });
                if (user) {
                    updateUser({ ...user, currency });
                }
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update currency");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        const message = isGuest
            ? "Exit guest mode? Your local data will remain on this device."
            : "Are you sure you want to logout?";

        Alert.alert("Logout", message, [
            { text: "Cancel", style: "cancel" },
            {
                text: isGuest ? "Exit" : "Logout",
                style: "destructive",
                onPress: async () => {
                    await clearAuth();
                    router.replace("/welcome");
                },
            },
        ]);
    };

    const handleSignUp = () => {
        router.push("/auth/register");
    };

    return (
        <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-6">
                    <Text variant="headlineMedium" style={{ fontWeight: "bold", marginBottom: 4 }}>
                        Profile
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                        {isGuest ? "Guest Mode" : "Manage your account settings"}
                    </Text>
                </View>

                {isGuest ? (
                    <Card style={{ marginBottom: 16, backgroundColor: colors.infoSurface }}>
                        <Card.Content>
                            <View className="mb-4 flex-row">
                                <Ionicons name="information-circle" size={32} color={colors.primary} />
                                <View className="ml-3 flex-1">
                                    <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 8 }}>
                                        You're using Guest Mode
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                                        Create an account to sync your data across devices and never lose your
                                        subscriptions.
                                    </Text>
                                </View>
                            </View>
                            <Button
                                mode="contained"
                                onPress={handleSignUp}
                                style={{ paddingVertical: 4 }}
                                icon="account-plus"
                            >
                                Create Account
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card className="mb-4">
                        <Card.Content>
                            <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                                Account Information
                            </Text>
                            <View className="flex-row items-center py-2">
                                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                                <Text variant="bodyLarge" style={{ marginLeft: 12, color: colors.textPrimary }}>
                                    {user?.email}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                <Card className="mb-4">
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                            Preferences
                        </Text>

                        <View className="flex-row items-center justify-between py-2">
                            <View className="flex-row items-center">
                                <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
                                <Text variant="bodyLarge" style={{ marginLeft: 12, color: colors.textPrimary }}>
                                    Currency
                                </Text>
                            </View>
                            <Menu
                                visible={currencyMenuVisible}
                                onDismiss={() => setCurrencyMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setCurrencyMenuVisible(true)}
                                        disabled={loading}
                                        compact
                                    >
                                        {isGuest ? localCurrency : user?.currency || "USD"}
                                    </Button>
                                }
                            >
                                {CURRENCIES.map((currency) => (
                                    <Menu.Item
                                        key={currency}
                                        onPress={() => handleCurrencyChange(currency)}
                                        title={currency}
                                    />
                                ))}
                            </Menu>
                        </View>
                    </Card.Content>
                </Card>

                <Card className="mb-4">
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 16 }}>
                            Notifications
                        </Text>
                        <View className="items-center py-6">
                            <Ionicons name="notifications-outline" size={32} color={colors.iconMuted} />
                            <Text
                                variant="bodyMedium"
                                style={{
                                    color: colors.textSecondary,
                                    marginTop: 12,
                                    textAlign: "center",
                                }}
                            >
                                Notification settings coming soon
                            </Text>
                            <Text
                                variant="bodySmall"
                                style={{
                                    color: colors.textMuted,
                                    marginTop: 4,
                                    textAlign: "center",
                                }}
                            >
                                Email and SMS notifications will be available in a future update
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={{ marginTop: 16, paddingVertical: 4 }}
                    buttonColor={colors.danger}
                    icon="logout"
                >
                    {isGuest ? "Exit Guest Mode" : "Logout"}
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}
