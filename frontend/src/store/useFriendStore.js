// store/useFriendStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useFriendStore = create((set, get) => ({
  friends: [],
  requests: [],
  incoming: [],
  outgoing: [],
  isLoading: false,

  getFriends: async () => {
    const res = await axiosInstance.get("/friends/list");
    set({ friends: res.data });
  },

  getRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ requests: res.data });
    } catch (error) {
      console.error("Failed to fetch friend requests", error);
    } finally {
      set({ isLoading: false });
    }
  },

  getFriendRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ incoming: res.data.incoming, outgoing: res.data.outgoing });
    } catch (err) {
      console.error("Failed to fetch friend requests", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // derived count
  friendRequestCount: () => get().incoming.length, // only incoming count for badge

  sendRequest: async (userId) => {
    await axiosInstance.post(`/friends/request/${userId}`);
    // optimistically update
    set((s) => ({
      requests: [...s.requests, { to: userId, status: "pending" }],
    }));
  },

  acceptRequest: async (requestId) => {
    await axiosInstance.post(`/friends/request/${requestId}/accept`);
    set((s) => ({
      requests: s.requests.filter((r) => r._id !== requestId),
    }));
    get().getFriends();
  },

  rejectRequest: async (requestId) => {
    await axiosInstance.post(`/friends/request/${requestId}/reject`);
    set((s) => ({
      requests: s.requests.filter((r) => r._id !== requestId),
    }));
  },
}));
