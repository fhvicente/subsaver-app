import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
	ActivityIndicator,
	Appbar,
	Button,
	HelperText,
	Text,
	TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/constants/colors";
import { subscriptionAPI } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { useLocalSubscriptionStore } from "../../src/store/localSubscriptionStore";

export default function EditSubscriptionScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const queryClient = useQueryClient();
	const { isGuest } = useAuthStore();
	const {
		subscriptions: localSubs,
		updateSubscription: updateLocalSubscription,
		deleteSubscription: deleteLocalSubscription,
	} = useLocalSubscriptionStore();

	const [serviceName, setServiceName] = useState("");
	const [price, setPrice] = useState("");
	const [renewalDate, setRenewalDate] = useState<Date | null>(null);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [category, setCategory] = useState("");
	const [notes, setNotes] = useState("");
	const [errors, setErrors] = useState<any>({});
	const [isRenewalDatePickerVisible, setRenewalDatePickerVisibility] =
		useState(false);
	const [isStartDatePickerVisible, setStartDatePickerVisibility] =
		useState(false);
	const [submitting, setSubmitting] = useState(false);

	const { data: subscription, isLoading } = useQuery({
		queryKey: ["subscription", id],
		queryFn: async () => {
			const response = await subscriptionAPI.getById(id as string);
			return response.data;
		},
		enabled: !!id && !isGuest,
	});

	const localSubscription = isGuest
		? localSubs?.find((s) => s.id === id)
		: null;

	useEffect(() => {
		const sub = isGuest ? localSubscription : subscription;
		if (sub) {
			setServiceName(sub.service_name);
			setPrice(sub.price.toString());
			setRenewalDate(new Date(sub.renewal_date));
			setStartDate(sub.start_date ? new Date(sub.start_date) : null);
			setCategory(sub.category || "");
			setNotes(sub.notes || "");
		}
	}, [subscription, localSubscription, isGuest]);

	const updateMutation = useMutation({
		mutationFn: (data: any) => subscriptionAPI.update(id as string, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
			queryClient.invalidateQueries({ queryKey: ["analytics"] });
			queryClient.invalidateQueries({ queryKey: ["subscription", id] });
			router.back();
		},
		onError: (error: any) => {
			setErrors({
				submit: error.response?.data?.detail || "Failed to update subscription",
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => subscriptionAPI.delete(id as string),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
			queryClient.invalidateQueries({ queryKey: ["analytics"] });
			router.back();
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
		} else {
			data.category = null;
		}
		if (notes.trim()) {
			data.notes = notes.trim();
		} else {
			data.notes = null;
		}

		if (isGuest) {
			setSubmitting(true);
			try {
				await updateLocalSubscription(id as string, data);
				router.back();
			} catch (_error) {
				setErrors({ submit: "Failed to update subscription" });
			} finally {
				setSubmitting(false);
			}
		} else {
			updateMutation.mutate(data);
		}
	};

	const handleDelete = () => {
		Alert.alert(
			"Delete Subscription",
			"Are you sure you want to delete this subscription? This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						if (isGuest) {
							await deleteLocalSubscription(id as string);
							router.back();
						} else {
							deleteMutation.mutate();
						}
					},
				},
			],
		);
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

	if (isLoading && !isGuest) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	const loading = updateMutation.isPending || submitting;

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top"]}>
			<Appbar.Header>
				<Appbar.BackAction onPress={() => router.back()} />
				<Appbar.Content title="Edit Subscription" />
				<Appbar.Action icon="delete" onPress={handleDelete} />
			</Appbar.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView contentContainerStyle={{ padding: 16 }}>
					<View className="flex-1">
						<Text
							variant="bodyLarge"
							style={{ color: colors.textSecondary, marginBottom: 24 }}
						>
							Update subscription details
						</Text>

						<TextInput
							label="Service Name *"
							value={serviceName}
							onChangeText={setServiceName}
							mode="outlined"
							style={{ marginBottom: 8 }}
							error={!!errors.serviceName}
						/>
						{errors.serviceName && (
							<HelperText type="error">{errors.serviceName}</HelperText>
						)}

						<TextInput
							label="Price *"
							value={price}
							onChangeText={setPrice}
							mode="outlined"
							keyboardType="decimal-pad"
							style={{ marginBottom: 8 }}
							error={!!errors.price}
						/>
						{errors.price && (
							<HelperText type="error">{errors.price}</HelperText>
						)}

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
												<Ionicons
													name="calendar"
													size={24}
													color={colors.textSecondary}
												/>
											)}
										/>
									}
									editable={false}
								/>
							</View>
						</TouchableOpacity>
						{errors.renewalDate && (
							<HelperText type="error">{errors.renewalDate}</HelperText>
						)}

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
												<Ionicons
													name="calendar"
													size={24}
													color={colors.textSecondary}
												/>
											)}
										/>
									}
									editable={false}
								/>
							</View>
						</TouchableOpacity>
						{startDate && (
							<Button
								mode="text"
								onPress={() => setStartDate(null)}
								compact
								style={{ marginBottom: 8, alignSelf: "flex-start" }}
							>
								Clear Start Date
							</Button>
						)}

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

						{errors.submit && (
							<HelperText type="error">{errors.submit}</HelperText>
						)}

						<View className="mt-6 flex-row gap-3">
							<Button
								mode="outlined"
								onPress={() => router.back()}
								style={{ flex: 1 }}
							>
								Cancel
							</Button>
							<Button
								mode="contained"
								onPress={handleSubmit}
								loading={loading}
								disabled={loading}
								style={{ flex: 2 }}
							>
								Save Changes
							</Button>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<DateTimePickerModal
				isVisible={isRenewalDatePickerVisible}
				mode="date"
				date={renewalDate || new Date()}
				onConfirm={handleRenewalDateConfirm}
				onCancel={hideRenewalDatePicker}
				minimumDate={new Date()}
			/>

			<DateTimePickerModal
				isVisible={isStartDatePickerVisible}
				mode="date"
				date={startDate || new Date()}
				onConfirm={handleStartDateConfirm}
				onCancel={hideStartDatePicker}
				maximumDate={new Date()}
			/>
		</SafeAreaView>
	);
}
