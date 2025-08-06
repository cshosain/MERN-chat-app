import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  const token = req.cookies.chatAppUserToken;
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
    req.user = await User.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }
    next();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
