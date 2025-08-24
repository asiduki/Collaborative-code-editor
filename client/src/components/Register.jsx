import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

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

  const username = watch("username");
  const password = watch("password");

  useEffect(() => {
    if (username) setUsernameError("");
  }, [username]);

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`http://localhost:5000/user/register`, data);
      if (res.status === 201) {
        // Auto login after register
        const loginRes = await axios.post(
          "http://localhost:5000/user/login",
          {
            username: data.username,
            password: data.password,
          },
          {
            withCredentials: true,
          }
        );

        if (loginRes.status === 200) {
          navigate(`/dashboard/${data.username}`);
        } 
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setUsernameError("Username already exists");
      } else {
        console.error("Registration failed:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-500 to-black">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-black via-gray-500 to-white items-center justify-center p-10 text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Join DevNest</h1>
            <p className="text-lg">
              Register to build, share, and collaborate on code effortlessly.
            </p>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Create your account
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div>
              <input
                id="username"
                type="text"
                {...register("username", {
                  required: "Username is required",
                  validate: {
                    lowercase: (value) =>
                      /^[a-z0-9]+$/.test(value) ||
                      "Only lowercase letters and numbers allowed",
                  },
                })}
                placeholder="Username"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
              {usernameError && (
                <p className="text-red-500 text-sm mt-1">{usernameError}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                placeholder="Password"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Confirm Password is required",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                placeholder="Confirm Password"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 bg-black  text-white font-semibold rounded-md transition duration-200 ${
                isSubmitting
                  ? "bg-gray-500 cursor-not-allowed"
                  : "hover:bg-white hover:text-black border border-black "
              }`}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-gray-700">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
