import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { authAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function LoginScreen() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await authAPI.login(email, password);
            await setAuth(response.data.access_token, response.data.user);
            router.replace("/(tabs)/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
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
                            Welcome Back
                        </Text>
                        <Text
                            variant="bodyLarge"
                            style={{
                                color: colors.textSecondary,
                                marginBottom: 32,
                                textAlign: "center",
                            }}
                        >
                            Sign in to manage your subscriptions
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

                            {error ? (
                                <HelperText type="error" visible={!!error}>
                                    {error}
                                </HelperText>
                            ) : null}

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={{ marginTop: 8, paddingVertical: 4 }}
                            >
                                Sign In
                            </Button>

                            <View className="mt-6 flex-row justify-center">
                                <Text variant="bodyMedium">Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push("/auth/register")}>
                                    <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: "bold" }}>
                                        Sign Up
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
