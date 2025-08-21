import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const httpServer = createServer(app);

let onlineUsers = {}; // { userId: socketId }

const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Utility: get socketId by userId
export function getReceiverSocketId(receiverId) {
  return onlineUsers[receiverId] || null;
}

// Utility: emit event to multiple users
export function emitToUsers(userIds, event, payload) {
  userIds.forEach((uid) => {
    const sid = onlineUsers[uid];
    if (sid) io.to(sid).emit(event, payload);
  });
}

// ------------------- MAIN SOCKET HANDLER -------------------
io.on("connection", (socket) => {
  console.log("⚡ New client connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  }

  // ---- Typing for simple 1-1 chat (legacy) ----
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
    }
  });

  // ---- Typing for conversation/group chat ----
  socket.on("typing:conversation", ({ conversationId, participants }) => {
    if (!participants || !Array.isArray(participants)) return; // safety check

    participants.forEach((uid) => {
      if (String(uid) === String(userId)) return; // don't send to self
      const sid = onlineUsers[uid];
      if (sid) {
        io.to(sid).emit("typing:conversation", {
          conversationId,
          senderId: userId,
        });
      }
    });
  });

  socket.on("stopTyping:conversation", ({ conversationId, participants }) => {
    if (!participants || !Array.isArray(participants)) return; // safety check

    participants.forEach((uid) => {
      if (String(uid) === String(userId)) return;
      const sid = onlineUsers[uid];
      if (sid) {
        io.to(sid).emit("stopTyping:conversation", {
          conversationId,
          senderId: userId,
        });
      }
    });
  });

  // ---- Disconnect ----
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected", socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit("getOnlineUsers", Object.keys(onlineUsers));
    }
  });
});

export { io, httpServer, app, onlineUsers };
