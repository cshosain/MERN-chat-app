import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { canMessage } from "../lib/utils.js";

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

    // figure out the other user for 1-1
    const isOneToOne = !conv.isGroup && conv.participants.length === 2;
    const otherId = isOneToOne
      ? String(conv.participants.find((p) => String(p) !== String(senderId)))
      : undefined;

    // Permissions:
    // - If this is a regular (accepted) 1-1: must pass canMessage
    // - If this is a request: allow the requester to send; if the recipient sends, auto-accept
    if (isOneToOne) {
      const allowed = await canMessage(senderId, otherId);

      if (!conv.isRequest) {
        if (!allowed) {
          return res
            .status(403)
            .json({ message: "You cannot message this user" });
        }
      } else {
        // it's a request thread
        const isRequester = String(conv.requestedBy) === String(senderId);
        if (!isRequester) {
          // recipient is replying -> auto-accept the request
          conv.isRequest = false;
          conv.requestedBy = undefined;
        }
      }
    }

    // upload image if any
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
      receiverId: otherId, // helpful for client-side UX
      text,
      image: imageUrl || null,
      readBy: [senderId],
    });

    // update conversation lastMessage + unread
    conv.lastMessage = newMessage._id;
    conv.participants.forEach((p) => {
      const key = String(p);
      if (key !== String(senderId)) {
        const curr = conv.unreadCounts.get(key) || 0;
        conv.unreadCounts.set(key, curr + 1);
      }
    });
    await conv.save();

    // emit to others
    for (const p of conv.participants) {
      const uid = String(p);
      if (uid === String(senderId)) continue;
      const sid = getReceiverSocketId(uid);
      if (sid) {
        io.to(sid).emit("message:new", { conversationId, message: newMessage });
        io.to(sid).emit("conversation:updated", {
          conversationId,
          lastMessage: newMessage,
          isRequest: conv.isRequest,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// List pending message requests for the current user
export const listMessageRequests = async (req, res) => {
  try {
    const userId = String(req.user._id);

    const requests = await Conversation.find({
      isGroup: false,
      isRequest: true,
      participants: req.user._id, // the user is part of the pending thread
    })
      .populate("participants", "fullName profilePic")
      .populate({
        path: "lastMessage",
        select: "text image createdAt senderId",
      })
      .sort({ updatedAt: -1 });

    // Optional: shape a preview field for easy UI
    const shaped = requests.map((c) => {
      const other = c.participants.find((u) => String(u._id) !== userId);
      return {
        _id: c._id,
        isRequest: c.isRequest,
        requestedBy: c.requestedBy,
        otherUser: other,
        lastMessage: c.lastMessage,
        updatedAt: c.updatedAt,
      };
    });

    res.json(shaped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept a message request (turn it into a normal conversation)
export const acceptMessageRequest = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.user._id);

    const conv = await Conversation.findById(conversationId);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some((p) => String(p) === userId)) {
      return res.status(403).json({ message: "Not a participant" });
    }
    if (!conv.isRequest) {
      return res
        .status(400)
        .json({ message: "Conversation is already accepted" });
    }

    conv.isRequest = false;
    conv.requestedBy = undefined;
    await conv.save();

    // notify both sides
    for (const p of conv.participants) {
      const sid = getReceiverSocketId(String(p));
      if (sid) {
        io.to(sid).emit("conversation:updated", {
          conversationId: conv._id,
          isRequest: false,
          lastMessage: conv.lastMessage,
        });
      }
    }

    res.json(conv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// Ignore a message request (delete the pending request thread)
export const ignoreMessageRequest = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.user._id);

    const conv = await Conversation.findById(conversationId);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some((p) => String(p) === userId)) {
      return res.status(403).json({ message: "Not a participant" });
    }
    if (!conv.isRequest) {
      return res.status(400).json({ message: "Conversation is not a request" });
    }

    // delete messages + the conversation
    await Message.deleteMany({ conversationId: conv._id });
    await conv.deleteOne();

    // notify requester (if online)
    const otherId = conv.participants.find((p) => String(p) !== userId);
    const otherSid = getReceiverSocketId(String(otherId));
    if (otherSid) {
      io.to(otherSid).emit("conversation:deleted", { conversationId });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// (Optional) keep your "by userId" getters for backward compatibility during migration
export const getMessagesByUserLegacy = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const loggedInUserId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: loggedInUserId },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
