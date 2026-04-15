import { useState, useEffect, useRef } from "react";
import SimpleEditor from "./SimpleEditor";

const API_URL = import.meta.env.VITE_API_URL;

export default function DualConverter() {
  const [leftCode, setLeftCode] = useState("");
  const [rightCode, setRightCode] = useState("");

  const [leftLang, setLeftLang] = useState("c");
  const [rightLang, setRightLang] = useState("java");

  const typingSide = useRef(null);
  const timer = useRef(null);

  // --------------------------
  // Conversion Function
  // --------------------------
  const convert = async (source, from, to) => {
    let mode = "c2java";
    if (from === "java" && to === "c") mode = "java2c";

    try {
      const res = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: source, mode }),
      });

      const data = await res.json();
      return data.output || "";
    } catch {
      return "// conversion error";
    }
  };

  // --------------------------
  // Typing Handlers
  // --------------------------
  const handleLeft = (v) => {
    typingSide.current = "left";
    setLeftCode(v);
  };

  const handleRight = (v) => {
    typingSide.current = "right";
    setRightCode(v);
  };

  // --------------------------
  // Auto Convert While Typing
  // --------------------------
  useEffect(() => {
    if (!typingSide.current) return;

    clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      if (typingSide.current === "left") {
        setRightCode(await convert(leftCode, leftLang, rightLang));
      } else {
        setLeftCode(await convert(rightCode, rightLang, leftLang));
      }
    }, 400);
  }, [leftCode, rightCode]);

  // --------------------------
  // Convert When Language Changes
  // --------------------------
  useEffect(() => {
    if (leftCode.trim()) {
      convert(leftCode, leftLang, rightLang).then(setRightCode);
    }
  }, [leftLang]);

  useEffect(() => {
    if (rightCode.trim()) {
      convert(rightCode, rightLang, leftLang).then(setLeftCode);
    }
  }, [rightLang]);

  // --------------------------
  // Manual ConvertButton Output Listener
  // --------------------------
  useEffect(() => {
    const handler = (e) => setRightCode(e.detail);

    window.addEventListener("manual-convert", handler);
    return () => window.removeEventListener("manual-convert", handler);
  }, []);

  return (
    <div className="flex w-full h-full gap-3 p-3 bg-[#0f172a]">

      {/* LEFT PANEL */}
      <div className="w-1/2 flex flex-col h-full">
        <div className="flex justify-between mb-2">
          <h2 className="text-white">Source ({leftLang})</h2>
          <select
            value={leftLang}
            onChange={(e) => setLeftLang(e.target.value)}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            <option value="c">C</option>
            <option value="java">Java</option>
          </select>
        </div>

        <div className="flex-1 border border-gray-700 rounded">
          <SimpleEditor value={leftCode} onChange={handleLeft} />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex flex-col h-full">
        <div className="flex justify-between mb-2">
          <h2 className="text-white">Converted ({rightLang})</h2>
          <select
            value={rightLang}
            onChange={(e) => setRightLang(e.target.value)}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
        </div>

        <div className="flex-1 border border-gray-700 rounded">
          <SimpleEditor value={rightCode} onChange={handleRight} />
        </div>
      </div>
    </div>
  );
}
