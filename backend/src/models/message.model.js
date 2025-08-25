import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: ObjectId, ref: "Conversation", required: true },
    senderId: { type: ObjectId, ref: "User", required: true },

    // optional for 1-1 convenience
    receiverId: { type: ObjectId, ref: "User" },

    text: String,
    image: String,

    deliveredTo: [{ type: ObjectId, ref: "User" }], // delivery receipts
    readBy: [{ type: ObjectId, ref: "User" }], // read receipts

    reactions: [
      {
        userId: { type: ObjectId, ref: "User" },
        type: { type: String }, // "like" | "love" | "haha" | ...
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
