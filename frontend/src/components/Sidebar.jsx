import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { decryptMessage, getConversationKey } from "../lib/utils";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState({});

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  // filter if "online only" checked (works only for 1-1 convos)
  const filtered = showOnlineOnly
    ? conversations.filter((c) => {
      if (c.isGroup) return true; // groups always visible
      const other = c.participants.find((p) => p._id !== authUser._id);
      return other && onlineUsers.includes(other._id);
    })
    : conversations;

  useEffect(() => {
    let cancelled = false;

    const loadDecryptedMessages = async () => {
      const entries = await Promise.all(
        filtered.map(async (conv) => {
          const lastMsg = conv.lastMessage;
          if (!lastMsg?.text) return [conv._id, null];

          try {
            // If the message is already decrypted (plain text), JSON.parse will fail.
            // In that case we just use the text as-is.
            let parsed;
            try {
              parsed = JSON.parse(lastMsg.text);
            } catch {
              return [conv._id, lastMsg.text];
            }

            const conversationKey = await getConversationKey(conv._id);
            const decrypted = await decryptMessage(parsed, conversationKey);
            return [
              conv._id,
              typeof decrypted === "string" ? decrypted : String(decrypted),
            ];
          } catch {
            return [conv._id, "[Decryption failed] in sidebar"];
          }
        })
      );

      if (!cancelled) {
        setDecryptedMessages(Object.fromEntries(entries));
      }
    };

    loadDecryptedMessages();

    return () => {
      cancelled = true;
    };
  }, [filtered]);

  const handleSelectConversation = async (conv) => {
    try {
      let res = await getConversationKey(conv._id);
      console.log("Conversation key retrieved:", res);
      setSelectedConversation(conv);
    } catch {
      console.error("Encryption key missing for conversation:", conv._id);
      alert(
        "Encryption key for this conversation is missing. You cannot read or send messages until the key is restored."
      );
    }
  };

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 sm:w-52 md:w-72 border-r border-base-300 flex flex-col">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label
            htmlFor="showOnlineOnly"
            className="cursor-pointer flex items-center gap-2"
          >
            <input
              id="showOnlineOnly"
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({new Set(onlineUsers).size - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filtered.map((conv) => {
          const other =
            !conv.isGroup &&
            conv.participants.find((p) => p._id !== authUser._id);

          const displayName = conv.isGroup
            ? conv.groupName
            : other?.fullName || "Unknown";

          const displayPic = conv.isGroup
            ? conv.groupImage || "/group.png"
            : other?.profilePic || "/avatar.png";

          const lastMsg = conv.lastMessage;
          const unread = conv.unreadCount || 0;
          const decryptedText = decryptedMessages[conv._id];

          const lastMessagePreview = lastMsg
            ? decryptedText ?? (lastMsg.image ? "📷 Photo" : "Decrypting...")
            : "No messages yet";

          return (
            <button
              key={conv._id}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedConversation?._id === conv._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
                }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={displayPic}
                  alt={displayName}
                  className="size-12 object-cover rounded-full"
                />
                {!conv.isGroup && other && onlineUsers.includes(other._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden sm:block text-left min-w-0 flex-1">
                <div className="font-medium truncate flex justify-between">
                  <span>{displayName}</span>
                  {unread > 0 && (
                    <span className="badge badge-sm bg-red-500 text-white ml-2">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400 truncate">
                  {lastMessagePreview}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No chats yet</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
