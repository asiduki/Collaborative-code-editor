import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { language, cmtheme, data } from "../atoms";
import ACTIONS from "../actions/Actions";
import axios from "axios";
import Codemirror from "codemirror";
import { languageOptions } from "../constants/languageOptions";

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

const CONVERT_LANGUAGES = [
  "python",
  "java",
  "c++",
  "javascript",
  "typescript",
  "go",
  "rust",
  "kotlin",
  "swift",
];

const Editor = ({
  socketRef,
  roomId,
  onCodeChange,
  onOutputUpdate,
  onAiOutput,
}) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const theme = useRecoilValue(cmtheme) || "dracula";
  const [codeData, setCodeData] = useRecoilState(data);
  const [processing, setProcessing] = useState(false);
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [fromLang, setFromLang] = useState("javascript");
  const [toLang, setToLang] = useState("python");
  const [converting, setConverting] = useState(false);
  const skipEmit = useRef(false);
  const currentLangLabel =
    languageOptions.find((l) => l.value === lang.value)?.label || lang.value;

  useEffect(() => {
    if (editorRef.current) return;
    const editorInstance = Codemirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: lang.value,
        theme,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
        smartIndent: true,
        tabSize: 2,
        indentWithTabs: false,
      },
    );
    editorRef.current = editorInstance;
    editorInstance.setValue(codeData || "");
    editorInstance.on("change", (instance) => {
      if (skipEmit.current) {
        skipEmit.current = false;
        return;
      }
      const newCode = instance.getValue();
      setCodeData(newCode);
      onCodeChange(newCode);
      if (socketRef?.current) {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: newCode });
      }
    });
  }, []);

  useEffect(() => {
    if (!socketRef?.current) return;
    const handleCodeChange = ({ code }) => {
      if (code !== null && editorRef.current) {
        const currentCode = editorRef.current.getValue();
        if (code !== currentCode) {
          skipEmit.current = true;
          const cursor = editorRef.current.getCursor();
          editorRef.current.setValue(code);
          editorRef.current.setCursor(cursor);
          setCodeData(code);
          onCodeChange(code);
        }
      }
    };
    const handleUserJoined = ({ socketId }) => {
      if (socketRef.current.id !== socketId) {
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: editorRef.current.getValue(),
          socketId,
        });
      }
    };
    socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    socketRef.current.on(ACTIONS.JOINED, handleUserJoined);
    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      socketRef.current?.off(ACTIONS.JOINED, handleUserJoined);
    };
  }, [socketRef.current, roomId]);

  useEffect(() => {
    editorRef.current?.setOption("mode", lang.value);
  }, [lang]);
  useEffect(() => {
    editorRef.current?.setOption("theme", theme);
  }, [theme]);

  const handleCompile = async () => {
    if (!codeData || !lang?.id) return;
    setProcessing(true);
    const options = {
      method: "POST",
      url: import.meta.env.VITE_RAPID_API_URL,
      params: { base64_encoded: "true", fields: "*", wait: "true" },
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Host": import.meta.env.VITE_RAPID_API_HOST,
        "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY,
      },
      data: { language_id: lang.id, source_code: btoa(codeData) },
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

  const handleConvert = async () => {
  if (!codeData) return;
  setConverting(true);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/convert/ai`,
      {
        code: codeData,
        fromLang,
        toLang,
      }
    );

    if (!response?.data?.result) {
      throw new Error("No response from AI");
    }

    onAiOutput?.({
      type: "convert",
      content: response.data.result,
      toLang,
    });

    setShowConverterModal(false);
  } catch (err) {
    onAiOutput?.({
      type: "error",
      content:
        err?.response?.data?.message ||
        err.message ||
        "Conversion failed",
    });
  } finally {
    setConverting(false);
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

      {/* Converter Modal */}
      {showConverterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1e293b] rounded-xl p-6 w-96 shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-white text-lg font-semibold">
              Converter
              </h2>
              <button
                onClick={() => setShowConverterModal(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 items-center mb-6">
              <div className="flex-1">
                <label className="text-gray-400 text-xs mb-1 block">To</label>
                <select
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  className="w-full bg-[#0f172a] text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none"
                >
                  {CONVERT_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConverterModal(false)}
                className="px-4 py-2 rounded-md text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={converting}
                className={`px-5 py-2 rounded-md text-sm font-semibold text-white ${
                  converting
                    ? "bg-blue-700 opacity-50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {converting ? "Converting..." : "Convert →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full h-full bg-[#0f172a] text-white">
        <div className="flex justify-between items-center px-6 h-14 bg-[#1e293b] border-b border-gray-700">
          <div className="flex gap-4 text-sm items-center">
            <span>
              Language:{" "}
              <span className="bg-blue-700 ml-2 px-2 py-1 rounded">
                {currentLangLabel}
              </span>
            </span>
            <span>
              Theme:{" "}
              <span className="bg-purple-700 ml-2 px-2 py-1 rounded">
                {theme}
              </span>
            </span>
            <button
              onClick={() => setShowConverterModal(true)}
              className="flex items-center gap-1 bg-[#0f172a] hover:bg-[#1e3a5f] border border-gray-600 px-3 py-1.5 rounded-lg text-sm text-blue-400 hover:text-blue-300 transition"
            >
              <span>⚡</span> Convert
            </button>
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
