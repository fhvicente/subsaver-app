import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Appbar, Button, HelperText, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { subscriptionAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { useLocalSubscriptionStore } from "../../src/store/localSubscriptionStore";

export default function AddSubscriptionScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isGuest } = useAuthStore();
    const { addSubscription: addLocalSubscription } = useLocalSubscriptionStore();

    const [serviceName, setServiceName] = useState("");
    const [price, setPrice] = useState("");
    const [renewalDate, setRenewalDate] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [category, setCategory] = useState("");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<any>({});
    const [isRenewalDatePickerVisible, setRenewalDatePickerVisibility] = useState(false);
    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const mutation = useMutation({
        mutationFn: (data: any) => subscriptionAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
            router.back();
        },
        onError: (error: any) => {
            setErrors({
                submit: error.response?.data?.detail || "Failed to add subscription",
            });
        },
    });

    const validateForm = () => {
        const newErrors: any = {};

        if (!serviceName.trim()) {
            newErrors.serviceName = "Service name is required";
        }

        if (!price || parseFloat(price) <= 0) {
            newErrors.price = "Price must be greater than zero";
        }

        if (!renewalDate) {
            newErrors.renewalDate = "Renewal date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !renewalDate) return;

        const data: any = {
            service_name: serviceName.trim(),
            price: parseFloat(price),
            renewal_date: renewalDate.toISOString(),
        };

        if (startDate) {
            data.start_date = startDate.toISOString();
        }
        if (category.trim()) {
            data.category = category.trim();
        }
        if (notes.trim()) {
            data.notes = notes.trim();
        }

        if (isGuest) {
            setSubmitting(true);
            try {
                await addLocalSubscription(data);
                router.back();
            } catch (error) {
                setErrors({ submit: "Failed to add subscription" });
            } finally {
                setSubmitting(false);
            }
        } else {
            mutation.mutate(data);
        }
    };

    const showRenewalDatePicker = () => {
        setRenewalDatePickerVisibility(true);
    };

    const hideRenewalDatePicker = () => {
        setRenewalDatePickerVisibility(false);
    };

    const handleRenewalDateConfirm = (date: Date) => {
        setRenewalDate(date);
        hideRenewalDatePicker();
    };

    const showStartDatePicker = () => {
        setStartDatePickerVisibility(true);
    };

    const hideStartDatePicker = () => {
        setStartDatePickerVisibility(false);
    };

    const handleStartDateConfirm = (date: Date) => {
        setStartDate(date);
        hideStartDatePicker();
    };

    const loading = mutation.isPending || submitting;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Add Subscription" />
            </Appbar.Header>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <View className="flex-1">
                        <Text variant="bodyLarge" style={{ color: colors.textSecondary, marginBottom: 24 }}>
                            Track a new recurring subscription
                        </Text>

                        <TextInput
                            label="Service Name *"
                            value={serviceName}
                            onChangeText={setServiceName}
                            mode="outlined"
                            style={{ marginBottom: 8 }}
                            error={!!errors.serviceName}
                        />
                        {errors.serviceName && <HelperText type="error">{errors.serviceName}</HelperText>}

                        <TextInput
                            label="Price *"
                            value={price}
                            onChangeText={setPrice}
                            mode="outlined"
                            keyboardType="decimal-pad"
                            style={{ marginBottom: 8 }}
                            error={!!errors.price}
                        />
                        {errors.price && <HelperText type="error">{errors.price}</HelperText>}

                        <TouchableOpacity onPress={showRenewalDatePicker}>
                            <View pointerEvents="none">
                                <TextInput
                                    label="Renewal Date *"
                                    value={renewalDate ? format(renewalDate, "MMM dd, yyyy") : ""}
                                    mode="outlined"
                                    style={{ marginBottom: 8 }}
                                    error={!!errors.renewalDate}
                                    right={
                                        <TextInput.Icon
                                            icon={() => (
                                                <Ionicons name="calendar" size={24} color={colors.textSecondary} />
                                            )}
                                        />
                                    }
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>
                        {errors.renewalDate && <HelperText type="error">{errors.renewalDate}</HelperText>}

                        <TouchableOpacity onPress={showStartDatePicker}>
                            <View pointerEvents="none">
                                <TextInput
                                    label="Start Date (Optional)"
                                    value={startDate ? format(startDate, "MMM dd, yyyy") : ""}
                                    mode="outlined"
                                    style={{ marginBottom: 8 }}
                                    right={
                                        <TextInput.Icon
                                            icon={() => (
                                                <Ionicons name="calendar" size={24} color={colors.textSecondary} />
                                            )}
                                        />
                                    }
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>

                        <TextInput
                            label="Category"
                            value={category}
                            onChangeText={setCategory}
                            mode="outlined"
                            placeholder="e.g., Streaming, Productivity"
                            style={{ marginBottom: 8 }}
                        />

                        <TextInput
                            label="Notes"
                            value={notes}
                            onChangeText={setNotes}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={{ marginBottom: 8 }}
                        />

                        {errors.submit && <HelperText type="error">{errors.submit}</HelperText>}

                        <View className="mt-6 flex-row gap-3">
                            <Button mode="outlined" onPress={() => router.back()} style={{ flex: 1 }}>
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={loading}
                                disabled={loading}
                                style={{ flex: 2 }}
                            >
                                Add Subscription
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <DateTimePickerModal
                isVisible={isRenewalDatePickerVisible}
                mode="date"
                onConfirm={handleRenewalDateConfirm}
                onCancel={hideRenewalDatePicker}
                minimumDate={new Date()}
            />

            <DateTimePickerModal
                isVisible={isStartDatePickerVisible}
                mode="date"
                onConfirm={handleStartDateConfirm}
                onCancel={hideStartDatePicker}
                maximumDate={new Date()}
            />
        </SafeAreaView>
    );
}
