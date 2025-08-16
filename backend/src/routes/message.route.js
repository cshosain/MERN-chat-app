import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessagesById,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessagesById);
router.post("/send/:receiverId", protectRoute, sendMessage);

export default router;
