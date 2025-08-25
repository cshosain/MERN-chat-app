import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  sendMessageToConversation,
  reactToMessage,
  listMessageRequests,
  acceptRequest,
  declineRequest,
} from "../controllers/message.controller.js";

const router = express.Router();

router.post("/send/:conversationId", protectRoute, sendMessageToConversation);
router.post("/react/:messageId", protectRoute, reactToMessage);
router.get("/requests", protectRoute, listMessageRequests);
router.post("/:id/accept", protectRoute, acceptRequest); //message request
router.post("/:id/decline", protectRoute, declineRequest); // message request

export default router;
