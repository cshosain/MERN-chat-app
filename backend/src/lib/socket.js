import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {}; // userId -> socketId
let userPrefs = {}; // userId -> { showOnlineStatus, typingIndicators }

export function getReceiverSocketId(receiverId) {
  return onlineUsers[receiverId] || null;
}

export function emitToUsers(userIds, event, payload) {
  userIds.forEach((uid) => {
    const sid = onlineUsers[uid];
    if (sid) io.to(sid).emit(event, payload);
  });
}

export async function broadcastOnline(
  updatedUserId = "",
  updatedOnlineStatus = true
) {
  let visible = [];
  if (updatedUserId && !updatedOnlineStatus) {
    // Only include users who allow being seen online
    visible = Object.keys(onlineUsers).filter((uid) => uid != updatedUserId);
  } else if (updatedUserId && updatedOnlineStatus) {
    //something
    visible = [...Object.keys(onlineUsers), updatedUserId];
  } else {
    // Only include users who allow being seen online
    visible = Object.keys(onlineUsers).filter(
      (uid) => userPrefs[uid]?.showOnlineStatus
    );
  }
  io.emit("getOnlineUsers", visible);
}

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  let userDataCopy;
  if (userId) {
    const u = await User.findById(userId);
    userDataCopy = u;
    if (u?.settings?.showOnlineStatus) {
      onlineUsers[userId] = socket.id;
    }
    userPrefs[userId] = {
      showOnlineStatus: !!u?.settings?.showOnlineStatus,
      typingIndicators: !!u?.settings?.typingIndicators,
    };
  }
  //pass initial showOnlineStatus from as it was in db.
  await broadcastOnline(
    userDataCopy?._id.toString(),
    userDataCopy?.settings?.showOnlineStatus
  );

  socket.on(
    "typing:conversation",
    async ({ conversationId, participants = [] }) => {
      // if sender has typingIndicators disabled, do nothing
      if (!userPrefs[userId]?.typingIndicators) return;

      participants.forEach((uid) => {
        if (String(uid) === String(userId)) return;
        const sid = onlineUsers[uid];
        if (sid)
          io.to(sid).emit("typing:conversation", {
            conversationId,
            senderId: userId,
          });
      });
    }
  );

  socket.on(
    "stopTyping:conversation",
    ({ conversationId, participants = [] }) => {
      participants.forEach((uid) => {
        if (String(uid) === String(userId)) return;
        const sid = onlineUsers[uid];
        if (sid)
          io.to(sid).emit("stopTyping:conversation", {
            conversationId,
            senderId: userId,
          });
      });
    }
  );

  // === Handle Message Reactions ===
  socket.on("message:react", async ({ messageId, emoji }) => {
    try {
      const userId = socket.handshake.query.userId;
      const message = await Message.findById(messageId);
      if (!message) return;

      // If user already reacted → update emoji, else push
      const existing = message.reactions.find(
        (r) => String(r.userId) === String(userId)
      );
      if (existing) {
        existing.emoji = emoji;
      } else {
        message.reactions.push({ userId, emoji });
      }
      await message.save();

      // notify all participants
      const conv = await Conversation.findById(message.conversationId);
      for (const p of conv.participants) {
        const sid = onlineUsers[String(p)];
        if (sid) {
          io.to(sid).emit("message:react", {
            messageId: message._id,
            reaction: { userId, emoji },
          });
        }
      }
    } catch (err) {
      console.error("Reaction error:", err.message);
    }
  });

  socket.on("message:delivered", async ({ messageId }) => {
    const userId = socket.handshake.query.userId;
    const msg = await Message.findById(messageId);
    if (!msg) return;
    if (!msg.deliveredTo.map(String).includes(String(userId))) {
      msg.deliveredTo.push(userId);
      await msg.save();
    }
    // Notify sender
    const senderSid = onlineUsers[String(msg.senderId)];
    if (senderSid) {
      io.to(senderSid).emit("message:delivered", {
        messageId,
        userId,
        at: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", async () => {
    if (userId) {
      delete onlineUsers[userId];
      // last seen
      await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    }
    await broadcastOnline();
  });
});

export { io, httpServer, app, onlineUsers };
