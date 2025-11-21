import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

export default function VoiceChat({
  socketRef,
  roomId,
  localUserName,
  onLocalStream,
  onRemoteStreamsUpdate,
  selectedSpeaker,
  setSelectedSpeaker,
}) {
  // --- Refs ---
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const joinedRef = useRef(false);

  // Media State Refs (for instant access in async functions)
  const isScreenSharingRef = useRef(false);
  const isCamEnabledRef = useRef(false);

  // ICE Buffer (Stores candidates arriving before Remote Description is set)
  const pendingCandidatesRef = useRef({});

  // Audio Viz Refs
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // --- State ---
  const [joined, setJoined] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const [devices, setDevices] = useState({ mics: [], speakers: [], cams: [] });
  const [selectedMic, setSelectedMicLocal] = useState("");
  const [selectedCam, setSelectedCam] = useState("");
  const [localLevel, setLocalLevel] = useState(0);

  // ===========================================================
  // CRITICAL: TURN SERVER CONFIGURATION
  // ===========================================================
  const STUN_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      // UNCOMMENT AND ADD YOUR TURN CREDENTIALS FOR PRODUCTION:
      /*
      {
        urls: "turn:global.turn.metered.ca:80",
        username: "YOUR_USERNAME",
        credential: "YOUR_PASSWORD"
      }
      */
    ],
  };

  const log = (...args) => console.log("[VoiceChat]", ...args);

  // ==========================================
  // 1. Helper: Black Video Track (Fixes Frozen Frame)
  // ==========================================
  const createBlackVideoTrack = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 640, 480);
    // Capture at 1 FPS to save bandwidth
    const stream = canvas.captureStream(1);
    const track = stream.getVideoTracks()[0];
    track.enabled = true;
    return track;
  };

  // ==========================================
  // 2. Device Logic
  // ==========================================
  const refreshDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: all.filter((d) => d.kind === "audioinput"),
        speakers: all.filter((d) => d.kind === "audiooutput"),
        cams: all.filter((d) => d.kind === "videoinput"),
      });

      if (!selectedMic) {
        const def = all.find(d => d.kind === "audioinput" && d.deviceId === "default");
        if (def) setSelectedMicLocal(def.deviceId);
        else if (all.some(d => d.kind === "audioinput")) setSelectedMicLocal(all.find(d => d.kind === "audioinput").deviceId);
      }
      if (!selectedCam) {
        const def = all.find(d => d.kind === "videoinput");
        if (def) setSelectedCam(def.deviceId);
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
  }, []);

  // ==========================================
  // 3. Media Acquisition
  // ==========================================
  const updateLocalMedia = async (overrides = {}) => {
    if (!joinedRef.current) return;

    try {
      const targetScreen = overrides.hasOwnProperty('screen') ? overrides.screen : isScreenSharingRef.current;
      const targetVideo = overrides.hasOwnProperty('video') ? overrides.video : isCamEnabledRef.current;

      const constraints = {
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: targetScreen 
          ? false 
          : (targetVideo ? (selectedCam ? { deviceId: { exact: selectedCam } } : true) : false)
      };

      let newStream = null;
      if (targetScreen) {
        newStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // Handle browser "Stop Sharing" UI
      if (targetScreen) {
        const vidTrack = newStream.getVideoTracks()[0];
        if (vidTrack) {
          vidTrack.onended = () => {
            log("Screen share stopped via browser");
            toggleScreenShare(false); 
          };
        }
      }

      // FIX: If Video is OFF, inject a Black Track instead of nothing.
      // This forces the remote video element to render black pixels instead of freezing.
      if (!targetScreen && !targetVideo) {
        const blackTrack = createBlackVideoTrack();
        newStream.addTrack(blackTrack);
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      localStreamRef.current = newStream;
      onLocalStream?.(newStream);
      startLocalVAD(newStream);

      // Apply Mute
      newStream.getAudioTracks().forEach(t => t.enabled = !muted);

      // Update Peers
      const audioTrack = newStream.getAudioTracks()[0];
      const videoTrack = newStream.getVideoTracks()[0];

      for (const pc of Object.values(peersRef.current)) {
        const senders = pc.getSenders();
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
        else if (audioTrack) pc.addTrack(audioTrack, newStream);

        if (videoSender) await videoSender.replaceTrack(videoTrack || null);
        else if (videoTrack) pc.addTrack(videoTrack, newStream);
      }

    } catch (err) {
      console.error("Media Error", err);
      if (overrides.screen) toggleScreenShare(false);
      if (overrides.video) toggleCamera(false);
      toast.error("Could not start video/audio");
    }
  };

  useEffect(() => {
    if (joined) updateLocalMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMic, selectedCam]);

  // ==========================================
  // 4. VAD (Visualizer)
  // ==========================================
  const startLocalVAD = (stream) => {
    stopLocalVAD();
    if (!stream) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        setLocalLevel(Math.sqrt(sum / data.length) / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      analyserRef.current = { ctx, analyser };
    } catch (e) {}
  };

  const stopLocalVAD = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (analyserRef.current) analyserRef.current.ctx.close().catch(() => {});
    analyserRef.current = null;
    setLocalLevel(0);
  };

  // ==========================================
  // 5. WebRTC Core
  // ==========================================
  const createPeer = (peerId, initiator = false) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    
    const pc = new RTCPeerConnection(STUN_CONFIG);
    peersRef.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("voice-ice", { target: peerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] || new MediaStream([ev.track]);
      onRemoteStreamsUpdate(prev => ({ ...prev, [peerId]: stream }));
    };

    pc.onnegotiationneeded = async () => {
       // If Loser, block auto-offer to prevent Glare
       if (!initiator && pc.signalingState === "stable" && !pc.remoteDescription) {
         return; 
       }

       if (pc.signalingState !== "stable") return;
       
       try {
         const offer = await pc.createOffer();
         await pc.setLocalDescription(offer);
         socketRef.current.emit("voice-offer", { target: peerId, offer });
       } catch (e) { console.error("Negotiation failed", e); }
    };

    return pc;
  };

  // --- Signaling Handlers ---
  const handleExisting = ({ peers }) => {
    const myId = socketRef.current?.id;
    if (!myId) return;
    peers.forEach(peerId => {
      if (myId > peerId) {
        createPeer(peerId, true); // Winner = Initiator
      } else {
        createPeer(peerId, false); // Loser = Passive
      }
    });
  };

  const handlePeerJoined = ({ socketId }) => {
    const myId = socketRef.current?.id;
    if (!myId) return;
    if (myId > socketId) {
      createPeer(socketId, true);
    } else {
      createPeer(socketId, false);
    }
  };

  const handleOffer = async ({ from, offer }) => {
    const pc = createPeer(from, false);
    await pc.setRemoteDescription(offer);
    
    if (pendingCandidatesRef.current[from]) {
      for (const c of pendingCandidatesRef.current[from]) {
        await pc.addIceCandidate(c).catch(e => console.warn(e));
      }
      delete pendingCandidatesRef.current[from];
    }

    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    socketRef.current.emit("voice-answer", { target: from, answer: ans });
  };

  const handleAnswer = async ({ from, answer }) => {
    const pc = peersRef.current[from];
    if (pc) {
      await pc.setRemoteDescription(answer);
      if (pendingCandidatesRef.current[from]) {
        for (const c of pendingCandidatesRef.current[from]) {
           await pc.addIceCandidate(c).catch(e => console.warn(e));
        }
        delete pendingCandidatesRef.current[from];
      }
    }
  };

  const handleIce = async ({ from, candidate }) => {
    const pc = peersRef.current[from];
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(candidate).catch(e => console.warn(e));
    } else {
      if (!pendingCandidatesRef.current[from]) pendingCandidatesRef.current[from] = [];
      pendingCandidatesRef.current[from].push(candidate);
    }
  };

  const handlePeerLeft = ({ socketId }) => {
    if (peersRef.current[socketId]) peersRef.current[socketId].close();
    delete peersRef.current[socketId];
    onRemoteStreamsUpdate(prev => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
    toast(`${socketId.slice(0,4)} left`);
  };

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.on("voice-existing-peers", handleExisting);
    s.on("voice-peer-joined", handlePeerJoined);
    s.on("voice-offer", handleOffer);
    s.on("voice-answer", handleAnswer);
    s.on("voice-ice", handleIce);
    s.on("voice-peer-left", handlePeerLeft);

    return () => {
      s.off("voice-existing-peers", handleExisting);
      s.off("voice-peer-joined", handlePeerJoined);
      s.off("voice-offer", handleOffer);
      s.off("voice-answer", handleAnswer);
      s.off("voice-ice", handleIce);
      s.off("voice-peer-left", handlePeerLeft);
    };
  }, []);

  // ==========================================
  // 6. Actions
  // ==========================================
  const joinVoice = async () => {
    joinedRef.current = true; 
    await updateLocalMedia();
    socketRef.current.emit("join-voice", { roomId, userName: localUserName });
    setJoined(true);
  };

  const leaveVoice = () => {
    joinedRef.current = false;
    setJoined(false);
    socketRef.current.emit("leave-voice", { roomId });
    
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
    }
    onLocalStream(null);
    stopLocalVAD();
    
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    onRemoteStreamsUpdate({});
    
    setCamEnabled(false);
    isCamEnabledRef.current = false;
    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !next);
    }
  };

  const toggleCamera = async (forceState = null) => {
    if (isScreenSharingRef.current && forceState !== false) return toast.error("Stop screen share first");
    const next = forceState !== null ? forceState : !camEnabled;
    setCamEnabled(next);
    isCamEnabledRef.current = next;
    await updateLocalMedia({ video: next });
  };

  const toggleScreenShare = async (forceState = null) => {
    const next = forceState !== null ? forceState : !isScreenSharing;
    setIsScreenSharing(next);
    isScreenSharingRef.current = next;
    if (next) {
      setCamEnabled(false);
      isCamEnabledRef.current = false;
    }
    await updateLocalMedia({ screen: next, video: false });
  };

  // ==========================================
  // 7. Render
  // ==========================================
  return (
    <div className="mt-4 p-3 bg-[#0d1117] border-t border-b border-gray-800 text-xs text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <span>🎙️</span> Voice & Video
        </h3>
        {joined && (
          <div className="flex items-center gap-2 bg-[#161b22] px-2 py-1 rounded border border-gray-800">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <div className="flex items-end gap-0.5 h-3">
                {[1,2,3].map(i => (
                    <div key={i} className="w-1 bg-green-500/80 rounded-sm"
                        style={{ height: localLevel * 5 > (i/3) ? '100%' : '20%' }} />
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
         <select 
            value={selectedMic} 
            onChange={e => setSelectedMicLocal(e.target.value)}
            className="bg-[#161b22] border border-gray-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none truncate"
         >
            {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Mic"}</option>)}
         </select>
         <select 
            value={selectedCam} 
            onChange={e => setSelectedCam(e.target.value)}
            className="bg-[#161b22] border border-gray-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none truncate"
         >
            {devices.cams.length === 0 && <option value="">No Cam</option>}
            {devices.cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Cam"}</option>)}
         </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!joined ? (
          <button onClick={joinVoice} className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded font-medium transition-all">
            Join Room
          </button>
        ) : (
          <>
            <button onClick={toggleMute} className={`py-1.5 rounded font-medium transition-all border border-transparent ${muted ? "bg-red-900/30 text-red-400 border-red-800" : "bg-gray-800 hover:bg-gray-700"}`}>
              {muted ? "Unmute" : "Mute"}
            </button>
            <button onClick={leaveVoice} className="bg-red-600 hover:bg-red-700 text-white py-1.5 rounded font-medium transition-all">
              Leave
            </button>
            <button onClick={() => toggleCamera()} disabled={isScreenSharing} className={`py-1.5 rounded font-medium transition-all ${camEnabled ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-gray-800 hover:bg-gray-700"}`}>
              {camEnabled ? "Stop Video" : "Video"}
            </button>
            <button onClick={() => toggleScreenShare()} className={`py-1.5 rounded font-medium transition-all ${isScreenSharing ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "bg-gray-800 hover:bg-gray-700"}`}>
              {isScreenSharing ? "Stop Share" : "Share"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

VoiceChat.propTypes = {
  socketRef: PropTypes.object.isRequired,
  roomId: PropTypes.string.isRequired,
  localUserName: PropTypes.string,
  onLocalStream: PropTypes.func,
  onRemoteStreamsUpdate: PropTypes.func,
  selectedSpeaker: PropTypes.string,
  setSelectedSpeaker: PropTypes.func,
};