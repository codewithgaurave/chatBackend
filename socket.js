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
  const activeCalls = new Map();

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Store user socket mapping
    socket.on('registerUser', (userId) => {
      console.log(`User ${userId} registered with socket ${socket.id}`);
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    // Handle sending messages
// In your socket server (socket.js)
socket.on('signal', ({ userId, signal }) => {
  console.log(`Signaling data sent to ${userId}`);
  const userSocketId = activeUsers.get(userId);
  if (userSocketId) {
    // Add validation for signal data
    if (signal && (signal.candidate || signal.type === 'answer' || signal.type === 'offer')) {
      io.to(userSocketId).emit('signal', signal);
    } else {
      console.warn('Invalid signal data received:', signal);
    }
  } else {
    console.warn(`User ${userId} not found for signaling`);
  }
});

    // Video call handlers
    socket.on('initiateCall', ({ callerId, receiverId, signalData }) => {
      console.log(`Call initiated from ${callerId} to ${receiverId}`);
      const receiverSocketId = activeUsers.get(receiverId);
      
      if (receiverSocketId) {
        activeCalls.set(callerId, { receiverId, status: 'ringing' });
        activeCalls.set(receiverId, { callerId, status: 'ringing' });
        
        io.to(receiverSocketId).emit('incomingCall', { 
          callerId, 
          signalData 
        });
      } else {
        socket.emit('callFailed', { message: 'User is offline' });
      }
    });

    socket.on('acceptCall', ({ callerId, receiverId, signalData }) => {
      console.log(`Call accepted by ${receiverId}`);
      const callerSocketId = activeUsers.get(callerId);
      
      if (callerSocketId) {
        activeCalls.set(callerId, { receiverId, status: 'ongoing' });
        activeCalls.set(receiverId, { callerId, status: 'ongoing' });
        
        io.to(callerSocketId).emit('callAccepted', { signalData });
      }
    });

    socket.on('rejectCall', ({ callerId, receiverId }) => {
      console.log(`Call rejected by ${receiverId}`);
      const callerSocketId = activeUsers.get(callerId);
      
      if (callerSocketId) {
        activeCalls.delete(callerId);
        activeCalls.delete(receiverId);
        
        io.to(callerSocketId).emit('callRejected');
      }
    });

    socket.on('endCall', ({ callerId, receiverId }) => {
      console.log(`Call ended between ${callerId} and ${receiverId}`);
      const receiverSocketId = activeUsers.get(receiverId);
      
      activeCalls.delete(callerId);
      activeCalls.delete(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('callEnded');
      }
    });

    socket.on('signal', ({ userId, signal }) => {
      console.log(`Signaling data sent to ${userId}`);
      const userSocketId = activeUsers.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('signal', signal);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      if (socket.userId) {
        const callInfo = activeCalls.get(socket.userId);
        if (callInfo) {
          const otherUserSocketId = activeUsers.get(
            callInfo.callerId === socket.userId 
              ? callInfo.receiverId 
              : callInfo.callerId
          );
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit('callEnded');
          }
          activeCalls.delete(socket.userId);
          activeCalls.delete(
            callInfo.callerId === socket.userId 
              ? callInfo.receiverId 
              : callInfo.callerId
          );
        }
        activeUsers.delete(socket.userId);
      }
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