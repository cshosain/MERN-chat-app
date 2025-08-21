import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

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

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    console.log(selectedConversation);
  }, [selectedConversation]);

  // filter if "online only" checked (works only for 1-1 convos)
  const filtered = showOnlineOnly
    ? conversations.filter((c) => {
        if (c.isGroup) return true; // groups always visible
        const other = c.participants.find((p) => p._id !== authUser._id);
        return other && onlineUsers.includes(other._id);
      })
    : conversations;

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col">
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
            ({onlineUsers.length - 1} online)
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

          return (
            <button
              key={conv._id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedConversation?._id === conv._id
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

              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate flex justify-between">
                  <span>{displayName}</span>
                  {unread > 0 && (
                    <span className="badge badge-sm bg-red-500 text-white ml-2">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400 truncate">
                  {lastMsg
                    ? lastMsg.text
                      ? lastMsg.text
                      : lastMsg.image
                      ? "📷 Photo"
                      : ""
                    : "No messages yet"}
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
