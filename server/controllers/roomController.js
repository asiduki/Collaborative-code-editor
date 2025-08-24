import Room from "../models/RoomModel.js";


export const createRoom = async (req, res) => {
  const { roomId } = req.body;
  const createdBy = req.user?.username || "anonymous";

  if (!roomId || !createdBy) {
    return res.status(400).json({ msg: "Missing roomId or createdBy" });
  }

  try {
    const room = await Room.create({ roomId, createdBy });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ msg: "Failed to create room", error: error.message });
  }
};

export const fetchRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch rooms", error: error.message });
  }
};
