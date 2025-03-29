// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const { Server } = require("socket.io");
// require("dotenv").config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:3000", 
//         methods: ["GET", "POST"]
//     }
// });

// app.use(cors());
// app.use(express.json());

// // Connect MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

// // Import Routes
// const authRoutes = require("./routes/auth");
// const chatRoutes = require("./routes/chat");

// app.use("/api/auth", authRoutes);
// app.use("/api/chat", chatRoutes);

// // Real-time chat logic
// io.on("connection", (socket) => {
//     console.log("User Connected: " + socket.id);

//     socket.on("sendMessage", (data) => {
//         io.emit("receiveMessage", data); 
//     });

//     socket.on("disconnect", () => {
//         console.log("User Disconnected: " + socket.id);
//     });
// });

// server.listen(5000, () => console.log("Server running on port 5000"));


const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const { initSocket } = require('./socket');  // Adjust path as needed

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Create server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require('./routes/chat');
app.use("/api/auth", authRoutes);
app.use('/api/chat', chatRoutes);

// Server Startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});