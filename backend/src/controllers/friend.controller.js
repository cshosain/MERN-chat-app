import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { io } from "../lib/socket.js";

export const friendSuggestions = async (req, res) => {
  const me = req.user._id;

  // exclude self, already friends, already requested
  const user = await User.findById(me).populate("friends");
  const friendIds = user.friends.map((f) => f._id);
  const outgoing = await FriendRequest.find({
    requester: me,
    status: "pending",
  }).distinct("recipient");
  const incoming = await FriendRequest.find({
    recipient: me,
    status: "pending",
  }).distinct("requester");

  const exclude = [me, ...friendIds, ...outgoing, ...incoming];

  const suggestions = await User.find({ _id: { $nin: exclude } })
    .select("fullName username profilePic")
    .limit(10);

  res.json(suggestions);
};

export const sendFriendRequest = async (req, res) => {
  try {
    const requester = req.user._id;
    const { userId: recipient } = req.params;
    if (String(requester) === String(recipient)) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }

    const alreadyFriends = await User.exists({
      _id: requester,
      friends: recipient,
    });
    if (alreadyFriends)
      return res.status(400).json({ message: "Already friends" });

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

    res.status(201).json(fr);
  } catch (e) {
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
