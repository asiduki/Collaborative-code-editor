import Room from "../models/RoomModel.js";

export const createRoom = async (req, res) => {
  const { roomId } = req.body;
  const createdBy = req.user?.username || "anonymous";

  if (!roomId) {
    return res.status(400).json({ msg: "Missing roomId" });
  }

  try {
    // 🔥 CHECK FIRST
    const existingRoom = await Room.findOne({ roomId });

    if (existingRoom) {
      return res.status(200).json(existingRoom); // ✅ already exists
    }

    const room = await Room.create({ roomId, createdBy });

    res.status(201).json(room);
  } catch (error) {
    console.error("❌ Create Room Error:", error.message);
    res.status(500).json({ msg: "Failed to create room" });
  }
};
export const fetchRooms = async (req, res) => {
  try {
    const user = req.user?.username;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized user" });
    }

    const rooms = await Room.find({ createdBy: user }).sort({ createdAt: -1 });
    res.status(200).json(rooms);
  } catch (error) {
    console.error("❌ Fetch Rooms Error:", error);
    res.status(500).json({ msg: "Failed to fetch rooms" });
  }
};
