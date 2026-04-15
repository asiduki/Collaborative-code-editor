import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaJs, FaPython, FaJava, FaHtml5, FaCss3Alt } from "react-icons/fa";
import { SiCplusplus } from "react-icons/si";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const icons = [FaJs, FaPython, FaJava, SiCplusplus, FaHtml5, FaCss3Alt];

  const colors = [
    "#facc15",
    "#3b82f6",
    "#ef4444",
    "#a855f7",
    "#22c55e",
    "#f97316",
  ];

  const [drops] = useState(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      Icon: icons[i % icons.length],
    }))
  );

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        data,
        { withCredentials: true }
      );

      if (res.status === 200) {
        navigate(`/dashboard/${data.username}`);
      }
    } catch {
      setLoginError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden">

      {/* 🔥 ICON RAIN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {drops.map((drop, i) => {
          const Icon = drop.Icon;
          return (
            <motion.div
              key={i}
              className="absolute text-3xl opacity-70 drop-shadow-[0_0_8px_currentColor]"
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

      {/* 🔥 LEFT SIDE (BRANDING) */}
      <div className="hidden md:flex w-1/2 items-center justify-center z-10">
        <div className="text-center px-10">
          <h1 className="text-5xl font-bold mb-4">
            {"<Code Collaboration "}
          <br/>
          {"Platform />"}
          </h1>
          <p className="text-gray-400 text-lg">
            Code together. Build faster. Collaborate smarter.
          </p>
        </div>
      </div>

      {/* 🔥 RIGHT SIDE (FORM) */}
      <div className="w-full md:w-1/2 flex items-center justify-center z-10 px-6">

        <div className="w-full max-w-sm">

          <h2 className="text-2xl font-semibold mb-2">
            Welcome back 👋
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Login to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* USERNAME */}
            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                {...register("username", { required: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", { required: true })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:underline">
              Create Account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;