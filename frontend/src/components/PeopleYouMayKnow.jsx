import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { UserPlus, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";

const PeopleYouMayKnow = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedConversation } = useChatStore();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axiosInstance.get("/friends/suggestions");
        setSuggestions(res.data);
      } catch (err) {
        console.error("Failed to load suggestions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleAddFriend = async (userId) => {
    try {
      await axiosInstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleMessage = async (userId) => {
    try {
      const res = await axiosInstance.post(`/conversations/start/${userId}`);
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
        {suggestions.map((u) => (
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
                <p className="text-sm text-zinc-400">@{u.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAddFriend(u._id)}
                className="btn btn-xs btn-outline"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </button>
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

        {suggestions.length === 0 && (
          <p className="text-zinc-500 text-sm">No suggestions available</p>
        )}
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
