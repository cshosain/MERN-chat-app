import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { MoreHorizontal } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedConversation,
    addReaderToMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const typingRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (selectedConversation?._id) {
      getMessages(selectedConversation._id);
    }
  }, [selectedConversation?._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTyping]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const handleTyping = ({ conversationId, senderId }) => {
      if (
        conversationId === selectedConversation._id &&
        senderId !== authUser._id
      ) {
        setIsTyping(true);
      }
    };
    const handleStopTyping = ({ conversationId, senderId }) => {
      if (
        conversationId === selectedConversation._id &&
        senderId !== authUser._id
      ) {
        setIsTyping(false);
      }
    };
    socket.on("typing:conversation", handleTyping);
    socket.on("stopTyping:conversation", handleStopTyping);
    return () => {
      socket.off("typing:conversation", handleTyping);
      socket.off("stopTyping:conversation", handleStopTyping);
    };
  }, [socket, selectedConversation, authUser]);

  useEffect(() => {
    if (selectedConversation?._id) {
      getMessages(selectedConversation._id);
      axiosInstance.post(
        `/conversations/${selectedConversation._id}/mark-read`
      );
    }
  }, [getMessages, selectedConversation._id]);

  // ++ Add this new useEffect to handle read receipts ++
  useEffect(() => {
    if (!socket) return;

    const handleConversationRead = ({ conversationId, readerId }) => {
      // Check if the update is for the conversation we currently have open
      if (selectedConversation?._id === conversationId) {
        addReaderToMessages(conversationId, readerId);
      }
    };

    socket.on("conversation:read", handleConversationRead);

    return () => {
      socket.off("conversation:read", handleConversationRead);
    };
  }, [socket, selectedConversation?._id, addReaderToMessages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        Select a conversation to start chatting
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedConversation.isGroup
                      ? "/group.png"
                      : selectedConversation.participants.find(
                          (p) => p._id !== authUser._id
                        )?.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
              <span className="text-xs mt-1 opacity-60 self-end">
                {message.readBy?.length > 1 ? "✓✓ Seen" : "✓ Delivered"}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div ref={typingRef} className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img src="/avatar.png" alt="typing..." />
              </div>
            </div>
            <div className="chat-bubble flex items-center gap-2">
              <MoreHorizontal className="animate-pulse w-6 h-6 text-gray-500" />
            </div>
          </div>
        )}
      </div>
      <MessageInput />
    </div>
  );
};
export default ChatContainer;
