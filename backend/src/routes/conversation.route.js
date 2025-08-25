import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  startConversation,
  getConversationsForSidebar,
  getMessagesByConversation,
  markConversationRead,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversationsForSidebar);
router.post("/start/:otherUserId", protectRoute, startConversation);
router.get("/by-conversation/:id", protectRoute, getMessagesByConversation);
router.post("/read/:conversationId", protectRoute, markConversationRead);

export default router;
