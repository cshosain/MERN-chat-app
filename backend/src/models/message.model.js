import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // keep for 1-1 convenience
    text: String,
    image: String,
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // includes sender by default
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // legacy lookups

const Message = mongoose.model("Message", messageSchema);
export default Message;
