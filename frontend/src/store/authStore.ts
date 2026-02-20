import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface User {
	id: string;
	email: string;
	currency: string;
	timezone: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isGuest: boolean;
	setAuth: (token: string, user: User) => Promise<void>;
	clearAuth: () => Promise<void>;
	loadAuth: () => Promise<void>;
	updateUser: (user: User) => void;
	continueAsGuest: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isLoading: true,
	isGuest: false,

	setAuth: async (token: string, user: User) => {
		await AsyncStorage.setItem("auth_token", token);
		await AsyncStorage.setItem("user_data", JSON.stringify(user));
		await AsyncStorage.setItem("is_guest", "false");
		set({ token, user, isLoading: false, isGuest: false });
	},

	clearAuth: async () => {
		await AsyncStorage.removeItem("auth_token");
		await AsyncStorage.removeItem("user_data");
		await AsyncStorage.removeItem("is_guest");
		set({ token: null, user: null, isLoading: false, isGuest: false });
	},

	loadAuth: async () => {
		try {
			const token = await AsyncStorage.getItem("auth_token");
			const userData = await AsyncStorage.getItem("user_data");
			const guestMode = await AsyncStorage.getItem("is_guest");

			if (token && userData) {
				set({
					token,
					user: JSON.parse(userData),
					isLoading: false,
					isGuest: false,
				});
			} else if (guestMode === "true") {
				set({ isLoading: false, isGuest: true });
			} else {
				set({ isLoading: false });
			}
		} catch (error) {
			console.error("Error loading auth:", error);
			set({ isLoading: false });
		}
	},

	updateUser: (user: User) => {
		AsyncStorage.setItem("user_data", JSON.stringify(user));
		set({ user });
	},

	continueAsGuest: async () => {
		await AsyncStorage.setItem("is_guest", "true");
		set({ isGuest: true, isLoading: false });
	},
}));
