import { Server } from "socket.io";
import http from "http";
import express from "express";
import ACTIONS from "../actions/Actions.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// -------------------------
// Users aur voice rooms ka data store
// -------------------------
const userSocketMap = {};
const voiceRooms = {};

// Room me connected clients ka list lene ka function
function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

io.on("connection", (socket) => {
  
  // User room me join kar raha hai (code editor wala)
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // Code change dusre users ko send karna
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.broadcast.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // New user ko code sync karwana
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Voice/Video room join karna (WebRTC signaling)
  socket.on("join-voice", ({ roomId }) => {
    if (!voiceRooms[roomId]) voiceRooms[roomId] = new Set();

    const existingPeers = [...voiceRooms[roomId]];

    // New user ko old peers ka list dena
    socket.emit("voice-existing-peers", { peers: existingPeers });

    // Voice room join karana
    socket.join(`voice_${roomId}`);

    // Old users ko batana ki new peer join hua hai
    socket.to(`voice_${roomId}`).emit("voice-peer-joined", {
      socketId: socket.id,
    });

    // New peer ko add karna
    voiceRooms[roomId].add(socket.id);
  });

  // Offer bhejna
  socket.on("voice-offer", ({ target, offer }) => {
    io.to(target).emit("voice-offer", { from: socket.id, offer });
  });

  // Answer bhejna
  socket.on("voice-answer", ({ target, answer }) => {
    io.to(target).emit("voice-answer", { from: socket.id, answer });
  });

  // ICE candidate bhejna
  socket.on("voice-ice", ({ target, candidate }) => {
    io.to(target).emit("voice-ice", { from: socket.id, candidate });
  });

  // Voice room se nikalna
  socket.on("leave-voice", ({ roomId }) => {
    const vr = `voice_${roomId}`;
    socket.leave(vr);

    if (voiceRooms[roomId]) {
      voiceRooms[roomId].delete(socket.id);

      socket.to(vr).emit("voice-peer-left", {
        socketId: socket.id,
      });

      if (voiceRooms[roomId].size === 0) {
        delete voiceRooms[roomId];
      }
    }
  });

  // Disconnect hone par clean-up
  socket.on("disconnecting", () => {
    Object.keys(voiceRooms).forEach((roomId) => {
      if (voiceRooms[roomId].has(socket.id)) {
        voiceRooms[roomId].delete(socket.id);

        socket.to(`voice_${roomId}`).emit("voice-peer-left", {
          socketId: socket.id,
        });

        if (voiceRooms[roomId].size === 0) delete voiceRooms[roomId];
      }
    });

    delete userSocketMap[socket.id];
  });
});

export { app, server, io };
