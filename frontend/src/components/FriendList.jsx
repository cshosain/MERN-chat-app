// components/FriendList.jsx
import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";

const FriendList = () => {
  const { friends, getFriends } = useFriendStore();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Friends</h2>
      {friends.length === 0 && (
        <p className="text-sm text-zinc-500">No friends yet</p>
      )}
      <ul className="space-y-2">
        {friends.map((f) => (
          <li key={f._id} className="flex items-center gap-3">
            <img src={f.profilePic} alt="" className="w-10 h-10 rounded-full" />
            <span>{f.fullName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default FriendList;
