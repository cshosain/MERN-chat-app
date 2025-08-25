import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

const MessageRequests = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const { setSelectedConversation } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReqs = async () => {
      const res = await axiosInstance.get("/messages/requests");
      setIncoming(res.data?.incoming || []);
      setOutgoing(res.data?.outgoing || []);
    };
    fetchReqs();
  }, []);

  const accept = async (convId) => {
    const res = await axiosInstance.post(`/messages/${convId}/accept`);
    setIncoming((r) => r.filter((req) => req._id !== convId));
    // show in sidebar by selecting it
    setSelectedConversation(res.data);
    navigate("/chat");
  };

  const decline = async (convId) => {
    await axiosInstance.post(`/messages/${convId}/decline`);
    setIncoming((r) => r.filter((req) => req._id !== convId));
  };

  const openChat = (conv) => {
    setSelectedConversation(conv);
    navigate("/");
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Message Requests</h2>

      {/* Incoming */}
      <div>
        <h3 className="text-md font-semibold mb-2">Incoming</h3>
        {incoming.length === 0 && (
          <p className="text-sm text-zinc-500">No incoming requests</p>
        )}
        <div className="space-y-3">
          {incoming.map((r) => {
            const other = r.participants.find((p) => p._id !== r.requestedBy);
            return (
              <div
                key={r._id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div
                  onClick={() => openChat(r)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={other?.profilePic || "/avatar.png"}
                    className="w-10 h-10 rounded-full border"
                  />
                  <div>
                    <p className="font-medium">{other?.fullName}</p>
                    <p className="text-xs text-zinc-500">Wants to chat</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-xs btn-success"
                    onClick={() => accept(r._id)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => decline(r._id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outgoing */}
      <div>
        <h3 className="text-md font-semibold mb-2">Outgoing</h3>
        {outgoing.length === 0 && (
          <p className="text-sm text-zinc-500">No outgoing requests</p>
        )}
        <div className="space-y-3">
          {outgoing.map((r) => {
            const other = r.participants.find((p) => p._id !== r.requestedBy);
            return (
              <div
                key={r._id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div
                  onClick={() => openChat(r)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={other?.profilePic || "/avatar.png"}
                    className="w-10 h-10 rounded-full border"
                  />
                  <div>
                    <p className="font-medium">{other?.fullName}</p>
                    <p className="text-xs text-zinc-500">
                      Waiting for their response
                    </p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400">Pending</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageRequests;
