import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

export function getReceiverSocketId(receiverId) {
  return onlineUsers[receiverId] || null;
}

// Used to store online users
let onlineUsers = {}; //{ userId: socketId }

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers[userId] = socket.id;
  }
  io.emit("getOnlineUsers", Object.keys(onlineUsers));

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit("getOnlineUsers", Object.keys(onlineUsers));
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", {
        senderId: socket.handshake.query.userId,
      });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", {
        senderId: socket.handshake.query.userId,
      });
    }
  });

  // Add more event listeners as needed
});
export { io, httpServer, app };
