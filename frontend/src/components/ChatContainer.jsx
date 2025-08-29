import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { MoreHorizontal } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const EMOJI_MAP = {
  "👍": "like",
  "❤️": "love",
  "😂": "haha",
  "😮": "wow",
  "😢": "sad",
  "😡": "angry",
};
const TYPE_TO_EMOJI = Object.fromEntries(
  Object.entries(EMOJI_MAP).map(([emoji, type]) => [type, emoji])
);

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
  const pickerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Reaction UI state
  const [reactionTarget, setReactionTarget] = useState(null);
  const reactions = Object.keys(EMOJI_MAP);

  // Load messages
  useEffect(() => {
    console.log("load msg");
    if (selectedConversation?._id) {
      getMessages(selectedConversation._id);
    }
  }, [selectedConversation?._id, getMessages]);

  // Scroll bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to typing indicator
  useEffect(() => {
    if (typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTyping]);

  // Typing indicator
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const handleTyping = ({ conversationId, senderId }) => {
      if (
        conversationId === selectedConversation._id &&
        senderId !== authUser._id
      )
        setIsTyping(true);
    };
    const handleStopTyping = ({ conversationId, senderId }) => {
      if (
        conversationId === selectedConversation._id &&
        senderId !== authUser._id
      )
        setIsTyping(false);
    };
    if (useAuthStore.getState().authUser.settings.typingIndicators) {
      socket.on("typing:conversation", handleTyping);
      socket.on("stopTyping:conversation", handleStopTyping);
    }
    return () => {
      socket.off("typing:conversation", handleTyping);
      socket.off("stopTyping:conversation", handleStopTyping);
    };
  }, [socket, selectedConversation, authUser]);

  // Mark messages as read
  useEffect(() => {
    if (selectedConversation?._id) {
      getMessages(selectedConversation._id);
      axiosInstance.post(`/conversations/read/${selectedConversation._id}`);
    }
  }, [getMessages, selectedConversation?._id]);

  // Read receipts
  useEffect(() => {
    if (!socket) return;
    const handleConversationRead = ({ conversationId, readerId }) => {
      if (selectedConversation?._id === conversationId) {
        addReaderToMessages(conversationId, readerId);
      }
    };
    socket.on("message:read", handleConversationRead);
    return () => socket.off("message:read", handleConversationRead);
  }, [socket, selectedConversation?._id, addReaderToMessages, messages]);

  // Reaction picker outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setReactionTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // React to message
  const handleReaction = async (messageId, emoji) => {
    const type = EMOJI_MAP[emoji];
    try {
      await axiosInstance.post(`/messages/react/${messageId}`, { type });

      // 🔥 update local state instantly
      useChatStore.setState((s) => ({
        messages: s.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                reactions: [
                  ...msg.reactions.filter((r) => r.userId !== authUser._id),
                  { userId: authUser._id, type },
                ],
              }
            : msg
        ),
      }));
      setReactionTarget(null);
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

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
        {messages.map((message) => {
          const userReaction = message.reactions?.find(
            (r) => r.userId === authUser._id
          );
          return (
            <div
              key={message._id}
              className={`relative chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
              ref={messageEndRef}
            >
              {/* Avatar */}
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

              {/* Bubble */}
              <div
                className="chat-bubble flex flex-col relative"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setReactionTarget(message._id);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setReactionTarget(message._id);
                }}
              >
                {message.text && <p>{message.text}</p>}

                {/* Time + Read Receipt */}
                <span className="text-[10px] mt-1 opacity-60 self-end">
                  {formatMessageTime(message.createdAt)} ·{" "}
                  {message.senderId === authUser._id
                    ? (() => {
                        // determine other user id for 1-1
                        const otherId = selectedConversation.isGroup
                          ? null
                          : selectedConversation.participants.find(
                              (p) => p._id !== authUser._id
                            )?._id;

                        if (
                          otherId &&
                          message.readBy?.map(String).includes(String(otherId))
                        ) {
                          return "✓✓ Seen";
                        }
                        if (
                          otherId &&
                          message.deliveredTo
                            ?.map(String)
                            .includes(String(otherId))
                        ) {
                          return "✓✓ Delivered";
                        }
                        return "✓ Sent";
                      })()
                    : ""}
                </span>

                {/* Show reactions below bubble */}
                {message.reactions?.length > 0 && (
                  <div className="flex mt-1 space-x-1 self-start">
                    {message.reactions.map((r, i) => (
                      <span key={i} className="text-sm">
                        {TYPE_TO_EMOJI[r.type]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reaction Picker */}
                {reactionTarget === message._id && (
                  <div
                    ref={pickerRef}
                    className="absolute -top-10 left-0 bg-white shadow-md rounded-full px-2 py-1 flex space-x-2 z-50"
                  >
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message._id, emoji)}
                        className={`hover:scale-110 transition ${
                          userReaction &&
                          EMOJI_MAP[emoji] === userReaction.type &&
                          "ring-2 ring-blue-500 rounded-full"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
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
