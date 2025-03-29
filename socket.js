const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Store user socket mapping
    socket.on('registerUser', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Handle sending messages
    socket.on('sendMessage', (messageData) => {
      const recipientSocketId = activeUsers.get(messageData.receiver);
      
      if (recipientSocketId) {
        // Send to specific recipient
        io.to(recipientSocketId).emit('receiveMessage', messageData);
      }
      
      // Broadcast to sender as well
      socket.emit('receiveMessage', messageData);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
      }
      console.log(`Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };