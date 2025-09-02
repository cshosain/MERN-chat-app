import { useEffect, useState } from "react";
import {
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
  Inbox,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { conversations } = useChatStore();
  const { incoming, getFriendRequests } = useFriendStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu automatically on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (authUser) getFriendRequests();
  }, [authUser, getFriendRequests]);

  const friendRequestCount = incoming.length;
  const messageRequestCount = conversations.filter(
    (c) => c.isRequest && !c.accepted
  ).length;

  const navLinks = [
    { to: "/friends", icon: Users, text: "Friends" },
    {
      to: "/friend-requests",
      icon: Inbox,
      text: "Requests",
      count: friendRequestCount,
    },
    {
      to: "/message-requests",
      icon: MessageSquare,
      text: "Messages",
      count: messageRequestCount,
    },
    { to: "/profile", icon: User, text: "Profile" },
    { to: "/settings", icon: Settings, text: "Settings" },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="size-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Chatty
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                {<link.icon className="w-4 h-4 inline-block mr-1" />}
                {link.text}
                {link.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={logout}
              className="ml-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <nav
          className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-5 h-5" />
                  <span>{link.text}</span>
                </div>
                {link.count > 0 && (
                  <span className="bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
