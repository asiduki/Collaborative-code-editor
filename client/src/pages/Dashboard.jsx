import React, { useEffect, useState } from "react";
import Form from "../components/Form";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const { username } = useParams();
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/user/logout`, null, {
        withCredentials: true,
      });
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/record/fetch-rooms`,
          { withCredentials: true }
        );
        setRooms(res.data);
      } catch {
        toast.error("Failed to load rooms");
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* 🔥 SIDEBAR */}
      <aside className="w-64 bg-[#111] border-r border-white/10 p-5 flex flex-col justify-between">

        <div>
          <h1 className="text-xl font-semibold mb-8">
            Code Collaboration Platform
          </h1>

          <button
            onClick={openModal}
            className="w-full py-2 bg-white text-black rounded-lg text-sm font-medium hover:opacity-80 transition"
          >
            + New Room
          </button>

          <div className="mt-8 space-y-2 text-sm text-gray-400">
            <p>Dashboard</p>
            <p>Rooms</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-3">@{username}</p>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 rounded-lg text-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 🔥 MAIN */}
      <main className="flex-1 p-8">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">
            Your Rooms
          </h2>
          <p className="text-gray-400 text-sm">
            Manage and access your collaboration rooms
          </p>
        </div>

        {/* ROOMS GRID */}
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
            <p className="text-lg">No rooms yet</p>
            <p className="text-sm">Create your first room</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {rooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => navigate(`/editor/${room.roomId}`)}
                className="p-5 rounded-xl bg-[#151515] hover:bg-[#1c1c1c] transition cursor-pointer border border-white/5"
              >
                <p className="text-sm text-gray-400 mb-1">
                  Created by {room.createdBy}
                </p>

                <h3 className="text-lg font-medium mb-3">
                  Room ID
                </h3>

                <p className="text-sm text-gray-500 break-all">
                  {room.roomId}
                </p>
              </div>
            ))}

          </div>
        )}
      </main>

      {/* 🔥 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#121212] p-6 rounded-xl w-full max-w-md border border-white/10">
            <button
              onClick={closeModal}
              className="float-right text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <Form />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;