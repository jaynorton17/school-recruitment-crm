import React from "react";
import "./AiDebugPanel.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  debugData: any;
}

const AiDebugPanel: React.FC<Props> = ({ isOpen, onClose, debugData }) => {
  if (!isOpen || !debugData) return null;

  return (
    <div className="ai-debug-overlay">
      <div className="ai-debug-modal">
        <h2>AI Debug Panel</h2>

        <h3>Error</h3>
        <pre>{debugData.errorMessage || "No error message"}</pre>

        <h3>Missing Fields</h3>
        <pre>{JSON.stringify(debugData.missingFields, null, 2)}</pre>

        <h3>Raw Response</h3>
        <pre>{debugData.rawText}</pre>

        <h3>Parsed JSON</h3>
        <pre>{JSON.stringify(debugData.parsed, null, 2)}</pre>

        <h3>Prompt Used</h3>
        <pre>{debugData.prompt}</pre>

        <button className="ai-debug-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AiDebugPanel;
