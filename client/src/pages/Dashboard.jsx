import React, { useEffect, useState } from "react";
import Form from "../components/Form";
import { useParams, useNavigate, useNavigate as useHistory } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const { username } = useParams();
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/user/logout", null, {
        withCredentials: true,
      });
      toast.success("Logged out");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };

  // Fetch rooms from backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:5000/record/fetch-rooms", {
          withCredentials: true,
        });
        setRooms(res.data);
      } catch (err) {
        toast.error("Failed to load rooms");
        console.error("Room fetch error:", err);
      }
    };

    fetchRooms();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white">
      {/* Navbar */}
      <nav className="bg-[#181818] border-b border-gray-800 p-4 px-8 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="DevNestLogo"
            className="w-10 h-10 hover:scale-110 transition"
          />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            DevNest
          </h1>
        </div>
        <div className="flex items-center space-x-6">
          <p className="text-lg font-semibold text-gray-300">
            Logged in as: <span className="text-white">{username}</span>
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Welcome Message */}
      <section className="max-w-6xl mx-auto mt-12 px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome back, <span className="text-cyan-400">{username}</span> 👋
        </h2>
        <p className="text-gray-400 text-lg">
          Collaborate and build projects in real-time.
        </p>

        {/* Create / Join Button */}
        <div className="mt-8">
          <button
            onClick={openModal}
            className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-6 py-2 rounded-lg font-medium hover:scale-105 transition"
          >
            + Create / Join Room
          </button>
        </div>
      </section>

      {/* Room Cards */}
      <section className="max-w-6xl mx-auto mt-10 px-6 pb-20">
        {rooms.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center">
            No rooms available. Start one now!
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => navigate(`/editor/${room.roomId}`)}
                className="bg-[#252525] p-6 rounded-lg shadow hover:shadow-lg border border-gray-700 transition-all cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">
                  🔧 Room by {room.createdBy}
                </h3>
                <p className="text-gray-400">
                  <span className="font-medium text-gray-300">Room ID:</span>{" "}
                  {room.roomId}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="relative bg-black p-8 rounded-lg shadow-lg max-w-md w-full">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3  text-red-500 text-2xl font-bold"
            >
              ×
            </button>
            <Form />
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;
