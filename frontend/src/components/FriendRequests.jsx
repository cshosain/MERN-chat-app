// components/FriendRequests.jsx
import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";

const FriendRequests = () => {
  const { requests, getRequests, acceptRequest, rejectRequest, isLoading } =
    useFriendStore();

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Friend Requests</h2>
      {requests.incoming?.length === 0 && (
        <p className="text-sm text-zinc-500">No requests</p>
      )}
      <ul className="space-y-3">
        {requests.incoming?.map((r) => (
          <li key={r._id} className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <img
                src={r.from.profilePic}
                alt=""
                className="w-10 h-10 rounded-full"
              />
              <span>{r.from.fullName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => acceptRequest(r._id)}
                className="btn btn-xs btn-success"
              >
                Accept
              </button>
              <button
                onClick={() => rejectRequest(r._id)}
                className="btn btn-xs btn-error"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default FriendRequests;
