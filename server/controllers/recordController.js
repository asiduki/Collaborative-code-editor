import RecordModel from "../models/RecordSchema.js";

export const fetchRecords = async (req, res) => {
  try {
    const user = req.user?.username;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized: User info missing" });
    }

    const records = await RecordModel.find({ username: user }).sort({ createdAt: -1 });
    res.status(200).json({ records });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

export const saveRecord = async (req, res) => {
  try {
    const { roomId, data } = req.body;
    const user = req.user?.username;

    if (!user) {
      return res.status(401).json({ msg: "Unauthorized: User info missing" });
    }
    if (!data || !roomId) {
      return res.status(400).json({ msg: "Missing data or roomId" });
    }

    const record = new RecordModel({ username: user, roomId, data });
    await record.save();

    res.status(201).json({ msg: "Saved successfully" });
  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
