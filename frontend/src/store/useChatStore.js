import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  latestMessages: {},

  initSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    console.log("initialSocketListener");
    if (!socket) return;

    console.log("initialSocketListernr return");
    socket?.off("newMessage"); // prevent duplicate listeners
    socket?.on("newMessage", (newMessage) => {
      console.log(newMessage);
      const currentUserId = useAuthStore.getState().authUser._id;
      const otherUserId =
        newMessage.senderId === currentUserId
          ? newMessage.receiverId
          : newMessage.senderId;

      // Always update sidebar last message
      set((state) => ({
        latestMessages: {
          ...state.latestMessages,
          [otherUserId]: newMessage,
        },
      }));

      // Only push into chat messages if currently chatting
      if (get().selectedUser?._id === otherUserId) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }
    });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const users = res.data;

      // Build initial latestMessages map
      const latestMessages = {};
      users.forEach((user) => {
        if (user.lastMessage) {
          latestMessages[user._id] = user.lastMessage;
        }
      });

      set({ users, latestMessages });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      if (res.data.length > 0) {
        set((state) => ({
          latestMessages: {
            ...state.latestMessages,
            [userId]: res.data[res.data.length - 1],
          },
        }));
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      if (
        newMessage.receiverId !== selectedUser._id &&
        newMessage.senderId !== selectedUser._id
      ) {
        // Update latestMessages for the relevant user
        set((state) => ({
          latestMessages: {
            ...state.latestMessages,
            [newMessage.senderId === useAuthStore.getState().authUser._id
              ? newMessage.receiverId
              : newMessage.senderId]: newMessage,
          },
        }));
        return;
      }
      set((state) => ({
        messages: [...state.messages, newMessage],
        latestMessages: {
          ...state.latestMessages,
          [selectedUser._id]: newMessage,
        },
      }));
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
