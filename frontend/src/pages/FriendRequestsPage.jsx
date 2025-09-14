import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import PeopleYouMayKnow from "../components/PeopleYouMayKnow";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";

const FriendRequestsPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmUser, setConfirmUser] = useState(null);
  const navigate = useNavigate();
  const { setSelectedConversation } = useChatStore();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axiosInstance.get("/friends/requests");
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      } catch (err) {
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const excludeIds = [
    ...incoming.map((r) => r.requester._id),
    ...outgoing.map((r) => r.recipient._id),
  ];

  const handleCancel = async (id) => {
    try {
      await axiosInstance.delete(`/friends/cancel/${id}`);
      setOutgoing((reqs) => reqs.filter((r) => r._id !== id));
      toast.success("Friend request cancelled");
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  const handleAccept = async (id) => {
    try {
      await axiosInstance.post(`/friends/respond/${id}`, { action: "accept" });
      setIncoming((reqs) => reqs.filter((r) => r._id !== id));
      toast.success("Friend request accepted!");
    } catch (err) {
      toast.error("Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.post(`/friends/respond/${id}`, { action: "reject" });
      setIncoming((reqs) => reqs.filter((r) => r._id !== id));
      toast.success("Friend request rejected");
    } catch (err) {
      toast.error("Failed to reject");
    }
  };

  const handleProfileClick = (user) => {
    setConfirmUser(user);
  };

  const handleStartConversation = async () => {
    try {
      const res = await axiosInstance.post(
        `/conversations/start/${confirmUser._id}`
      );
      navigate("/");
      setSelectedConversation(res.data);
      toast.success(
        res.data.isRequest ? "Message request created" : "Conversation started"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>

      {/* Incoming */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Incoming Requests</h2>
        {incoming.length === 0 ? (
          <p className="text-zinc-500 text-sm">No incoming requests</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => (
              <div
                key={req._id}
                className="border border-base-300 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.requester.profilePic || "/avatar.png"}
                    alt={req.requester.fullName}
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{req.requester.fullName}</p>
                    <p className="text-sm text-zinc-400">
                      @{req.requester.username}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req._id)}
                    className="btn btn-xs btn-success flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className="btn btn-xs btn-error flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <p className="text-zinc-500 text-sm">No outgoing requests</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 space-y-3">
            {outgoing.map((req) => (
              <div
                key={req._id}
                className="border border-base-300 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.recipient.profilePic || "/avatar.png"}
                    alt={req.recipient.fullName}
                    className="size-12 rounded-full object-cover cursor-pointer"
                    onClick={() => handleProfileClick(req.recipient)}
                  />
                  <div>
                    <p
                      className="font-medium cursor-pointer"
                      onClick={() => handleProfileClick(req.recipient)}
                    >
                      {req.recipient.fullName}
                    </p>
                    <p className="text-sm text-zinc-400">
                      @{req.recipient.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(req._id)}
                  className="btn btn-xs btn-warning flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel Request
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggestions */}
      <PeopleYouMayKnow excludeIds={excludeIds} />

      {confirmUser && (
        <div className="fixed inset-0 backdrop-brightness-50 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-blue-950 rounded-lg p-6 shadow-lg">
            <p>
              Start a conversation with <b>{confirmUser.fullName}</b>?
            </p>
            <div className="flex gap-3 mt-4">
              <button
                className="btn btn-primary"
                onClick={handleStartConversation}
              >
                Yes
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPage;
