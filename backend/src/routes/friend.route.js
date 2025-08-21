import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  sendFriendRequest,
  respondFriendRequest,
  listFriends,
  listFriendRequests,
  friendSuggestions,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/respond/:requestId", protectRoute, respondFriendRequest);
router.get("/list", protectRoute, listFriends);
router.get("/requests", protectRoute, listFriendRequests);
router.get("/suggestions", protectRoute, friendSuggestions);

export default router;
