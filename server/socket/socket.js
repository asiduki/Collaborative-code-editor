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
// STATE
// -------------------------
const userSocketMap = {};
const voiceRooms = {}; // voiceRooms[roomId] = Set(socketIds)

/* Utility */
function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

io.on("connection", (socket) => {
  console.log(`[SERVER] Socket connected: ${socket.id}`);

  // -----------------------------
  // CODE EDITOR JOIN
  // -----------------------------
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

    console.log(`[JOIN] ${username} joined ${roomId}`);
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.broadcast.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // =======================================================
  // 🔥 VOICE / VIDEO 100% FIXED
  // =======================================================
  socket.on("join-voice", ({ roomId, userName }) => {
    console.log(
      `[VOICE] join-voice request from socket=${socket.id} userName=${userName} room=${roomId}`
    );

    // Create Set if not exist
    if (!voiceRooms[roomId]) voiceRooms[roomId] = new Set();

    const existingPeers = [...voiceRooms[roomId]];

    // Step 1: send existing peers to new peer
    socket.emit("voice-existing-peers", { peers: existingPeers });

    // Step 2: join dedicated voice room
    socket.join(`voice_${roomId}`);

    // Step 3: notify existing peers about new join
    socket.to(`voice_${roomId}`).emit("voice-peer-joined", {
      socketId: socket.id,
    });

    // Step 4: add new peer
    voiceRooms[roomId].add(socket.id);

    console.log(
      `[VOICE] ${userName} (${socket.id}) joined voice_${roomId}. Peers now:`,
      [...voiceRooms[roomId]]
    );
  });

  // -----------------------------
  // SIGNALING
  // -----------------------------
  socket.on("voice-offer", ({ target, offer }) => {
    console.log(`[VOICE SIGNAL] offer from ${socket.id} -> ${target}`);
    io.to(target).emit("voice-offer", { from: socket.id, offer });
  });

  socket.on("voice-answer", ({ target, answer }) => {
    console.log(`[VOICE SIGNAL] answer from ${socket.id} -> ${target}`);
    io.to(target).emit("voice-answer", { from: socket.id, answer });
  });

  socket.on("voice-ice", ({ target, candidate }) => {
    console.log(
      `[VOICE SIGNAL] ice from ${socket.id} -> ${target} (candidate? ${!!candidate})`
    );
    io.to(target).emit("voice-ice", { from: socket.id, candidate });
  });

  // -----------------------------
  // LEAVE VOICE ROOM
  // -----------------------------
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

    console.log(`[VOICE] ${socket.id} left ${vr}`);
  });

  // -----------------------------
  // DISCONNECT
  // -----------------------------
  socket.on("disconnecting", () => {
    console.log(`[SERVER] disconnecting: ${socket.id}`);

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
