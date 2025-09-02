import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { io } from "../lib/socket.js";

export const friendSuggestions = async (req, res) => {
  const me = req.user._id;

  // exclude self, already friends
  const user = await User.findById(me).populate("friends");
  const friendIds = user.friends.map((f) => f._id);

  // pending outgoing/incoming
  const outgoing = await FriendRequest.find({
    requester: me,
    status: "pending",
  }).distinct("recipient");
  const incoming = await FriendRequest.find({
    recipient: me,
    status: "pending",
  }).distinct("requester");

  const exclude = [me, ...friendIds];

  const suggestions = await User.find({ _id: { $nin: exclude } })
    .select("fullName username profilePic")
    .limit(10)
    .lean();

  // annotate each suggestion with status
  const enriched = suggestions.map((s) => {
    if (outgoing.some((id) => String(id) === String(s._id))) {
      return { ...s, friendshipStatus: "outgoing" };
    }
    if (incoming.some((id) => String(id) === String(s._id))) {
      return { ...s, friendshipStatus: "incoming" };
    }
    return { ...s, friendshipStatus: "none" };
  });

  res.json(enriched);
};

export const sendFriendRequest = async (req, res) => {
  try {
    const requester = req.user._id;
    const { userId: recipient } = req.params;

    if (String(requester) === String(recipient)) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }

    // Check if already friends
    const alreadyFriends = await User.exists({
      _id: requester,
      friends: recipient,
    });
    if (alreadyFriends) {
      return res.status(400).json({ message: "Already friends" });
    }

    // 1. Check if reverse request exists (recipient → requester)
    const reverse = await FriendRequest.findOne({
      requester: recipient,
      recipient: requester,
      status: "pending",
    });

    if (reverse) {
      // Auto-accept the reverse request
      reverse.status = "accepted";
      await reverse.save();

      await User.findByIdAndUpdate(requester, {
        $addToSet: { friends: recipient },
      });
      await User.findByIdAndUpdate(recipient, {
        $addToSet: { friends: requester },
      });

      // ensure conversation exists
      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [requester, recipient], $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [requester, recipient],
          isGroup: false,
          unreadCounts: {
            [String(requester)]: 0,
            [String(recipient)]: 0,
          },
        });
      }

      io.to(/* recipient socket */).emit("friend:accepted", {
        userId: requester,
        conversationId: conversation._id,
      });
      io.to(/* requester socket */).emit("friend:accepted", {
        userId: recipient,
        conversationId: conversation._id,
      });

      return res.status(200).json({
        message: "Friend request auto-accepted",
        friendshipStatus: "friends",
        conversationId: conversation._id,
      });
    }

    // 2. Otherwise, send a new request (if not already outgoing)
    const fr = await FriendRequest.findOneAndUpdate(
      { requester, recipient },
      { $setOnInsert: { requester, recipient, status: "pending" } },
      { upsert: true, new: true }
    );

    io.to(/* recipient socketId if online */).emit("friend:request", {
      requester,
      recipient,
      requestId: fr._id,
    });

    res.status(201).json({
      message: "Friend request sent",
      friendshipStatus: "outgoing",
      requestId: fr._id,
    });
  } catch (e) {
    console.error("Error in sendFriendRequest:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelFirendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;
    const fr = await FriendRequest.findById(requestId);
    if (
      !fr ||
      String(fr.requester) !== String(userId) ||
      fr.status !== "pending"
    ) {
      return res.status(404).json({ message: "Request not found" });
    }
    await fr.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const respondFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body; // "accept" | "reject" | "block"

    const fr = await FriendRequest.findById(requestId);
    if (!fr || String(fr.recipient) !== String(userId)) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === "accept") {
      fr.status = "accepted";
      await fr.save();

      await User.findByIdAndUpdate(fr.requester, {
        $addToSet: { friends: fr.recipient },
      });
      await User.findByIdAndUpdate(fr.recipient, {
        $addToSet: { friends: fr.requester },
      });

      // create 1-1 conversation if not exists
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [fr.requester, fr.recipient], $size: 2 },
      });

      let conversation = existing;
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [fr.requester, fr.recipient],
          isGroup: false,
          unreadCounts: {
            [String(fr.requester)]: 0,
            [String(fr.recipient)]: 0,
          },
        });
        io.to(/* requester socket */).emit(
          "conversation:created",
          conversation
        );
        io.to(/* recipient socket */).emit(
          "conversation:created",
          conversation
        );
      }

      io.to(/* requester socket */).emit("friend:accepted", {
        userId: fr.recipient,
        conversationId: conversation._id,
      });
      return res.json({ ok: true });
    }

    if (action === "reject") {
      fr.status = "rejected";
      await fr.save();
      return res.json({ ok: true });
    }

    if (action === "block") {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { blocked: fr.requester },
      });
      fr.status = "blocked";
      await fr.save();
      return res.json({ ok: true });
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listFriends = async (req, res) => {
  const me = await User.findById(req.user._id).populate("friends", "-password");
  res.json(me.friends || []);
};

export const listFriendRequests = async (req, res) => {
  const userId = req.user._id;
  const incoming = await FriendRequest.find({
    recipient: userId,
    status: "pending",
  }).populate("requester", "-password");
  const outgoing = await FriendRequest.find({
    requester: userId,
    status: "pending",
  }).populate("recipient", "-password");
  res.json({ incoming, outgoing });
};
