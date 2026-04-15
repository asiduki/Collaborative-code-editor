// client/src/pages/EditorPage.jsx
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Editor from "../components/Editor";
import OutputWindow from "../components/OutputWindow";
import { language, cmtheme, username, data } from "../atoms";
import { useRecoilState, useRecoilValue } from "recoil";
import ACTIONS from "../actions/Actions";
import { initSocket } from "../socket";
import VoiceChat from "../components/VoiceChat";
import VideoPanel from "../components/VideoPanel";
import { useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import { languageOptions } from "../constants/languageOptions";
import axios from "axios";
import ConvertButton from "../components/ConvertButton";
import DualConverter from "../components/DualConverter";
import { detectLanguage } from "../utils/detectLanguage";


const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [them, setThem] = useRecoilState(cmtheme);
  const [codeData, setCodeData] = useRecoilState(data);
  const loggedUser = useRecoilValue(username);

  const [clients, setClients] = useState([]);
  const [outputDetails, setOutputDetails] = useState(null);
  const socketRef = useRef(null);
  const codeRef = useRef("");

  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Voice / Video
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState({});
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [localLevel, setLocalLevel] = useState(0);

  // Converted Code State
  const [convertedCode, setConvertedCode] = useState("");
  console.log(convertedCode);
  // Keep track of last detected language to avoid repeated setLang/toast spam
  const prevDetectedRef = useRef("");

  // Apply detected language safely (no spam)
  const applyDetected = (detected, showToast = true) => {
    if (!detected) return;
    if (prevDetectedRef.current === detected) return; // nothing changed

    const match = languageOptions.find((l) => l.value === detected);
    if (match) {
      setLang({ id: match.id, value: match.value });
      prevDetectedRef.current = detected;
      if (showToast) toast.success(`Language detected: ${match.label}`);
    } else {
      // If no exact mapping, optionally notify once
      if (showToast) toast("Could not precisely detect language — select manually.", { icon: "⚠️" });
    }
  };

  useEffect(() => {
    if (!them) setThem("dracula");
    // If lang not set, set a default (avoid uncontrolled value in <select>)
    if (!lang || !lang.value) {
      const defaultOpt = languageOptions[0];
      if (defaultOpt) setLang({ id: defaultOpt.id, value: defaultOpt.value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (!socketRef.current) {
          socketRef.current = await initSocket();
          socketRef.current.on("connect_error", handleErrors);
          socketRef.current.on("connect_failed", handleErrors);
        }
      } catch (err) {
        console.error("Socket init failed:", err);
      }

      function handleErrors() {
        toast.error("Socket connection failed.");
        navigate("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, socketId }) => {
        if (joinedUser !== location.state?.username) {
          toast.success(`${joinedUser} joined the room.`);
        }
        setClients(clients);

        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current || codeData || "",
          socketId,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((c) => c.socketId !== socketId));
      });

      // When receiving synced code from other clients: set code and detect language
      socketRef.current.on(ACTIONS.SYNC_CODE, ({ code }) => {
        codeRef.current = code;
        setCodeData(code);

        const detected = detectLanguage(code);
        applyDetected(detected, false); // don't show toast for remote continuous updates
      });
    };

    const fetchSavedCode = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/record/fetch`, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data.records.length > 0) {
          const latestCode = response.data.records[0].data;
          codeRef.current = latestCode;
          setCodeData(latestCode);

          // Detect language for loaded saved code (show toast)
          const detected = detectLanguage(latestCode);
          applyDetected(detected, true);

          toast.success("Loaded saved code.");
          if (socketRef.current) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, { code: latestCode, socketId: null });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Microphone Level Analyzer (unchanged)
  useEffect(() => {
    if (!localStream) {
      setLocalLevel(0);
      return;
    }

    let raf = null;
    let ctx = null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(localStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length) / 255;
        setLocalLevel(rms);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("local analyser failed", e);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ctx) ctx.close().catch(() => {});
    };
  }, [localStream]);

  // Handlers for dropdowns / theme
  const handleChangeLang = (e) => {
    const selectedLang = e.target.value;
    const selectedLangId = languageOptions.find((l) => l.value === selectedLang)?.id;
    if (selectedLangId) {
      setLang({ id: selectedLangId, value: selectedLang });
      prevDetectedRef.current = selectedLang; // accept manual selection as "previous"
    }
  };

  const handleChangeTheme = (e) => setThem(e.target.value);

  // Save, copy, logout, leave
  const saveCode = async () => {
    const formData = {
      username: location.state?.username,
      roomId,
      data: codeData,
    };
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/record/save`, formData, {
        withCredentials: true,
      });
      if (response.status === 201 || response.status === 200) toast.success("Code saved successfully.");
      else toast.error("Unexpected response.");
    } catch (err) {
      toast.error("Failed to save code.");
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

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/user/logout`, {}, { withCredentials: true });
      toast.success("Logged out.");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  const leaveRoom = () => navigate(`/dashboard/${loggedUser}`);

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-[18%] bg-[#0d1117] border-r border-gray-800 p-5 overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">💻</h1>
          <p className="text-sm text-gray-400">Collaborate & Code</p>
        </div>

        {socketRef.current && (
          <VoiceChat
            socketRef={socketRef}
            roomId={roomId}
            localUserName={location.state?.username}
            onLocalStream={(s) => setLocalStream(s)}
            onRemoteStreamsUpdate={(updater) => {
              if (typeof updater === "function") setRemoteStreamsMap((prev) => updater(prev));
              else setRemoteStreamsMap(updater);
            }}
            selectedSpeaker={selectedSpeaker}
            setSelectedSpeaker={setSelectedSpeaker}
          />
        )}

        {/* LANGUAGE + THEME */}
        <div className="mt-6">
          <label className="text-white text-sm font-medium">Language:</label>
          <select
            value={lang?.value || ""}
            onChange={handleChangeLang}
            className="w-full mb-4 px-3 py-2 rounded-md text-sm bg-[#1e293b]"
          >
            {languageOptions.map((l) => (
              <option key={l.id} value={l.value} className="text-black">
                {l.label}
              </option>
            ))}
          </select>

          <label className="text-white text-sm font-medium">Theme:</label>
          <select value={them} onChange={handleChangeTheme} className="w-full mb-6 px-3 py-2 rounded-md text-sm bg-[#1e293b]">
            <option value="material">material</option>
            <option value="dracula">dracula</option>
            <option value="ayu-dark">ayu-dark</option>
            <option value="monokai">monokai</option>
            <option value="nord">nord</option>
          </select>
          
       
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-3">
          <button className="bg-green-500 hover:bg-green-600 py-2 rounded text-sm font-semibold" onClick={saveCode}>
            📁 Save
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 py-2 rounded text-sm font-semibold" onClick={copyRoomId}>
            📋 Copy Room ID
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 py-2 rounded text-sm font-semibold" onClick={handleLogout}>
            🔓 Logout
          </button>
          <button className="bg-red-500 hover:bg-red-600 py-2 rounded text-sm font-semibold" onClick={leaveRoom}>
            🚪 Leave Room
          </button>
        </div>        

        {/* Connected Users */}
        <div className="mt-6">
          <h2 className="text-white text-sm font-medium mb-2">Connected Users:</h2>
          <ul className="text-white text-sm space-y-1">
            {clients.map((client) => (
              <li key={client.socketId}>🔹 {client.username}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex w-[82%] h-full">
        <div className="w-[65%] border-r border-gray-700">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
              setCodeData(code);

              // Auto-detect while typing, don't show toast for every keystroke
              const detected = detectLanguage(code);
              applyDetected(detected, false);
            }}
            onOutputUpdate={setOutputDetails}
          />
        </div>

        <div className="w-[35%] h-full overflow-hidden">
          <VideoPanel
            localStream={localStream}
            remoteStreamsMap={remoteStreamsMap}
            selectedSpeakerDeviceId={selectedSpeaker}
            localLevel={localLevel}
          />
          <OutputWindow outputDetails={outputDetails} />

          {/* Converted Code Panel */}
          {convertedCode && (
            <div className="bg-[#1e293b] mt-3 p-3 rounded border border-gray-700 overflow-auto max-h-[40%]">
              <h2 className="text-white font-medium mb-2">Converted Code</h2>
              <pre className="text-green-400 text-sm whitespace-pre-wrap">{convertedCode}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
