const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { getIO } = require('../socket'); 

const router = express.Router();

router.post('/send', async (req, res) => {
  const { sender, receiver, message } = req.body;
  
  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    const io = getIO();
    
    io.emit('receiveMessage', newMessage);

    res.json({ 
      success: true,
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get("/messages/:userId", async (req, res) => {
    const { userId } = req.params;
    const { currentUserId } = req.query;

    if (!currentUserId) {
        return res.status(400).json({ error: "Current user ID is required" });
    }

    try {
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate("sender receiver", "name email");

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Error fetching messages" });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "name _id email");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
});


router.get("/last-message/:userId", async (req, res) => {
  const { userId } = req.params;
  const { currentUserId } = req.query;

  if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
  }

  try {
      const lastMessage = await Message.findOne({
          $or: [
              { sender: currentUserId, receiver: userId },
              { sender: userId, receiver: currentUserId }
          ]
      })
      .sort({ createdAt: -1 })
      .limit(1);

      if (!lastMessage) {
          return res.status(404).json({ message: "No messages found" });
      }

      res.json(lastMessage);
  } catch (error) {
      console.error("Error fetching last message:", error);
      res.status(500).json({ error: "Error fetching last message" });
  }
});

router.post('/send', async (req, res) => {
  const { sender, receiver, message, softDeletedBy = [] } = req.body;
  
  if (!sender || !receiver || !message) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      const newMessage = new Message({ 
          sender, 
          receiver, 
          message,
          softDeletedBy 
      });
      await newMessage.save();

      const io = getIO();
      io.emit('receiveMessage', newMessage);

      res.json({ 
          success: true,
          message: 'Message sent successfully',
          newMessage
      });
  } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const { currentUserId } = req.query;

  if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
  }

  try {
      const messages = await Message.find({
          $or: [
              { sender: currentUserId, receiver: userId },
              { sender: userId, receiver: currentUserId }
          ],
          softDeletedBy: { $nin: [currentUserId] }
      })
      .sort({ createdAt: 1 })
      .populate("sender receiver", "name email");

      res.json(messages);
  } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Error fetching messages" });
  }
});

// Soft Delete Messages
router.post("/soft-delete", async (req, res) => {
  const { userId, currentUserId } = req.body;

  try {
      await Message.updateMany(
          {
              $or: [
                  { sender: currentUserId, receiver: userId },
                  { sender: userId, receiver: currentUserId }
              ],
              softDeletedBy: { $nin: [currentUserId] }
          },
          { $push: { softDeletedBy: currentUserId } }
      );

      res.json({ success: true, message: "Chat history soft deleted" });
  } catch (error) {
      console.error("Error soft deleting messages:", error);
      res.status(500).json({ error: "Failed to soft delete messages" });
  }
});

router.get("/message-history/:userId", async (req, res) => {
  const { userId } = req.params;
  const { currentUserId } = req.query;

  if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
  }

  try {
      const messages = await Message.find({
          $or: [
              { sender: currentUserId, receiver: userId },
              { sender: userId, receiver: currentUserId }
          ]
      })
      .sort({ createdAt: 1 })
      .populate("sender receiver", "name email");

      res.json(messages);
  } catch (error) {
      console.error("Error fetching message history:", error);
      res.status(500).json({ error: "Error fetching message history" });
  }
});

router.post("/auto-soft-delete", async (req, res) => {
  const { userId, currentUserId } = req.body;

  try {
      await Message.updateMany(
          {
              $or: [
                  { sender: currentUserId, receiver: userId },
                  { sender: userId, receiver: currentUserId }
              ],
              softDeletedBy: { $nin: [currentUserId] }
          },
          { $push: { softDeletedBy: currentUserId } }
      );

      res.json({ 
          success: true, 
          message: "Chat automatically soft deleted" 
      });
  } catch (error) {
      console.error("Error in auto soft delete:", error);
      res.status(500).json({ error: "Failed to auto soft delete" });
  }
});

module.exports = router;