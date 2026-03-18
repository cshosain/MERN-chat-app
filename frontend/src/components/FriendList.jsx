// components/FriendList.jsx
import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { getConversationKey, setConversationKey } from "../lib/utils";

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
      // E2EE: Check for key before opening
      try {
        await getConversationKey(conv._id);
        setSelectedConversation(conv);
        navigate("/");
      } catch {
        toast.error("Encryption key for this conversation is missing. You cannot read or send messages until the key is restored.");
      }
    } else {
      // Start a new conversation via API
      try {
        const res = await axiosInstance.post(
          `/conversations/start/${friend._id}`
        );
        // E2EE: Generate and store a new AES key for this conversation
        const conversationId = res.data._id;
        if (!localStorage.getItem(`convkey_${conversationId}`)) {
          const key = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
          );
          const raw = await window.crypto.subtle.exportKey("raw", key);
          const base64Key = btoa(String.fromCharCode(...new Uint8Array(raw)));
          setConversationKey(conversationId, base64Key);
        }
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
