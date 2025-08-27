// store/useChatStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  lastSeen: new Date(),

  getConversations: async () => {
    const res = await axiosInstance.get("/conversations");
    set({ conversations: res.data });
  },

  getMessages: async (conversationId) => {
    const res = await axiosInstance.get(
      `/conversations/by-conversation/${conversationId}`
    );
    console.log(conversationId);
    set({ messages: res.data });
    // reset unread count when opening chat
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
    await axiosInstance.post(`/conversations/read/${conversationId}`);
  },

  getLastSeenByUserId: async (otherUserId) => {
    try {
      const res = await axiosInstance.get(
        `/conversations/last-seen/${otherUserId}`
      );
      set({ lastSeen: res.data.lastSeen.lastSeenAt });
    } catch (error) {
      console.log(error);
    }
  },

  sendMessage: async ({ conversationId, text, image }) => {
    try {
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
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  initSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // new message
    socket.off("message:new");
    socket.on("message:new", ({ conversationId, message }) => {
      if (get().selectedConversation?._id === conversationId) {
        set((s) => ({ messages: [...s.messages, message] }));
        axiosInstance.post(`/conversations/read/${conversationId}`);
      } else {
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

    // update conversation
    socket.off("conversation:updated");
    socket.on(
      "conversation:updated",
      ({ conversationId, lastMessage, status }) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c._id === conversationId ? { ...c, lastMessage, status } : c
          ),
        }));
      }
    );

    // 🔥 Reaction listener
    socket.off("message:reaction");
    socket.on("message:reaction", ({ messageId, by, type }) => {
      set((s) => ({
        messages: s.messages.map((msg) => {
          if (msg._id !== messageId) return msg;

          const existing = msg.reactions.find((r) => r.userId === by);

          if (!type) {
            // reaction removed
            return {
              ...msg,
              reactions: msg.reactions.filter((r) => r.userId !== by),
            };
          }

          if (existing) {
            // update reaction
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.userId === by ? { ...r, type } : r
              ),
            };
          } else {
            // add new reaction
            return {
              ...msg,
              reactions: [...msg.reactions, { userId: by, type }],
            };
          }
        }),
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
