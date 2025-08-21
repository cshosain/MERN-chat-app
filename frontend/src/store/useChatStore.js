// store/useChatStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],

  getConversations: async () => {
    const res = await axiosInstance.get("/conversations");
    set({ conversations: res.data });
  },

  getMessages: async (conversationId) => {
    const res = await axiosInstance.get(
      `/conversations/${conversationId}/messages`
    );
    set({ messages: res.data });
    // reset unread count when opening chat
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
    await axiosInstance.post(`/conversations/${conversationId}/mark-read`);
  },

  sendMessage: async ({ conversationId, text, image }) => {
    const res = await axiosInstance.post(`/messages/send/${conversationId}`, {
      text,
      image,
    });
    const newMsg = res.data;

    if (get().selectedConversation?._id === conversationId) {
      set((s) => ({ messages: [...s.messages, newMsg] }));
    }

    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage: newMsg } : c
      ),
    }));
  },

  initSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("message:new");
    socket.on("message:new", ({ conversationId, message }) => {
      // If conversation is open, append & mark read
      if (get().selectedConversation?._id === conversationId) {
        set((s) => ({ messages: [...s.messages, message] }));
        axiosInstance.post(`/conversations/${conversationId}/mark-read`);
      } else {
        // otherwise bump unread
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c
          ),
        }));
      }
    });

    socket.off("conversation:created");
    socket.on("conversation:created", (conv) => {
      set((s) => ({ conversations: [conv, ...s.conversations] }));
    });

    socket.off("conversation:updated");
    socket.on("conversation:updated", ({ conversationId, lastMessage }) => {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c._id === conversationId ? { ...c, lastMessage } : c
        ),
      }));
    });
  },
  // Add this function inside your create((set) => ({ ... })) block

  addReaderToMessages: (conversationId, readerId) => {
    set((state) => ({
      messages: state.messages.map((message) => {
        // Check if the message is in the correct conversation and the reader isn't already in the list
        if (
          message.conversationId === conversationId &&
          !message.readBy.includes(readerId)
        ) {
          // Return a new message object with the updated 'readBy' array
          return { ...message, readBy: [...message.readBy, readerId] };
        }
        // Otherwise, return the original message
        return message;
      }),
    }));
  },

  setSelectedConversation: (c) => set({ selectedConversation: c }),
}));
