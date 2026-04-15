import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function Form() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [roomId, setRoomId] = useState("");

  const createNewRoom = () => {
    const id = uuidV4();
    setRoomId(id);
    toast.success("New room created");
  };

  const joinRoom = async () => {
    if (!roomId || !username) {
      toast.error("Room ID & username required");
      return;
    }

    try {
      // 🔥 SAVE ROOM TO DATABASE
      await axios.post(
        `${import.meta.env.VITE_API_URL}/record/create-room`,
        { roomId },
        { withCredentials: true },
      );

      toast.success("Joined room");

      navigate(`/editor/${roomId}`, {
        state: { username },
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to join room");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 🔥 TITLE */}
      <div>
        <h2 className="text-xl font-semibold">Create or Join Room</h2>
        <p className="text-sm text-gray-400 mt-1">
          Enter a room ID or generate a new one
        </p>
      </div>

      {/* 🔥 INPUT */}
      <div className="relative">
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={(e) => e.code === "Enter" && joinRoom()}
          className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg focus:border-blue-500 outline-none text-sm"
        />

        {/* Auto fill button */}
        <button
          onClick={createNewRoom}
          className="absolute right-2 top-2 text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md transition"
        >
          Generate
        </button>
      </div>

      {/* 🔥 ACTION */}
      <button
        onClick={joinRoom}
        className="w-full py-3 bg-white text-black rounded-lg font-medium hover:opacity-90 transition"
      >
        Continue →
      </button>

      {/* 🔥 HINT */}
      <p className="text-xs text-gray-500 text-center">
        Share your room ID with your team to collaborate
      </p>
    </div>
  );
}

export default Form;
