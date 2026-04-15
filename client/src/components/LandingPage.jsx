import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaJs, FaPython, FaJava, FaHtml5, FaCss3Alt } from "react-icons/fa";
import { SiCplusplus } from "react-icons/si";

function LandingPage() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const icons = [FaJs, FaPython, FaJava, SiCplusplus, FaHtml5, FaCss3Alt];

  // 🌈 COLORS
  const colors = [
    "#facc15",
    "#3b82f6",
    "#ef4444",
    "#a855f7",
    "#22c55e",
    "#f97316",
    "#06b6d4",
  ];

  // 🔥 DROPS (generated once)
  const [drops] = useState(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      Icon: icons[i % icons.length],
    }))
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* 🔥 ICON RAIN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {drops.map((drop, i) => {
          const Icon = drop.Icon;

          return (
            <motion.div
              key={i}
              className="absolute text-3xl md:text-4xl opacity-80 drop-shadow-[0_0_8px_currentColor]"
              style={{
                left: `${drop.left}%`,
                color: drop.color,
              }}
              initial={{ y: -100 }}
              animate={{ y: "110vh" }}
              transition={{
                duration: drop.duration,
                delay: drop.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Icon />
            </motion.div>
          );
        })}
      </div>

      {/* 🔥 NAVBAR */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
              {"<>"}
            </div>
            <h1 className="text-lg font-semibold">
              Code Collaboration Platform
            </h1>
          </div>

          <div className="hidden md:flex gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition">
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition">
                Create Account
              </button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-xl"
          >
            ☰
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden bg-black/90 p-4 flex flex-col gap-3"
            >
              <Link to="/login">
                <button className="w-full py-2 bg-blue-600 rounded-lg">
                  Login
                </button>
              </Link>

              <Link to="/register">
                <button className="w-full py-2 bg-purple-600 rounded-lg">
                  Create Account
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🔥 HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative z-10">

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-6xl font-bold leading-tight"
        >
          Build. Code. <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Collaborate.
          </span>
        </motion.h1>

        <p className="mt-4 text-gray-400 max-w-md text-sm md:text-lg">
          Real-time collaboration platform for developers.
        </p>

        <div className="mt-6 flex gap-4">
          <Link to="/login">
            <button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition">
              Start Coding
            </button>
          </Link>

          <Link to="/register">
            <button className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition">
              Create Account
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;