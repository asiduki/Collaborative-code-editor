// client/src/socket.js
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const initSocket = async () => {
  const socket = io(URL, {
    path: "/socket.io",     // VERY IMPORTANT
    transports: ["websocket"],
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: false,
  });

  console.log("[Socket] connecting to:", URL);

  socket.on("connect", () => console.log("[Socket] connected:", socket.id));
  socket.on("connect_error", (e) => console.error("[Socket] Error:", e));
  socket.on("disconnect", (r) => console.warn("[Socket] Disconnected:", r));

  return socket;
};
