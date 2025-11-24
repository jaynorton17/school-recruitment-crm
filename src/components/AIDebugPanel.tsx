import React, { useEffect, useMemo, useRef, useState } from "react";
import { addAIDebugEvent, clearAIDebugEvents, getAIDebugEvents, type AIDebugEvent } from "../debug/aiDebug";

const panelStyles = "fixed z-[1000] shadow-lg border border-slate-700/70 bg-slate-900/95 text-slate-100 rounded-lg";

function safeCopy(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

const AIDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [events, setEvents] = useState<AIDebugEvent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const interval = window.setInterval(() => {
      try {
        setEvents(getAIDebugEvents());
      } catch (err) {
        console.warn("AI Debug Panel polling failed", err);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition(pos => ({ x: pos.x + e.movementX, y: pos.y + e.movementY }));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  const sortedEvents = useMemo(() => [...events].sort((a, b) => b.timestamp - a.timestamp), [events]);

  if (!import.meta.env.DEV) return null;

  const handleCopy = (event: AIDebugEvent) => {
    try {
      safeCopy(JSON.stringify(event, null, 2));
    } catch (err) {
      console.warn("Failed to copy AI debug event", err);
    }
  };

  const handleClear = () => {
    try {
      clearAIDebugEvents();
      setEvents([]);
    } catch (err) {
      console.warn("Failed to clear AI debug events", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const panel = (
    <div
      ref={panelRef}
      className={`${panelStyles} w-[380px] max-h-[70vh] overflow-hidden`}
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      <div
        className="cursor-move bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-700/60"
        onMouseDown={startDrag}
      >
        <div className="font-semibold text-sm">AI Debug Panel ({events.length})</div>
        <div className="flex items-center gap-2 text-xs">
          <button className="text-slate-300 hover:text-white" onClick={handleClear}>Clear Events</button>
          <button className="text-slate-300 hover:text-white" onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-800">
        {sortedEvents.length === 0 && (
          <div className="p-4 text-sm text-slate-400">No AI debug events yet.</div>
        )}
        {sortedEvents.map(event => {
          const isExpanded = expandedId === event.id;
          return (
            <div key={event.id} className="p-3">
              <button
                className="w-full text-left"
                onClick={() => toggleExpand(event.id)}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold text-slate-100">{event.toolName}</div>
                  <div className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
                </div>
                {event.error && <div className="text-xs text-red-400 mt-1">Error: {event.error}</div>}
              </button>
              {isExpanded && (
                <div className="mt-3 space-y-2 text-xs text-slate-200">
                  <div className="flex justify-end gap-2 mb-2">
                    <button className="px-2 py-1 bg-slate-800 rounded" onClick={() => handleCopy(event)}>Copy Event as JSON</button>
                  </div>
                  <div>
                    <div className="font-semibold">Prompt</div>
                    <pre className="whitespace-pre-wrap bg-slate-800/70 p-2 rounded mt-1 text-slate-100">{event.prompt}</pre>
                  </div>
                  <div>
                    <div className="font-semibold">Cleaned Text</div>
                    <pre className="whitespace-pre-wrap bg-slate-800/70 p-2 rounded mt-1 text-slate-100">{event.cleanedText}</pre>
                  </div>
                  <div>
                    <div className="font-semibold">Parsed JSON</div>
                    <pre className="whitespace-pre-wrap bg-slate-800/70 p-2 rounded mt-1 text-slate-100">{JSON.stringify(event.parsedJson, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="font-semibold">Missing Fields</div>
                    <div className="bg-slate-800/70 p-2 rounded mt-1 text-slate-100">{event.missingFields?.join(", ") || "None"}</div>
                  </div>
                  <details className="bg-slate-800/70 p-2 rounded">
                    <summary className="font-semibold cursor-pointer">Raw Response</summary>
                    <pre className="whitespace-pre-wrap text-slate-100 mt-1">{JSON.stringify(event.rawResponse, null, 2)}</pre>
                  </details>
                  {event.errorStack && (
                    <details className="bg-slate-800/70 p-2 rounded">
                      <summary className="font-semibold cursor-pointer">Error Stack</summary>
                      <pre className="whitespace-pre-wrap text-slate-100 mt-1">{event.errorStack}</pre>
                    </details>
                  )}
                  <details className="bg-slate-800/70 p-2 rounded">
                    <summary className="font-semibold cursor-pointer">Environment</summary>
                    <pre className="whitespace-pre-wrap text-slate-100 mt-1">{JSON.stringify(event.environment, null, 2)}</pre>
                  </details>
                  <div>
                    <div className="font-semibold">Location</div>
                    <div className="bg-slate-800/70 p-2 rounded mt-1 text-slate-100">{event.location}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-[1001] bg-slate-900 text-white border border-slate-700 px-4 py-2 rounded-full shadow-lg"
        onClick={() => setIsOpen(prev => !prev)}
      >
        {isOpen ? "Hide AI Debug" : "AI Debug"}
      </button>
      {isOpen && panel}
    </>
  );
};

export default AIDebugPanel;
