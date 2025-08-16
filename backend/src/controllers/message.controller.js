import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesById = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const loggedInUserId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: loggedInUserId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    // Extracting receiverId and message content from request
    if (!req.params.receiverId || !req.body) {
      return res
        .status(404)
        .json({ message: "User or message are not provided" });
    }
    const { receiverId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image, {
        folder: "chatApp/messages",
        resource_type: "image",
      });
      imageUrl = uploadedResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl || null, // Use the uploaded image URL or null if no image was sent
    });

    await newMessage.save();
    //realtime message sending logic can be added here using socket.io
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};
