import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatLastSeen } from "../lib/utils";
import { useEffect } from "react";

const ChatHeader = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const {
    selectedConversation,
    setSelectedConversation,
    lastSeen,
    getLastSeenByUserId,
  } = useChatStore();
  // For 1-1 chats, find the other participant
  console.log("authUser:", authUser);
  const otherUser = !selectedConversation.isGroup
    ? selectedConversation.participants.find((p) => p._id !== authUser._id)
    : null;

  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
  console.log("otherUser:", otherUser);

  useEffect(() => {
    if (
      authUser &&
      authUser?.settings?.lastSeenVisible &&
      otherUser &&
      otherUser?.settings?.lastSeenVisible
    ) {
      console.log("Fetching last seen for user:", otherUser?._id);
      getLastSeenByUserId(otherUser?._id);
    }
  }, [otherUser?._id, getLastSeenByUserId, authUser, otherUser]);

  if (!selectedConversation) return null;
  const formattedLastSeen =
    authUser &&
    authUser?.settings?.lastSeenVisible &&
    otherUser &&
    otherUser?.settings?.lastSeenVisible
      ? formatLastSeen(lastSeen)
      : "Last seen is hidden";

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={
                  selectedConversation.isGroup
                    ? "/group.png"
                    : otherUser?.profilePic || "/avatar.png"
                }
                alt={
                  selectedConversation.isGroup
                    ? "Group"
                    : otherUser?.fullName || "User"
                }
              />
              {!selectedConversation.isGroup && isOnline && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>
          </div>

          {/* Conversation info */}
          <div>
            <h3 className="font-medium">
              {selectedConversation.isGroup
                ? selectedConversation.name || "Group Chat"
                : otherUser?.fullName}
            </h3>
            <p className="text-sm text-base-content/70">
              {selectedConversation.isGroup
                ? `${selectedConversation.participants.length} members`
                : isOnline
                ? "Online"
                : formattedLastSeen}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setSelectedConversation(null)}
          className="hover:text-red-500 transition"
        >
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
