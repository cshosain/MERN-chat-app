import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
  Inbox,
} from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { conversations } = useChatStore();
  const { incoming, getFriendRequests } = useFriendStore();

  useEffect(() => {
    if (authUser) getFriendRequests();
  }, [authUser, getFriendRequests]);

  const friendRequestCount = incoming.length;
  const messageRequestCount = conversations.filter(
    (c) => c.isRequest && !c.accepted
  ).length;

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-all"
          >
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Chatty</h1>
          </Link>

          <div className="flex items-center gap-3">
            <Link to={"/friends"} className="btn btn-sm gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Friends</span>
            </Link>

            <Link to={"/friend-requests"} className="relative btn btn-sm gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {friendRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {friendRequestCount}
                </span>
              )}
            </Link>

            <Link
              to={"/message-requests"}
              className="relative btn btn-sm gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {messageRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {messageRequestCount}
                </span>
              )}
            </Link>

            <Link to={"/settings"} className="btn btn-sm gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button
                  className="btn btn-sm flex gap-2 items-center"
                  onClick={logout}
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
