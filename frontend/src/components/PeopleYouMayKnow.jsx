import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { UserPlus, MessageSquare, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import { setConversationKey } from "../lib/utils";

const PeopleYouMayKnow = ({ excludeIds }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedConversation } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axiosInstance.get("/friends/suggestions");
        // add a local status for UI (default: "none")
        const withStatus = res.data.map((u) => ({
          ...u,
          friendshipStatus: "none",
        }));
        setSuggestions(withStatus);
      } catch (err) {
        console.error("Failed to load suggestions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const filteredSuggestions = suggestions.filter(
    (person) => !excludeIds.includes(person._id)
  );

  const handleAddFriend = async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      toast.success(res.data.message);

      setSuggestions((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, friendshipStatus: res.data.friendshipStatus }
            : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleMessage = async (userId) => {
    try {
      const res = await axiosInstance.post(`/conversations/start/${userId}`);
      // E2EE: Generate and store a new AES key for this conversation if not present
      const conversationId = res.data._id;
      if (!localStorage.getItem(`convkey_${conversationId}`)) {
        // Generate a 256-bit AES key
        const key = await window.crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        // Export and encode as base64
        const raw = await window.crypto.subtle.exportKey("raw", key);
        const base64Key = btoa(String.fromCharCode(...new Uint8Array(raw)));
        setConversationKey(conversationId, base64Key);
      }
      navigate("/");
      setSelectedConversation(res.data);
      toast.success(
        res.data.isRequest ? "Message request created" : "Conversation started"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  if (loading) return <p className="text-zinc-500">Loading suggestions...</p>;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">People you may know</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredSuggestions.map((u) => (
          <div
            key={u._id}
            className="border border-base-300 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img
                src={u.profilePic || "/avatar.png"}
                alt={u.fullName}
                className="size-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{u.fullName}</p>
                <p className="text-sm text-zinc-400">
                  @{u.username || "username"}
                </p>
              </div>
            </div>

            <div className="flex md:flex-row sm:flex-col gap-2">
              {u.friendshipStatus === "none" && (
                <button
                  onClick={() => handleAddFriend(u._id)}
                  className="btn btn-xs btn-outline"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
                </button>
              )}

              {u.friendshipStatus === "outgoing" && (
                <button className="btn btn-xs btn-disabled">
                  <Clock className="w-4 h-4 mr-1" />
                  Requested
                </button>
              )}

              {u.friendshipStatus === "friends" && (
                <button className="btn btn-xs btn-success">
                  <Check className="w-4 h-4 mr-1" />
                  Friends
                </button>
              )}

              <button
                onClick={() => handleMessage(u._id)}
                className="btn btn-xs btn-primary"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </button>
            </div>
          </div>
        ))}

        {filteredSuggestions.length === 0 && (
          <p className="text-zinc-500 text-sm">No suggestions available</p>
        )}
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
