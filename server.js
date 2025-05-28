const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let alerts = [];
let alertId = 1;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("update-alerts", alerts);

  socket.on("new-alert", ({ title, message, sender }) => {
    const alert = {
      id: alertId++,
      title,
      message,
      sender: sender || "Unknown",
      responders: []
    };
    alerts.unshift(alert);
    io.emit("new-alert", alert);
  });

  socket.on("update-status", ({ alertId, responderName, status }) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;
    const existing = alert.responders.find(r => r.name === responderName);
    if (existing) {
      existing.status = status;
    } else {
      alert.responders.push({ name: responderName, status });
    }
    io.emit("update-alerts", alerts);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
