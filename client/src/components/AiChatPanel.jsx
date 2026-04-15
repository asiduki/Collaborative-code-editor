import React from "react";

const AiChatPanel = ({ isOpen, onClose, aiOutput, onUse }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[350px] bg-[#0f172a] border-l border-gray-700 shadow-2xl flex flex-col z-50">

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-[#1e293b]">
        <h2 className="text-white font-semibold text-sm">⚡ AI Assistant</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg self-end max-w-[80%]">
          Convert my code
        </div>

        <div className="bg-[#1e293b] text-blue-200 text-sm px-3 py-2 rounded-lg max-w-[90%] whitespace-pre-wrap">
          {aiOutput === "loading"
            ? "⚡ Generating..."
            : aiOutput || "No response"}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700">
        <button
          onClick={() => onUse(aiOutput)}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-md"
        >
          Use Code
        </button>
      </div>
    </div>
  );
};

export default AiChatPanel;