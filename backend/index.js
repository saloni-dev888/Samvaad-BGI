const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");  // ✅ Added this line
const adminRoutes = require("./routes/admin");
const feedbackRoutes = require("./routes/feedback");
const ideaRoutes = require("./routes/idea");
const calendarRoutes = require("./routes/calendar");
const managementRoutes = require("./routes/management");
const wecRoutes = require("./routes/wec");

const app = express();
const server = http.createServer(app);

// ✅ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Make Socket.IO accessible in routes
app.set("io", io);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);  // ✅ Works now
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ideas", ideaRoutes);  // ✅ Fixed path from "/api/idea" to "/api/ideas"
app.use("/api/calendar", calendarRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/wec", wecRoutes);

// ✅ Connect to MongoDB
connectDB();

// ✅ Socket.IO events
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join", (email) => {
    if (email) {
      socket.join(email);
      console.log(`📨 ${email} joined their private room`);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ✅ Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB connection error:", err));
