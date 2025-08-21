import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 30 days
  });
  res.cookie("chatAppUserToken", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: "strict", // CSRF protection
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
  });
  return token;
};

export async function canMessage(senderId, recipientId) {
  const sender = await User.findById(senderId);
  const recipient = await User.findById(recipientId);

  // blocked check
  if (recipient.blocked?.some((b) => String(b) === String(senderId)))
    return false;

  // friends check
  const friends = sender.friends?.some(
    (f) => String(f) === String(recipientId)
  );
  if (friends) return true;

  // privacy settings check
  return recipient.settings?.allowDMsFrom === "everyone";
}
