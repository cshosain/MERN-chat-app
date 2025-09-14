import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatLastSeen, formatMessageTime } from "../lib/utils";
import { MoreHorizontal, ArrowDownToLine } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { BsCheck2All } from "react-icons/bs";

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
    fetchMessages,
    hasMoreMessages,
    isMessagesLoading,
    selectedConversation,
    addReaderToMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const typingRef = useRef(null);
  const pickerRef = useRef(null);
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Reaction UI state
  const [reactionTarget, setReactionTarget] = useState(null);
  const [statusDetailsTarget, setStatusDetailsTarget] = useState(null);
  const reactions = Object.keys(EMOJI_MAP);

  // Initial load
  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation?._id, fetchMessages]);

  // Infinite scroll: fetch more when scrolled to top
  const handleScroll = async () => {
    if (!scrollRef.current || isMessagesLoading || !hasMoreMessages) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // If scrolled to top → fetch older messages
    if (scrollTop < 50 && messages.length > 0) {
      const oldestMsgId = messages[0]?._id;

      // Save current scrollHeight before fetching
      const prevHeight = scrollRef.current.scrollHeight;

      await fetchMessages(selectedConversation._id, { before: oldestMsgId });

      // After new messages prepend, restore position
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const newHeight = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = newHeight - prevHeight + scrollTop;
        }
      });
    }

    // Track if user is at bottom
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  // Auto-scroll when new messages arrive ONLY if user is at bottom
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    if (isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  // Scroll to typing indicator
  useEffect(() => {
    if (typingRef.current && isAtBottom) {
      typingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTyping, isAtBottom]);

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
      fetchMessages(selectedConversation._id);
      axiosInstance.post(`/conversations/read/${selectedConversation._id}`);
    }
  }, [fetchMessages, selectedConversation._id]);

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
    <div className="relative flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ position: "relative" }}
      >
        {isMessagesLoading && (
          <div className="absolute top-0 left-0 w-full flex justify-center">
            <MessageSkeleton />
          </div>
        )}
        {messages.map((message) => {
          const userReaction = message.reactions?.find(
            (r) => r.userId === authUser._id
          );
          const isOutgoing = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`relative chat ${
                isOutgoing ? "chat-end" : "chat-start"
              }`}
              ref={messageEndRef}
            >
              {/* Avatar */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOutgoing
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
                className="chat-bubble max-w-[50%] flex flex-col relative"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setReactionTarget(message._id);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setReactionTarget(message._id);
                }}
                onDoubleClick={() => setStatusDetailsTarget(message._id)}
                onMouseEnter={() => setStatusDetailsTarget(message._id)}
                onMouseLeave={() => setStatusDetailsTarget(null)}
              >
                {message.text && (
                  <p className="max-sm:text-sm">{message.text}</p>
                )}
                {message.image && (
                  <img
                    src={message.image}
                    alt="message attachment"
                    className="max-w-md max-md:max-w-2xs rounded-lg mt-2"
                  />
                )}

                {/* Time + Status (no time for status here) */}
                <span className="text-[10px] mt-1 opacity-60 self-end flex items-center gap-1">
                  {formatMessageTime(message.createdAt)}
                  {isOutgoing && (
                    <>
                      {" · "}
                      {(() => {
                        const otherId = selectedConversation.isGroup
                          ? null
                          : selectedConversation.participants.find(
                              (p) => p._id !== authUser._id
                            )?._id;
                        const senderSettings =
                          authUser.settings?.readReceipts !== false;
                        const otherUser =
                          selectedConversation.participants.find(
                            (p) => p._id === otherId
                          );
                        const otherSettings =
                          otherUser?.settings?.readReceipts !== false;

                        // Show "Seen" only if both allow and readBy includes otherId and readAt exists
                        if (
                          otherId &&
                          senderSettings &&
                          otherSettings &&
                          message.readBy
                            ?.map(String)
                            .includes(String(otherId)) &&
                          message.readAt
                        ) {
                          return (
                            <>
                              <span className="text-blue-500">✓✓</span> Seen
                            </>
                          );
                        }
                        // Show "Delivered" only if deliveredTo includes otherId and deliveredAt exists
                        if (
                          otherId &&
                          message.deliveredTo
                            ?.map(String)
                            .includes(String(otherId)) &&
                          message.deliveredAt
                        ) {
                          return (
                            <>
                              <span className="text-green-500">✓✓</span>{" "}
                              Delivered
                            </>
                          );
                        }
                        // Otherwise show "Sent"
                        return (
                          <>
                            <span className="text-gray-400">✓</span> Sent
                          </>
                        );
                      })()}
                    </>
                  )}
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

                {/* Status Details Popup (only on hover/double-click) */}
                {statusDetailsTarget === message._id && isOutgoing && (
                  <div className="absolute -bottom-8 right-0 bg-[#202c33] text-[#e9edef] shadow-2xl rounded-lg p-3 text-sm z-50 w-max">
                    <div className="flex flex-col gap-2">
                      {/* Read Status Row */}
                      {message.readAt && (
                        <div className="flex max-sm:flex-col justify-between items-center w-full">
                          <div className="flex items-center gap-2.5">
                            {/* Blue checkmark for 'Read' */}
                            <BsCheck2All className="text-[#53bdeb]" size={20} />
                            <span>Read</span>
                          </div>
                          <span className="text-[#8696a0] text-xs">
                            {formatLastSeen(message.readAt)}
                          </span>
                        </div>
                      )}

                      {/* Delivered Status Row */}
                      {message.deliveredAt && (
                        <div className="flex max-sm:flex-col justify-between items-center w-full">
                          <div className="flex items-center gap-2.5">
                            {/* Grey checkmark for 'Delivered' */}
                            <BsCheck2All className="text-[#8696a0]" size={20} />
                            <span>Delivered</span>
                          </div>
                          <span className="text-[#8696a0] text-xs">
                            {formatLastSeen(message.deliveredAt)}
                          </span>
                        </div>
                      )}
                    </div>
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
      {!isAtBottom && (
        <button
          className="absolute bottom-20 right-4 bg-blue-500 text-white cursor-pointer px-3 py-2 rounded-full shadow-lg"
          onClick={() => {
            // scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            // smooth scroll
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            });
            setTimeout(() => {
              setIsAtBottom(true);
            }, 1500);
          }}
        >
          {isTyping ? (
            <MoreHorizontal className="animate-pulse w-6 h-6 text-white" />
          ) : (
            <ArrowDownToLine className="w-6 h-6 text-white" />
          )}
        </button>
      )}
      <MessageInput />
    </div>
  );
};
export default ChatContainer;
