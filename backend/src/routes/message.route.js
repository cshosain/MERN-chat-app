// routes/message.route.js
import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessagesByUserLegacy, // keep for now if you still need it
  sendMessageToConversation,
  listMessageRequests, // NEW
  acceptMessageRequest, // NEW
  ignoreMessageRequest, // NEW
} from "../controllers/message.controller.js";

const router = express.Router();

// Send by conversation
router.post("/send/:conversationId", protectRoute, sendMessageToConversation);

// Message Requests
router.get("/requests", protectRoute, listMessageRequests);
router.post(
  "/requests/:conversationId/accept",
  protectRoute,
  acceptMessageRequest
);
router.post(
  "/requests/:conversationId/ignore",
  protectRoute,
  ignoreMessageRequest
);

// (Legacy) by userId
router.get("/:id", protectRoute, getMessagesByUserLegacy);

export default router;
