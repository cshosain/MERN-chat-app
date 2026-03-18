import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  startConversation,
  getConversationsForSidebar,
  getMessagesByConversation,
  markConversationRead,
  getLastSeen,
  getConversationById,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversationsForSidebar);
router.post("/start/:otherUserId", protectRoute, startConversation);
router.get("/by-conversation/:id", protectRoute, getMessagesByConversation);
router.post("/read/:conversationId", protectRoute, markConversationRead);
router.get("/last-seen/:userId", protectRoute, getLastSeen);

// New endpoint to fetch conversation by ID (including encryptionKey)
router.get("/convForEncryptionKey/:id", protectRoute, getConversationById);

export default router;
