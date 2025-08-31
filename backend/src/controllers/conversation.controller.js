import { canMessage, shouldEmitReadReceipt } from "../lib/utils.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io, onlineUsers } from "../lib/socket.js";

/**
 * Sidebar: list conversations for a user (active only).
 */
export const getConversationsForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const convs = await Conversation.aggregate([
      { $match: { participants: userId, status: "active" } },
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessage",
        },
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1, updatedAt: -1 } },
    ]);

    const participantIds = [
      ...new Set(convs.flatMap((c) => c.participants.map(String))),
    ];
    const users = await User.find({ _id: { $in: participantIds } }).select(
      "_id fullName profilePic settings"
    );
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const shaped = convs.map((c) => ({
      _id: c._id,
      isGroup: c.isGroup,
      groupName: c.groupName,
      groupImage: c.groupImage,
      participants: c.participants.map((id) => userMap.get(String(id))),
      lastMessage: c.lastMessage || null,
      unreadCount: c.unreadCounts?.get?.(String(userId)) || 0,
      updatedAt: c.updatedAt,
    }));

    res.json(shaped);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 1-1 DM: start or get existing.
 * Respects privacy — may create a pending request instead of active conversation.
 */
export const startOrGetOneToOne = async (req, res) => {
  try {
    const me = req.user._id;
    const { userId } = req.params;

    if (String(me) === String(userId)) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    let conv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [me, userId], $size: 2 },
    });

    if (conv) return res.json(conv);

    // Check privacy
    const allowed = await canMessage(me, userId);

    conv = await Conversation.create({
      isGroup: false,
      participants: [me, userId],
      status: allowed ? "active" : "pending",
      requestedBy: allowed ? undefined : me,
      unreadCounts: { [String(me)]: 0, [String(userId)]: 0 },
    });

    // If pending, notify recipient
    if (!allowed) {
      const sid = getReceiverSocketId(String(userId));
      if (sid) io.to(sid).emit("conversation:request", conv);
    }

    res.json(conv);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Explicit conversation creation (for friend suggestions or manual start).
 */
export const startConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.otherUserId;

    if (String(me) === String(other)) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    let conv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [me, other], $size: 2 },
    });

    if (!conv) {
      const allowed = await canMessage(me, other);
      conv = await Conversation.create({
        participants: [me, other],
        isGroup: false,
        status: allowed ? "active" : "pending",
        requestedBy: allowed ? undefined : me,
        unreadCounts: { [String(me)]: 0, [String(other)]: 0 },
      });

      // notify other user
      const sid = getReceiverSocketId(String(other));
      if (sid) {
        io.to(sid).emit(
          allowed ? "conversation:created" : "conversation:request",
          conv
        );
      }
    }

    return res.json(conv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Fetch all messages in a conversation.
 */
export const getMessagesByConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.some((p) => String(p) === String(userId))) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark conversation as read.
 * Respects readReceipts privacy before emitting.
 */
export const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.some((p) => p.equals(userId))) {
      return res.status(403).json({ message: "Not a participant" });
    }

    conv.unreadCounts.set(String(userId), 0);
    await conv.save();

    // Check read receipt privacy for all participants
    const users = await User.find({ _id: { $in: conv.participants } });
    const userSettings = Object.fromEntries(
      users.map((u) => [String(u._id), u.settings?.readReceipts !== false])
    );

    // Only update readBy and emit if BOTH users allow read receipts
    const canEmit = conv.participants.every((pid) => userSettings[String(pid)]);
    if (canEmit) {
      await Message.updateMany(
        { conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      const otherParticipants = conv.participants.filter(
        (p) => !p.equals(userId)
      );
      otherParticipants.forEach((participantId) => {
        const sid = onlineUsers[participantId.toString()];
        if (sid) {
          io.to(sid).emit("message:read", {
            conversationId,
            readerId: userId.toString(),
          });
        }
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("Error in markConversationRead:", e);
    res.status(500).json({ message: "Server error" });
  }
};

//get last seen info.
export const getLastSeen = async (req, res) => {
  const { userId } = req.params;
  try {
    const lastSeen = await User.findById(userId).select("lastSeenAt");
    if (!lastSeen) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ lastSeen });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
