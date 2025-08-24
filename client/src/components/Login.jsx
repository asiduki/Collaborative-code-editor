import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");


  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/user/login",
        {
          username: data.username,
          password: data.password,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        navigate(`/dashboard/${data.username}`);
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      setLoginError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-gray-700 to-black">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel - Info */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-gray-500 via-gray-700 to-black items-center justify-center p-10 text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-lg">
              Collaborate, code, and conquer with DevNest.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Login</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <input
                id="username"
                type="text"
                placeholder="Username"
                {...register("username", { required: "Username is required" })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

            {/* Error */}
            {loginError && (
              <p className="text-red-600 font-medium text-sm">{loginError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full hover:bg-white hover:text-black border border-black bg-black text-white py-2 rounded-md  transition duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-700">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
