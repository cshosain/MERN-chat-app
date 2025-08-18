import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3003";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
      get().connectSocket();
    } catch (error) {
      console.error("Error checking auth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (formData) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/register", formData);
      set({ authUser: response.data });
      toast.success("Signup successful!");
      get().connectSocket();
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (formData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout");
      set({ authUser: null });
      get().disconnectSocket();
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(error.response.data.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await axiosInstance.patch("/auth/update-profile", data);
      set({ authUser: response.data });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) {
      console.warn("User not authenticated, cannot connect socket");
      return;
    }
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ socket });
    });
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
      set({ socket: null });
    }
  },
}));
