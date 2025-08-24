import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { fetchRecords, saveRecord } from "../controllers/recordController.js";
import { createRoom, fetchRooms } from "../controllers/roomController.js"; // ⬅️ NEW

const router = express.Router();

router.get("/fetch", verifyToken, fetchRecords);
router.post("/save", verifyToken, saveRecord);

// ✅ NEW Routes for Rooms
router.post("/create-room", verifyToken, createRoom);
router.get("/fetch-rooms", verifyToken, fetchRooms);

export default router;
