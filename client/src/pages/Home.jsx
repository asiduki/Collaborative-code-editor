import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  const [roomId, setRoomId] = useState("");

  const createNewRoom = () => {
    const id = uuidV4();
    setRoomId(id);
    toast.success("Room created");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room ID & username required");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: { username },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* 🔥 SAME SIDEBAR AS DASHBOARD */}
      <aside className="w-64 bg-[#111] border-r border-white/10 p-5 flex flex-col justify-between">

        <div>
          <h1 className="text-xl font-semibold mb-8">
            Code Collaboration Platform
          </h1>

          <div className="text-sm text-gray-400 space-y-2">
            <p className="text-white">Home</p>
            <p>Dashboard</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">@{username}</p>
      </aside>

      {/* 🔥 MAIN */}
      <main className="flex-1 flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          {/* HEADER */}
          <div className="mb-6">
            <h2 className="text-3xl font-semibold mb-2">
              Join a Room
            </h2>
            <p className="text-gray-400 text-sm">
              Enter room ID or create a new one
            </p>
          </div>

          {/* INPUT */}
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={(e) => e.code === "Enter" && joinRoom()}
            className="w-full px-4 py-3 mb-4 bg-[#111] border border-white/10 rounded-lg focus:border-blue-500 outline-none"
          />

          {/* BUTTONS */}
          <div className="flex gap-3">

            <button
              onClick={joinRoom}
              className="flex-1 py-3 bg-white text-black rounded-lg hover:opacity-90 transition"
            >
              Join Room
            </button>

            <button
              onClick={createNewRoom}
              className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition"
            >
              New Room
            </button>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;