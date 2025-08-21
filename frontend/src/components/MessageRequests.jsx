// components/MessageRequests.jsx
import { useEffect } from "react";
import { axiosInstance } from "../lib/axios";
// import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const MessageRequests = () => {
  //const { setSelectedConversation } = useChatStore();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchReqs = async () => {
      const res = await axiosInstance.get("/messages/requests");
      setRequests(res.data);
    };
    fetchReqs();
  }, []);

  const accept = async (convId) => {
    await axiosInstance.post(`/messages/requests/${convId}/accept`);
    setRequests((r) => r.filter((req) => req._id !== convId));
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Message Requests</h2>
      {requests.length === 0 && (
        <p className="text-sm text-zinc-500">No message requests</p>
      )}
      {requests.map((r) => (
        <div
          key={r._id}
          className="border rounded p-3 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{r.sender.fullName}</p>
            <p className="text-sm text-zinc-500">{r.preview}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-xs btn-success"
              onClick={() => accept(r._id)}
            >
              Accept
            </button>
            <button className="btn btn-xs">Ignore</button>
          </div>
        </div>
      ))}
    </div>
  );
};
export default MessageRequests;
