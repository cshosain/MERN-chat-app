// components/FriendList.jsx
import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const FriendList = () => {
  const { friends, getFriends } = useFriendStore();
  const { conversations, setSelectedConversation } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const handleOpenChat = async (friend) => {
    // Try to find an existing 1-1 conversation
    const conv = conversations.find(
      (c) => !c.isGroup && c.participants.some((p) => p._id === friend._id)
    );
    if (conv) {
      setSelectedConversation(conv);
      navigate("/");
    } else {
      // Start a new conversation via API
      try {
        const res = await axiosInstance.post(
          `/conversations/start/${friend._id}`
        );
        setSelectedConversation(res.data);
        navigate("/");
        toast.success("Conversation started");
      } catch (err) {
        toast.error("Failed to start conversation");
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Friends</h2>
      {friends.length === 0 && (
        <p className="text-sm text-zinc-500">No friends yet</p>
      )}
      <ul className="space-y-2">
        {friends.map((f) => (
          <li key={f._id} className="flex items-center gap-3">
            <img
              src={f.profilePic}
              alt=""
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={() => handleOpenChat(f)}
            />
            <span className="cursor-pointer" onClick={() => handleOpenChat(f)}>
              {f.fullName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendList;
