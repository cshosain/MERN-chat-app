import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    participants: [{ type: ObjectId, ref: "User", required: true }],

    // message request flow
    status: {
      type: String,
      enum: ["active", "pending", "declined"],
      default: "active",
    },
    requestedBy: { type: ObjectId, ref: "User" }, // for pending requests

    lastMessage: { type: ObjectId, ref: "Message" },
    // unread counts per user
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
