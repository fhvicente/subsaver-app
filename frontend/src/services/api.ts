import axios from "axios";
import Constants from "expo-constants";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8001";

const api = axios.create({
	baseURL: `${API_URL}/api`,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
	if (token) {
		api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common["Authorization"];
	}
};

// Auth APIs
export const authAPI = {
	register: (email: string, password: string) =>
		api.post("/auth/register", { email, password }),
	login: (email: string, password: string) =>
		api.post("/auth/login", { email, password }),
};

// User APIs
export const userAPI = {
	getProfile: () => api.get("/user/profile"),
	updateProfile: (data: { currency?: string; timezone?: string }) =>
		api.put("/user/profile", data),
};

// Subscription APIs
export const subscriptionAPI = {
	getAll: () => api.get("/subscriptions"),
	getById: (id: string) => api.get(`/subscriptions/${id}`),
	create: (data: any) => api.post("/subscriptions", data),
	update: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
	delete: (id: string) => api.delete(`/subscriptions/${id}`),
	getAnalytics: () => api.get("/subscriptions/analytics/dashboard"),
};

export default api;
