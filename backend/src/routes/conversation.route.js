import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getConversationsForSidebar,
  startOrGetOneToOne,
  getMessagesByConversation,
  markConversationRead,
  startConversation,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversationsForSidebar);
router.post("/start/:userId", protectRoute, startOrGetOneToOne);
router.post("/start/:otherUserId", protectRoute, startConversation);
router.get("/:id/messages", protectRoute, getMessagesByConversation);
router.post("/:id/mark-read", protectRoute, markConversationRead);

export default router;
