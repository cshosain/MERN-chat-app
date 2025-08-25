import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { canMessage, shouldEmitReadReceipt } from "../lib/utils.js";

/**
 * Send a message into a conversation.
 * Handles privacy, pending requests, auto-accept if recipient replies.
 */
export const sendMessageToConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    const conv = await Conversation.findById(conversationId);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some((p) => String(p) === String(senderId))) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const isOneToOne = !conv.isGroup && conv.participants.length === 2;
    const otherId = isOneToOne
      ? String(conv.participants.find((p) => String(p) !== String(senderId)))
      : undefined;

    // 🔥 Privacy check must always run
    const allowed = await canMessage(senderId, otherId);
    if (!allowed && conv.status === "active") {
      return res
        .status(403)
        .json({ message: "This person only accepts messages from friends" });
    }

    if (!allowed && conv.status === "pending") {
      // If recipient has stricter settings, stop here too
      return res
        .status(403)
        .json({ message: "This person didn’t receive your message" });
    }

    if (isOneToOne) {
      if (conv.status === "pending") {
        const isRequester = String(conv.requestedBy) === String(senderId);
        if (!isRequester) {
          // recipient replying → auto-accept
          conv.status = "active";
          conv.requestedBy = undefined;
        }
      } else if (conv.status === "declined") {
        return res.status(403).json({ message: "Request was declined" });
      }
    }

    // Upload image if any
    let imageUrl;
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image, {
        folder: "chatApp/messages",
        resource_type: "image",
      });
      imageUrl = uploadedResponse.secure_url;
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId: otherId,
      text,
      image: imageUrl || null,
      readBy: [senderId],
    });

    // Update conversation
    conv.lastMessage = newMessage._id;
    conv.participants.forEach((p) => {
      const key = String(p);
      if (key !== String(senderId)) {
        const curr = conv.unreadCounts.get(key) || 0;
        conv.unreadCounts.set(key, curr + 1);
      }
    });
    await conv.save();

    // Emit to others
    for (const p of conv.participants) {
      const uid = String(p);
      if (uid === String(senderId)) continue;
      const sid = getReceiverSocketId(uid);
      if (sid) {
        io.to(sid).emit("message:new", { conversationId, message: newMessage });
        io.to(sid).emit("conversation:updated", {
          conversationId,
          lastMessage: newMessage,
          status: conv.status,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(`Error in sendMessageToConversation: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * NEW — list message requests (pending convs).
 */
export const listMessageRequests = async (req, res) => {
  try {
    const me = req.user._id;
    const incoming = await Conversation.find({
      isGroup: false,
      status: "pending",
      participants: { $in: [me] },
      requestedBy: { $ne: me },
    }).populate("participants", "_id fullName profilePic");

    const outgoing = await Conversation.find({
      isGroup: false,
      status: "pending",
      requestedBy: me,
    }).populate("participants", "_id fullName profilePic");

    res.json({ incoming, outgoing });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * NEW — accept a message request.
 */
export const acceptRequest = async (req, res) => {
  try {
    const me = req.user._id;
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Not found" });
    if (!conv.participants.some((p) => String(p) === String(me)))
      return res.status(403).json({ message: "Forbidden" });

    conv.status = "active";
    await conv.save();

    conv.participants.forEach((p) => {
      if (String(p) === String(me)) return;
      const sid = getReceiverSocketId(String(p));
      if (sid) io.to(sid).emit("conversation:accepted", conv);
    });

    res.json(conv);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * NEW — decline a message request.
 */
export const declineRequest = async (req, res) => {
  try {
    const me = req.user._id;
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Not found" });
    if (!conv.participants.some((p) => String(p) === String(me)))
      return res.status(403).json({ message: "Forbidden" });

    conv.status = "declined";
    await conv.save();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { type } = req.body; // "like"|"love"|...
  const me = req.user._id;

  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ message: "Not found" });

  const conv = await Conversation.findById(msg.conversationId);
  if (!conv.participants.some((p) => String(p) === String(me)))
    return res.status(403).json({ message: "Forbidden" });

  await Message.updateOne(
    { _id: messageId, "reactions.userId": { $ne: me } },
    { $push: { reactions: { userId: me, type } } }
  );
  await Message.updateOne(
    { _id: messageId, "reactions.userId": me },
    { $set: { "reactions.$.type": type } }
  );

  // notify others
  conv.participants.forEach((p) => {
    const uid = String(p);
    if (uid === String(me)) return;
    const sid = getReceiverSocketId(uid);
    if (sid) io.to(sid).emit("message:reaction", { messageId, by: me, type });
  });

  res.json({ ok: true });
};
/**
 * (Legacy) get all messages between 2 users directly by userId.
 */
export const getMessagesByUserLegacy = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const me = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: me },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
