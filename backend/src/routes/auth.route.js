import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/logout", logout);

router.patch("/update-profile", protectRoute, updateProfile);

export default router;
