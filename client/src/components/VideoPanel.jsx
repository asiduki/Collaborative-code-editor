import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * VideoPlayer Component
 * Isolated to prevent re-renders from parent props (like audio levels)
 * from resetting the video element srcObject/ref.
 */
const VideoPlayer = ({ stream, isLocal = false, onLoadedMetadata }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Handle stream assignment
    if (stream) {
      el.srcObject = stream;
      el.autoplay = true;
      el.playsInline = true;
      el.muted = true; // Always mute the video element (audio handled separately or is local)
      
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Video playback failed autostart:", error);
        });
      }
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      style={{
        width: "100%",
        height: 140,
        objectFit: "cover",
        background: "black",
        transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video
      }}
      onLoadedMetadata={onLoadedMetadata}
    />
  );
};

VideoPlayer.propTypes = {
  stream: PropTypes.object,
  isLocal: PropTypes.bool,
  onLoadedMetadata: PropTypes.func,
};

/**
 * Main VideoPanel
 */
export default function VideoPanel({
  localStream,
  remoteStreamsMap = {},
  selectedSpeakerDeviceId, // Used in parent, but VideoPanel relies on VoiceChat for actual audio output
  localLevel = 0,
}) {
  const remoteAudioRefs = useRef({});
  const [remotePlayBlocked, setRemotePlayBlocked] = useState({});
  const [floatingId, setFloatingId] = useState(null);
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 20 });
  const [isLocalMuted, setIsLocalMuted] = useState(false);

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  // --- Audio Element Management for Remote Streams ---
  // We keep this logic here to ensure audio plays even if video UI re-renders
  const ensureRemoteAudio = async (peerId, stream) => {
    if (!stream) return;
    
    // If audio tracks exist, handle the audio element
    if (stream.getAudioTracks().length > 0) {
      let audioEl = remoteAudioRefs.current[peerId];
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.style.display = "none"; // Hidden audio
        document.body.appendChild(audioEl);
        remoteAudioRefs.current[peerId] = audioEl;
      }

      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
        if (selectedSpeakerDeviceId && typeof audioEl.setSinkId === "function") {
           audioEl.setSinkId(selectedSpeakerDeviceId).catch(e => console.warn(e));
        }
        try {
          await audioEl.play();
          setRemotePlayBlocked(prev => {
            const copy = { ...prev };
            delete copy[peerId];
            return copy;
          });
        } catch (err) {
          console.warn("Audio autoplay blocked", peerId);
          setRemotePlayBlocked(prev => ({ ...prev, [peerId]: true }));
        }
      }
    }
  };

  // Sync audio elements when streams change
  useEffect(() => {
    Object.entries(remoteStreamsMap).forEach(([peerId, stream]) => {
      ensureRemoteAudio(peerId, stream);
    });

    // Cleanup removed peers
    Object.keys(remoteAudioRefs.current).forEach((peerId) => {
      if (!remoteStreamsMap[peerId]) {
        const a = remoteAudioRefs.current[peerId];
        if (a) {
          a.pause();
          a.srcObject = null;
          a.remove();
        }
        delete remoteAudioRefs.current[peerId];
      }
    });
  }, [remoteStreamsMap, selectedSpeakerDeviceId]);

  // --- Dragging Logic ---
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      setFloatingPos({
        x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => (dragRef.current.dragging = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e) => {
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.origX = floatingPos.x;
    dragRef.current.origY = floatingPos.y;
  };

  const toggleLocalMute = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const next = !isLocalMuted;
      audioTracks.forEach(t => t.enabled = !next);
      setIsLocalMuted(next);
    }
  };

  const resumeRemotePlayback = async (peerId) => {
    const a = remoteAudioRefs.current[peerId];
    if (a) {
      try {
        await a.play();
        setRemotePlayBlocked(prev => {
          const copy = { ...prev };
          delete copy[peerId];
          return copy;
        });
      } catch(e) { console.warn(e); }
    }
  };

  const remoteIds = Object.keys(remoteStreamsMap);

  return (
    <div className="w-full p-2">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "start",
        }}
      >
        {/* Local Tile */}
        <div className="relative bg-[#0b1220] rounded overflow-hidden border border-gray-800" style={{ minHeight: 140 }}>
          {/* Separate component ensures ref doesn't reset on parent re-render */}
          <VideoPlayer stream={localStream} isLocal={true} />
          
          <div style={{ position: "absolute", left: 8, bottom: 8, color: "#cbd5e1", fontSize: 12, textShadow: "0 1px 2px black" }}>You</div>
          
          {/* Audio Meter Bubble */}
          <div style={{ position: "absolute", right: 8, bottom: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                boxShadow: localLevel > 0.07 ? "0 0 12px #10b981" : "none",
                background: localLevel > 0.07 ? "#10b981" : "#374151",
                transition: "box-shadow 100ms linear, background 100ms linear",
              }}
            />
          </div>

          <div style={{ position: "absolute", left: 8, top: 8 }}>
            <button
              onClick={toggleLocalMute}
              className={`p-1.5 rounded text-xs text-white border-none cursor-pointer ${isLocalMuted ? "bg-amber-500" : "bg-sky-500"}`}
            >
              {isLocalMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* Remote Tiles */}
        {remoteIds.map((peerId) => (
          <div key={peerId} className="relative bg-[#0b1220] rounded overflow-hidden border border-gray-800" style={{ minHeight: 140 }}>
            <VideoPlayer stream={remoteStreamsMap[peerId]} />
            
            <div style={{ position: "absolute", left: 8, bottom: 8, color: "#cbd5e1", fontSize: 12, textShadow: "0 1px 2px black" }}>{peerId}</div>
            
            <div style={{ position: "absolute", right: 8, top: 8 }}>
              <button
                onClick={() => setFloatingId(peerId)}
                className="text-xs bg-gray-900 text-white px-2 py-1 rounded border border-gray-700 hover:bg-gray-700"
              >
                Float
              </button>
            </div>

            {remotePlayBlocked[peerId] && (
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <button
                  onClick={() => resumeRemotePlayback(peerId)}
                  className="text-xs bg-emerald-500 text-white px-3 py-2 rounded"
                >
                  Tap for Audio
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Window */}
      {floatingId && remoteStreamsMap[floatingId] && (
        <div
          onMouseDown={startDrag}
          style={{
            position: "fixed",
            left: floatingPos.x,
            top: floatingPos.y,
            zIndex: 9999,
            width: 260,
            background: "rgba(13, 17, 23, 0.95)",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #30363d",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            cursor: "move",
          }}
        >
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-300 truncate w-32">{floatingId}</span>
            <button onClick={() => setFloatingId(null)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Close</button>
          </div>
          
          <div className="rounded overflow-hidden bg-black h-[150px]">
             <VideoPlayer stream={remoteStreamsMap[floatingId]} />
          </div>
        </div>
      )}
    </div>
  );
}

VideoPanel.propTypes = {
  localStream: PropTypes.object,
  remoteStreamsMap: PropTypes.object,
  selectedSpeakerDeviceId: PropTypes.string,
  localLevel: PropTypes.number,
};