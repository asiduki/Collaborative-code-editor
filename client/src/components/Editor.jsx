import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { language, cmtheme, data } from "../atoms";
import ACTIONS from "../actions/Actions";
import axios from "axios";
import Codemirror from "codemirror";

// Import all necessary CodeMirror assets
import "codemirror/lib/codemirror.css";
import "codemirror/theme/ayu-dark.css";
import "codemirror/theme/material.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

const Editor = ({ socketRef, roomId, onCodeChange, onOutputUpdate }) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const theme = useRecoilValue(cmtheme) || "dracula";
  const [codeData, setCodeData] = useRecoilState(data);
  const [processing, setProcessing] = useState(false);
  const skipEmit = useRef(false);

  // Effect for initializing the editor
  useEffect(() => {
    if (editorRef.current) return;

    const editorInstance = Codemirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: lang.value,
        theme: theme,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
        smartIndent: true,
        tabSize: 2,
        indentWithTabs: false,
      }
    );

    editorRef.current = editorInstance;
    editorInstance.setValue(codeData || "");

    editorInstance.on("change", (instance, change) => {
      // If the change is coming from a remote source, we skip emitting it back
      if (skipEmit.current) {
        skipEmit.current = false;
        return;
      }
      // Otherwise, handle local changes
      const newCode = instance.getValue();
      setCodeData(newCode); // Update React state on local change
      onCodeChange(newCode); // Propagate change to parent

      if (socketRef?.current) {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code: newCode,
        });
      }
    });
  }, []);

  // Effect for handling socket events
  useEffect(() => {
    if (!socketRef?.current) return;

    const handleCodeChange = ({ code }) => {
      if (code !== null && editorRef.current) {
        const currentCode = editorRef.current.getValue();
        if (code !== currentCode) {
          skipEmit.current = true; // Prevent this change from being re-emitted
          
          // Update the visual editor
          const cursor = editorRef.current.getCursor();
          editorRef.current.setValue(code);
          editorRef.current.setCursor(cursor);

          // ✅ **THE FIX IS HERE**
          // Update the React state (`codeData`) so the compile function has the latest code.
          setCodeData(code);
          onCodeChange(code); // Also update parent component's state
        }
      }
    };

    const handleUserJoined = ({ clients, username, socketId }) => {
      if (socketRef.current.id !== socketId) {
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: editorRef.current.getValue(),
          socketId,
        });
      }
    };

    // Attach listeners
    socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    socketRef.current.on(ACTIONS.JOINED, handleUserJoined);

    // Cleanup function to remove listeners
    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      socketRef.current?.off(ACTIONS.JOINED, handleUserJoined);
    };
  }, [socketRef.current, roomId, setCodeData, onCodeChange]);

  // Update language dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("mode", lang.value);
    }
  }, [lang]);

  // Update theme dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("theme", theme);
    }
  }, [theme]);

  // Compile handler
  const handleCompile = async () => {
    if (!codeData || !lang?.id) return;
    setProcessing(true);
    const formData = {
      language_id: lang.id,
      source_code: btoa(codeData), // This now reads the correct, updated code
    };
    const options = {
      method: "POST",
      url: import.meta.env.VITE_RAPID_API_URL,
      params: { base64_encoded: "true", fields: "*", wait: "true" },
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Host": import.meta.env.VITE_RAPID_API_HOST,
        "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY,
      },
      data: formData,
    };
    try {
      const response = await axios.request(options);
      onOutputUpdate?.(response.data);
    } catch (err) {
      onOutputUpdate?.({
        status: { id: 0, description: "Error" },
        stderr: btoa(err?.response?.data?.message || err.message),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <style>{`
        .CodeMirror {
          height: 100% !important;
          font-size: 14px;
          background-color: #0f172a;
          color: #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.75rem;
        }
      `}</style>
      <div className="flex flex-col w-full h-full bg-[#0f172a] text-white">
        <div className="flex justify-between items-center px-6 h-14 bg-[#1e293b] border-b border-gray-700">
          <div className="flex gap-4 text-sm">
            <span>
              Language:
              <span className="bg-blue-700 ml-2 px-2 py-1 rounded">
                {lang?.label || "N/A"}
              </span>
            </span>
            <span>
              Theme:
              <span className="bg-purple-700 ml-2 px-2 py-1 rounded">
                {theme}
              </span>
            </span>
          </div>
          <button
            onClick={handleCompile}
            disabled={processing || !codeData}
            className={`px-4 py-2 rounded-md font-semibold text-sm ${
              processing || !codeData
                ? "bg-green-700 opacity-50 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {processing ? "Running..." : "Compile ▶"}
          </button>
        </div>
        <div className="flex-1 p-2 overflow-hidden">
          <textarea id="realtimeEditor" className="w-full h-full" />
        </div>
      </div>
    </>
  );
};

export default Editor;
