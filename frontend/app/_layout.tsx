import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setAuthToken } from "../src/services/api";
import { useAuthStore } from "../src/store/authStore";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
    const { loadAuth, token } = useAuthStore();

    useEffect(() => {
        loadAuth();
    }, []);

    useEffect(() => {
        setAuthToken(token);
    }, [token]);

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <PaperProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="welcome" />
                        <Stack.Screen name="auth/login" />
                        <Stack.Screen name="auth/register" />
                        <Stack.Screen name="(tabs)" />
                    </Stack>
                </PaperProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
