import { useEffect } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useState } from "react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  // Local UI state for privacy (later fetch from backend)
  const [privacy, setPrivacy] = useState({
    allowDMsFrom: "friends",
    friendRequestsFrom: "anyone",
    showOnlineStatus: true,
    lastSeenVisible: true,
    readReceipts: true,
    typingIndicators: true,
  });

  const handlePrivacyChange = async (field, value) => {
    setPrivacy((prev) => ({ ...prev, [field]: value }));
    // Later call API: axios.put("/users/settings", { [field]: value });
    await axiosInstance.patch("/auth/update-privacy", {
      settings: { ...privacy, [field]: value },
    });
  };

  // Load settings from backend
  useEffect(() => {
    axiosInstance.get("/auth/check").then((res) => {
      setPrivacy(res.data?.settings);
    });
  }, []);

  return (
    <div className=" container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">
            Choose a theme for your chat interface
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div
                className="relative h-8 w-full rounded-md overflow-hidden"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Hosain Ahemd</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${
                            message.isSent
                              ? "bg-primary text-primary-content"
                              : "bg-base-200"
                          }
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${
                              message.isSent
                                ? "text-primary-content/70"
                                : "text-base-content/70"
                            }
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Privacy Section */}
        {/* Privacy Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Privacy</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Control who can interact with you and what information they see
          </p>

          {/* Who can DM me */}
          <div className="mb-4">
            <label className="font-medium block">Who can message me</label>
            <select
              className="select select-bordered w-full mt-1"
              value={privacy.allowDMsFrom}
              onChange={(e) =>
                handlePrivacyChange("allowDMsFrom", e.target.value)
              }
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends only</option>
              <option value="no_one">No one</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Control who can start a conversation with you.
            </p>
          </div>

          {/* Who can send friend requests */}
          <div className="mb-4">
            <label className="font-medium block">
              Who can send me friend requests
            </label>
            <select
              className="select select-bordered w-full mt-1"
              value={privacy.friendRequestsFrom}
              onChange={(e) =>
                handlePrivacyChange("friendRequestsFrom", e.target.value)
              }
            >
              <option value="anyone">Anyone</option>
              <option value="friends_of_friends">Friends of friends</option>
              <option value="no_one">No one</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose who is allowed to send you friend requests.
            </p>
          </div>

          {/* Online status */}
          <div className="flex items-center justify-between mb-3">
            <span>Show online status</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={privacy.showOnlineStatus}
              onChange={(e) =>
                handlePrivacyChange("showOnlineStatus", e.target.checked)
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 border-b border-base-300 pb-4 mb-4">
            You can chat with anyone without showing yourself online.
          </p>

          {/* Last seen */}
          <div className="flex items-center justify-between mb-3">
            <span>Show last seen</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={privacy.lastSeenVisible}
              onChange={(e) =>
                handlePrivacyChange("lastSeenVisible", e.target.checked)
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 border-b border-base-300 pb-4 mb-4">
            When you hide your last seen, you can not see last seen of other
            person.
          </p>

          {/* Read receipts */}
          <div className="flex items-center justify-between mb-3">
            <span>Read receipts</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={privacy.readReceipts}
              onChange={(e) =>
                handlePrivacyChange("readReceipts", e.target.checked)
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 border-b border-base-300 pb-4 mb-4">
            When you hide your read receipts, you can not get the read receipts
            from other person.
          </p>

          {/* Typing indicators */}
          <div className="flex items-center justify-between">
            <span>Typing indicators</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={privacy.typingIndicators}
              onChange={(e) =>
                handlePrivacyChange("typingIndicators", e.target.checked)
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 border-b border-base-300 pb-4 mb-4">
            When you hide typing indicators, you can not see typing indicators
            while other typing.
          </p>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
