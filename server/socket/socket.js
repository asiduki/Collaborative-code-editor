import { Server } from "socket.io";
import http from "http";
import express from "express";
import ACTIONS from "../actions/Actions.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // IMPORTANT: Restrict this to your frontend's URL in production
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

io.on("connection", (socket) => {
  // Log when a new client connects
  console.log(`[SERVER LOG] 🔌 Socket connected: ${socket.id}`);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    // Log when a user joins a room
    console.log(`[SERVER LOG] -> User ${username} (${socket.id}) joined room: ${roomId}`);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    // Log when the server receives a code change event
    console.log(`[SERVER LOG] -> CODE_CHANGE received from ${socket.id} for room: ${roomId}`);
    // Broadcast the change to all other clients in the room
    socket.broadcast.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    // Log when a sync event is triggered
    console.log(`[SERVER LOG] -> SYNC_CODE from an existing user to new user: ${socketId}`);
    // Forward the code to the new user as a standard CODE_CHANGE event
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      // Don't log the socket's own default room
      if (roomId !== socket.id) {
        console.log(`[SERVER LOG] -> User ${userSocketMap[socket.id]} disconnecting from room: ${roomId}`);
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      }
    });
    delete userSocketMap[socket.id];
  });
});

// Make sure you are exporting and starting the server correctly in your main entry file.
export { app, server, io };