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
  // --- Refs (Mutable state for logic) ---
  const peersRef = useRef({}); 
  const localStreamRef = useRef(null); 
  const joinedRef = useRef(false); 
  
  // We use refs for media states to access them instantly inside async functions
  const isScreenSharingRef = useRef(false); 
  const isCamEnabledRef = useRef(false); 

  const pendingCandidatesRef = useRef({}); 
  
  // --- Audio Visualization Refs ---
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // --- State (UI) ---
  const [joined, setJoined] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const [devices, setDevices] = useState({ mics: [], speakers: [], cams: [] });
  const [selectedMic, setSelectedMicLocal] = useState("");
  const [selectedCam, setSelectedCam] = useState("");
  const [localLevel, setLocalLevel] = useState(0);

  const STUN_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ],
  };

  const log = (...args) => console.log("[VoiceChat]", ...args);

  // ==========================================
  // 1. Device Management
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
  // 2. Media Acquisition (Fixed Logic)
  // ==========================================
  
  /**
   * updateLocalMedia now accepts overrides to handle "Click -> State Change" instantly
   * without waiting for React render cycles.
   */
  const updateLocalMedia = async (overrides = {}) => {
    if (!joinedRef.current) return;

    try {
      // Determine strict state: Use override if present, otherwise fall back to Ref
      const targetScreen = overrides.hasOwnProperty('screen') ? overrides.screen : isScreenSharingRef.current;
      const targetVideo = overrides.hasOwnProperty('video') ? overrides.video : isCamEnabledRef.current;

      // 1. Define Constraints
      const constraints = {
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: targetScreen 
          ? false 
          : (targetVideo ? (selectedCam ? { deviceId: { exact: selectedCam } } : true) : false)
      };

      let newStream = null;

      // 2. Get Stream
      if (targetScreen) {
        newStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // 3. Handle "Stop Sharing" from Browser UI
      if (targetScreen) {
        const vidTrack = newStream.getVideoTracks()[0];
        if (vidTrack) {
          vidTrack.onended = () => {
            log("Screen share ended via browser UI");
            toggleScreenShare(false); 
          };
        }
      }

      // 4. Stop Old Tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      // 5. Update Refs & UI
      localStreamRef.current = newStream;
      onLocalStream?.(newStream);
      startLocalVAD(newStream);

      // Apply Mute
      newStream.getAudioTracks().forEach(t => t.enabled = !muted);

      // 6. Update Existing Peers (Seamless Track Replacement)
      const audioTrack = newStream.getAudioTracks()[0];
      const videoTrack = newStream.getVideoTracks()[0];

      for (const [peerId, pc] of Object.entries(peersRef.current)) {
        const senders = pc.getSenders();
        
        // Audio
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
        else if (audioTrack) pc.addTrack(audioTrack, newStream);

        // Video
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
            await videoSender.replaceTrack(videoTrack || null);
        } else if (videoTrack) {
            pc.addTrack(videoTrack, newStream);
        }
      }

    } catch (err) {
      console.error("Media Error:", err);
      // Revert state on failure
      if (overrides.screen) toggleScreenShare(false);
      if (overrides.video) toggleCamera(false);
      toast.error("Failed to access device");
    }
  };

  // Re-run when devices change
  useEffect(() => {
    if (joined) updateLocalMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMic, selectedCam]);

  // ==========================================
  // 3. VAD (Visualizer)
  // ==========================================
  const startLocalVAD = (stream) => {
    stopLocalVAD();
    if (!stream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
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
  // 4. WebRTC & Socket
  // ==========================================
  const createPeer = (peerId) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    
    const pc = new RTCPeerConnection(STUN_CONFIG);
    peersRef.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current.emit("voice-ice", { target: peerId, candidate: e.candidate });
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] || new MediaStream([ev.track]);
      onRemoteStreamsUpdate(prev => ({ ...prev, [peerId]: stream }));
    };

    pc.onnegotiationneeded = async () => {
       if (pc.signalingState !== "stable") return;
       try {
         const offer = await pc.createOffer();
         await pc.setLocalDescription(offer);
         socketRef.current.emit("voice-offer", { target: peerId, offer });
       } catch (e) {}
    };

    return pc;
  };

  // --- Socket Handlers ---
  const handleExisting = async ({ peers }) => {
    const myId = socketRef.current?.id;
    if (!myId) return;
    for (const peerId of peers) {
      if (myId > peerId) {
        createPeer(peerId); // We offer (handled by negotiationneeded or manually)
      } else {
        createPeer(peerId); // We answer
      }
    }
  };

  const handleOffer = async ({ from, offer }) => {
    const pc = createPeer(from);
    if (pc.signalingState !== "stable") return;
    await pc.setRemoteDescription(offer);
    
    if (pendingCandidatesRef.current[from]) {
      for (const c of pendingCandidatesRef.current[from]) await pc.addIceCandidate(c);
      delete pendingCandidatesRef.current[from];
    }

    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    socketRef.current.emit("voice-answer", { target: from, answer: ans });
  };

  const handleAnswer = async ({ from, answer }) => {
    const pc = peersRef.current[from];
    if (pc) await pc.setRemoteDescription(answer);
  };

  const handleIce = async ({ from, candidate }) => {
    const pc = peersRef.current[from];
    if (pc) await pc.addIceCandidate(candidate);
    else {
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
  };

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.on("voice-existing-peers", handleExisting);
    s.on("voice-offer", handleOffer);
    s.on("voice-answer", handleAnswer);
    s.on("voice-ice", handleIce);
    s.on("voice-peer-left", handlePeerLeft);
    s.on("voice-peer-joined", ({ socketId }) => createPeer(socketId));

    return () => {
      s.off("voice-existing-peers", handleExisting);
      s.off("voice-offer", handleOffer);
      s.off("voice-answer", handleAnswer);
      s.off("voice-ice", handleIce);
      s.off("voice-peer-left", handlePeerLeft);
      s.off("voice-peer-joined");
    };
  }, []);

  // ==========================================
  // 5. Actions (Fixed for responsiveness)
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

  // FIXED: Use direct argument passing for instant toggle
  const toggleCamera = async (forceState = null) => {
    if (isScreenSharingRef.current && forceState !== false) return toast.error("Stop screen share first");
    
    const next = forceState !== null ? forceState : !camEnabled;
    setCamEnabled(next);
    isCamEnabledRef.current = next; // Update ref immediately
    
    // Pass the new state explicitly
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
  // 6. Render (Compacted UI)
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
             {/* Mini Visualizer */}
             <div className="flex items-end gap-0.5 h-3">
                {[1,2,3].map(i => (
                    <div key={i} className="w-1 bg-green-500/80 rounded-sm"
                        style={{ height: localLevel * 5 > (i/3) ? '100%' : '20%' }} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact Device Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
         <select 
            value={selectedMic} 
            onChange={e => setSelectedMicLocal(e.target.value)}
            className="bg-[#161b22] border border-gray-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none truncate"
            title="Microphone"
         >
            {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Mic"}</option>)}
         </select>

         <select 
            value={selectedCam} 
            onChange={e => setSelectedCam(e.target.value)}
            className="bg-[#161b22] border border-gray-700 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none truncate"
            title="Camera"
         >
            {devices.cams.length === 0 && <option value="">No Cam</option>}
            {devices.cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Cam"}</option>)}
         </select>
      </div>

      {/* Compact Button Grid */}
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