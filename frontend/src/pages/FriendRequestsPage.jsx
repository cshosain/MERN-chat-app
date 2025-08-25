import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import PeopleYouMayKnow from "../components/PeopleYouMayKnow";

const FriendRequestsPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <div className="space-y-3">
            {outgoing.map((req) => (
              <div
                key={req._id}
                className="border border-base-300 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.recipient.profilePic || "/avatar.png"}
                    alt={req.recipient.fullName}
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{req.recipient.fullName}</p>
                    <p className="text-sm text-zinc-400">
                      @{req.recipient.username}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-zinc-500">Pending...</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggestions */}
      <PeopleYouMayKnow />
    </div>
  );
};

export default FriendRequestsPage;
