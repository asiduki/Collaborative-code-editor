// client/src/components/ConvertButton.jsx
import { useState } from "react";
import ACTIONS from "../actions/Actions";

// Read API URL from .env
const API_URL = import.meta.env.VITE_API_URL;

export default function ConvertButton({ code, onConverted, socketRef, roomId }) {
  const [mode, setMode] = useState("c2java");
  const [loading, setLoading] = useState(false);

  const convertCode = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode }),
      });

      const data = await res.json();
      const convertedOutput = data.output;

      // update your editor page
      onConverted(convertedOutput);

      // 🔥 Send popup + code to ALL users in the room
      if (socketRef?.current) {
        socketRef.current.emit(ACTIONS.SHOW_CONVERTED_CODE, {
          roomId,
          convertedCode: convertedOutput,
        });
      }

    } catch (err) {
      const errorOutput = "// ERROR: Could not convert code";

      onConverted(errorOutput);

      if (socketRef?.current) {
        socketRef.current.emit(ACTIONS.SHOW_CONVERTED_CODE, {
          roomId,
          convertedCode: errorOutput,
        });
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-900 p-2 rounded">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className=" rounded bg-gray-800 text-white border border-gray-700"
      >
        <option value="c2java">C → Java</option>
        <option value="java2c">Java → C</option>
      </select>

      <button
        onClick={convertCode}
        disabled={loading}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        {loading ? "Converting..." : "Convert"}
      </button>
    </div>
  );
}
