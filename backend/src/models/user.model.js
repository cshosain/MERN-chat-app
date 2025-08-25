import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 6 },
    profilePic: {
      type: String,
      default:
        "https://as2.ftcdn.net/jpg/03/59/58/91/1000_F_359589186_JDLl8dIWoBNf1iqEkHxhUeeOulx0wOC5.jpg",
    },

    // social graph
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // privacy + preferences
    settings: {
      // Who can start a DM?
      allowDMsFrom: {
        type: String,
        enum: ["everyone", "friends", "no_one"],
        default: "friends",
      },
      // Who can send me friend reqs?
      friendRequestsFrom: {
        type: String,
        enum: ["anyone", "friends_of_friends", "no_one"],
        default: "anyone",
      },
      // Presence / last seen
      showOnlineStatus: { type: Boolean, default: true },
      lastSeenVisible: { type: Boolean, default: true },

      // Messaging UX
      readReceipts: { type: Boolean, default: true }, // emit seen to others
      typingIndicators: { type: Boolean, default: true }, // show I'm typing to others
    },

    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
