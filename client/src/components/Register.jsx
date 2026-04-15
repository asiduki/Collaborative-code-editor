import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaJs, FaPython, FaJava, FaHtml5, FaCss3Alt } from "react-icons/fa";
import { SiCplusplus } from "react-icons/si";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const password = watch("password");

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
        `${import.meta.env.VITE_API_URL}/user/register`,
        data
      );

      if (res.status === 201) {
        const loginRes = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/login`,
          {
            username: data.username,
            password: data.password,
          },
          { withCredentials: true }
        );

        if (loginRes.status === 200) {
          navigate(`/dashboard/${data.username}`);
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setUsernameError("Username already exists");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden">

      {/* 🌧️ ICON RAIN */}
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

      {/* 🔥 LEFT SIDE */}
      <div className="hidden md:flex w-1/2 items-center justify-center z-10">
        <div className="text-center px-10">
          <h1 className="text-5xl font-bold mb-4">
            {"<Code Collaboration "}
          <br/>
          {"Platform />"}
          </h1>
          <p className="text-gray-400 text-lg">
            Start your journey. Build something amazing 🚀
          </p>
        </div>
      </div>

      {/* 🔥 RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center z-10 px-6">

        <div className="w-full max-w-sm">

          <h2 className="text-2xl font-semibold mb-2">
            Create Account ✨
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Join DevNest and start coding
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* USERNAME */}
            <input
              type="text"
              placeholder="Username"
              {...register("username", {
                required: "Username required",
                pattern: {
                  value: /^[a-z0-9]+$/,
                  message: "Lowercase & numbers only",
                },
              })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 outline-none"
            />

            {errors.username && (
              <p className="text-red-400 text-xs">
                {errors.username.message}
              </p>
            )}
            {usernameError && (
              <p className="text-red-400 text-xs">{usernameError}</p>
            )}

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
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

            {/* CONFIRM PASSWORD */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-3"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-red-400 text-xs">
                {errors.confirmPassword.message}
              </p>
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
              {isSubmitting ? "Creating..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;