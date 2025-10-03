import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Editor from "../components/Editor";
import OutputWindow from "../components/OutputWindow";
import { language, cmtheme, username, data } from "../atoms";
import { useRecoilState, useRecoilValue } from "recoil";
import ACTIONS from "../actions/Actions";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import { languageOptions } from "../constants/languageOptions";
import axios from "axios";

const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [them, setThem] = useRecoilState(cmtheme);
  const [codeData, setCodeData] = useRecoilState(data);
  const user = useRecoilValue(username);
  const [clients, setClients] = useState([]);
  const [outputDetails, setOutputDetails] = useState(null);
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!them) setThem("dracula");
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!socketRef.current) {
        socketRef.current = await initSocket();
        socketRef.current.on("connect_error", handleErrors);
        socketRef.current.on("connect_failed", handleErrors);
      }

      function handleErrors(e) {
        toast.error("Socket connection failed.");
        navigate("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username: joinedUser, socketId }) => {
          if (joinedUser !== location.state?.username) {
            toast.success(`${joinedUser} joined the room.`);
          }
          setClients(clients);

          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current || codeData || "",
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });

      socketRef.current.on(ACTIONS.SYNC_CODE, ({ code }) => {
        codeRef.current = code;
        setCodeData(code);
      });
    };

    const fetchSavedCode = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/record/fetch`,
          {
            withCredentials: true,
          }
        );

        if (response.status === 200 && response.data.records.length > 0) {
          const latestCode = response.data.records[0].data;
          codeRef.current = latestCode;
          setCodeData(latestCode);
          toast.success("Loaded saved code.");

          if (socketRef.current) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: latestCode,
              socketId: null,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching saved code:", err);
      }
    };

    init().then(() => fetchSavedCode());

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.SYNC_CODE);
      }
    };
  }, []);

  const handleChangeLang = (e) => {
    const selectedLang = e.target.value;
    const selectedLangId = languageOptions.find(
      (l) => l.value === selectedLang
    )?.id;
    if (selectedLangId) {
      setLang({ id: selectedLangId, value: selectedLang });
    }
  };

  const handleChangeTheme = (e) => {
    setThem(e.target.value);
  };

  const saveCode = async () => {
    const formData = {
      username: location.state?.username,
      roomId,
      data: codeData,
    };
    debugger;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/record/save`,
        formData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Code saved successfully.");
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in.");
        navigate("/login");
      } else {
        toast.error("Failed to save code.");
      }
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied.");
    } catch (err) {
      toast.error("Failed to copy Room ID.");
    }
  };

  // ✅ FIXED: Corrected logout endpoint
  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/user/logout`,
        {},
        { withCredentials: true }
      );
      toast.success("Logged out successfully.");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed.");
      console.error("Logout error:", err);
    }
  };

  const leaveRoom = async () => {
    try {
      navigate(`/dashboard/${username}`);
    } catch (err) {
      console.error("Leave room logout error:", err);
    }
  };

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      <div className="w-[18%] bg-[#0d1117] border-r border-gray-800 p-5 overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">💻 DevNest</h1>
          <p className="text-sm text-gray-400">Collaborate & Code</p>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {user?.charAt(0).toUpperCase()}
          </div>
          <p className="text-white font-semibold mt-2">{user}</p>
        </div>

        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-1 block">
            Language:
          </label>
          <select
            value={lang.value}
            onChange={handleChangeLang}
            className="w-full mb-4 px-3 py-2 rounded-md text-sm bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.map((l, id) => (
              <option key={id} value={l.value} className="text-black">
                {l.label}
              </option>
            ))}
          </select>

          <label className="text-white text-sm font-medium mb-1 block">
            Theme:
          </label>
          <select
            value={them}
            onChange={handleChangeTheme}
            className="w-full mb-6 px-3 py-2 rounded-md text-sm bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="material">material</option>
            <option value="dracula">dracula</option>
            <option value="ayu-dark">ayu-dark</option>
            <option value="monokai">monokai</option>
            <option value="nord">nord</option>
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="bg-green-500 hover:bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold"
            onClick={saveCode}
          >
            📁 Save
          </button>

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold"
            onClick={copyRoomId}
          >
            📋 Copy Room ID
          </button>

          <button
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold"
            onClick={handleLogout}
          >
            🔓 Logout
          </button>

          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold"
            onClick={leaveRoom}
          >
            🚪 Leave (Logout)
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-white text-sm font-medium mb-2">
            Connected Users:
          </h2>
          <ul className="text-white text-sm space-y-1">
            {clients.map((client) => (
              <li key={client.socketId} className="truncate">
                🔹 {client.username}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-[82%] h-full">
        <div className="w-[65%] border-r border-gray-700">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
              setCodeData(code);
            }}
            onOutputUpdate={setOutputDetails}
          />
        </div>

        <div className="w-[35%] h-full overflow-hidden">
          <OutputWindow outputDetails={outputDetails} />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
