import React, { useState, useRef, useEffect } from "react";

// ─── OutputWindow ──────────────────────────────────────────────────────────────
// Props:
//   outputDetails  – judge0 response object (from compile)
//   aiOutput       – { type: "convert" | "error", content: string, toLang?: string }
//   currentCode    – string (editor code, passed down for AI context)
// ───────────────────────────────────────────────────────────────────────────────

const OutputWindow = ({ outputDetails, aiOutput, currentCode = "" }) => {
  const [activeTab, setActiveTab] = useState("output"); // "output" | "convert" | "chat"
  const chatEndRef = useRef(null);

  // Auto-switch to convert tab when AI output arrives
  useEffect(() => {
    if (aiOutput) setActiveTab("convert");
  }, [aiOutput]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ activeTab]);

  // ── Compile output renderer ────────────────────────────────────────────────
  const getCompileOutput = () => {
    if (!outputDetails) {
      return <p className="text-gray-500 text-sm italic">Run your code to see output here.</p>;
    }
    try {
      const statusId = outputDetails?.status?.id;
      switch (statusId) {
        case 3:
          return (
            <pre className="text-green-400 text-sm whitespace-pre-wrap leading-relaxed">
              {outputDetails.stdout ? atob(outputDetails.stdout) : "✓ No output"}
            </pre>
          );
        case 6:
          return (
            <pre className="text-red-400 text-sm whitespace-pre-wrap leading-relaxed">
              {outputDetails.compile_output ? atob(outputDetails.compile_output) : "Compilation error"}
            </pre>
          );
        case 5:
          return <pre className="text-yellow-400 text-sm">⏱ Time Limit Exceeded</pre>;
        default:
          return (
            <pre className="text-red-400 text-sm whitespace-pre-wrap leading-relaxed">
              {outputDetails.stderr ? atob(outputDetails.stderr) : "Unknown error"}
            </pre>
          );
      }
    } catch {
      return <pre className="text-red-500 text-sm">⚠ Error decoding output.</pre>;
    }
  };

 

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // ── Simple markdown-ish renderer for chat (handles code blocks) ───────────
  const renderChatContent = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
        return (
          <pre
            key={i}
            className="bg-[#0f172a] border border-gray-700 rounded p-3 my-2 text-green-300 text-xs overflow-x-auto whitespace-pre-wrap"
          >
            {code}
          </pre>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  // ── Tab config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "output", label: "Output", icon: "▶" },
    { id: "convert", label: "Converted", icon: "⚡", badge: !!aiOutput },
  ];

  return (
    <div className="bg-[#1e293b] rounded-md h-full flex flex-col overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-700 bg-[#162032]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white border-b-2 border-blue-500 bg-[#1e293b]"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#1e293b]/50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400" />
            )}
          </button>
        ))}
      </div>

      {/* ── OUTPUT TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "output" && (
        <div className="flex-1 overflow-y-auto bg-[#0f172a] rounded-b m-2 p-3">
          {getCompileOutput()}
        </div>
      )}

      {/* ── CONVERT TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "convert" && (
        <div className="flex-1 flex flex-col overflow-hidden m-2">
          {!aiOutput ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm italic text-center">
                Use the ⚡ Convert button in the editor toolbar<br />to convert your code to another language.
              </p>
            </div>
          ) : aiOutput.type === "error" ? (
            <div className="flex-1 bg-[#0f172a] rounded p-3 overflow-y-auto">
              <pre className="text-red-400 text-sm whitespace-pre-wrap">{aiOutput.content}</pre>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">
                  Converted to <span className="text-blue-400 font-semibold">{aiOutput.toLang}</span>
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(aiOutput.content)}
                  className="text-xs text-gray-400 hover:text-white border border-gray-600 px-2 py-0.5 rounded transition"
                >
                  Copy
                </button>
              </div>
              <div className="flex-1 bg-[#0f172a] rounded overflow-y-auto">
                <pre className="text-green-300 text-sm whitespace-pre-wrap p-3 leading-relaxed">
                  {aiOutput.content}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputWindow;
