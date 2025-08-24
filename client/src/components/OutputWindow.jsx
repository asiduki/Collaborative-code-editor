import React from "react";

const OutputWindow = ({ outputDetails }) => {
  const getOutput = () => {
    if (!outputDetails) {
      return <p className="text-gray-400">Output will appear here.</p>;
    }

    try {
      const statusId = outputDetails?.status?.id;

      switch (statusId) {
        case 3: // Success
          return (
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {outputDetails.stdout ? atob(outputDetails.stdout) : "No output"}
            </pre>
          );

        case 6: // Compilation Error
          return (
            <pre className="text-red-400 text-sm whitespace-pre-wrap">
              {outputDetails.compile_output
                ? atob(outputDetails.compile_output)
                : "Compilation error"}
            </pre>
          );

        case 5: // Time Limit Exceeded
          return (
            <pre className="text-yellow-400 text-sm">
              ⏱ Time Limit Exceeded
            </pre>
          );

        default: // Runtime or other error
          return (
            <pre className="text-red-400 text-sm whitespace-pre-wrap">
              {outputDetails.stderr
                ? atob(outputDetails.stderr)
                : "Unknown error"}
            </pre>
          );
      }
    } catch (err) {
      return (
        <pre className="text-red-500 text-sm">
          ⚠ Error decoding output.
        </pre>
      );
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-md p-4 h-full flex flex-col">
      <h2 className="text-white text-lg font-semibold border-b border-gray-600 pb-1 mb-2">
        Output
      </h2>
      <div className="flex-1 overflow-y-auto bg-[#0f172a] rounded p-2">
        {getOutput()}
      </div>
    </div>
  );
};

export default OutputWindow;
