import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 30 days
  });
  res.cookie("chatAppUserToken", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: "none", // CSRF protection
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
  });
  return token;
};

/** helpers */
export const areFriends = (a, b) =>
  a.friends?.some((id) => String(id) === String(b._id));
export const isBlocked = (recipient, senderId) =>
  recipient.blocked?.some((id) => String(id) === String(senderId));

/** privacy gate for starting or sending DMs */
export async function canMessage(senderId, recipientId) {
  const [sender, recipient] = await Promise.all([
    User.findById(senderId).lean(),
    User.findById(recipientId).lean(),
  ]);
  if (!sender || !recipient) return false;

  // If recipient blocked sender => hard stop
  if (isBlocked(recipient, senderId)) return false;

  const setting = recipient.settings?.allowDMsFrom || "friends";
  if (setting === "no_one") return false;
  if (setting === "everyone") return true;

  // friends only
  return areFriends(recipient, sender);
}

/** should we emit read receipts outward? */
export async function shouldEmitReadReceipt(readerId) {
  const u = await User.findById(readerId).lean();
  return !!u?.settings?.readReceipts;
}

/** should we forward typing indicator to others? */
export async function allowTypingFrom(userId) {
  const u = await User.findById(userId).lean();
  return !!u?.settings?.typingIndicators;
}
