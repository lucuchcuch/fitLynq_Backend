import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Get all conversations for a user
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
    .populate("participants", "name profilePicture")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get messages in a conversation
router.get("/conversations/:conversationId/messages", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name profilePicture");

    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: req.userId },
        isRead: false 
      },
      { isRead: true }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start a new conversation
router.post("/conversations", verifyToken, async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: "Participant ID is required" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] }
    });

    if (conversation) {
      await conversation.populate("participants", "name profilePicture");
      await conversation.populate("lastMessage");
      return res.json({ success: true, conversation });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [req.userId, participantId]
    });

    await conversation.save();
    await conversation.populate("participants", "name profilePicture");

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send a message
router.post("/messages", verifyToken, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ success: false, message: "Conversation ID and content are required" });
    }

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: req.userId,
      content
    });

    await message.save();
    await message.populate("sender", "name profilePicture");

    // Update conversation's last message and timestamp
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.updatedAt = new Date();
    await conversation.save();
    await conversation.populate("lastMessage");

    // Get the IO instance
    const io = req.app.get("io");
    
    // Emit the new message to all participants in the conversation
    conversation.participants.forEach(participantId => {
      io.to(`user-${participantId}`).emit("new-message", {
        conversationId: conversation._id,
        message
      });
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get unread message count
router.get("/messages/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      sender: { $ne: req.userId },
      isRead: false,
      conversationId: {
        $in: await Conversation.find({ participants: req.userId }).distinct("_id")
      }
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;