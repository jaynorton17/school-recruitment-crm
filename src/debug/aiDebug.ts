export interface AIDebugEvent {
  id: string; // uuid
  toolName: string; // "JobFinder", "Transcriber", etc
  timestamp: number; // Date.now()
  prompt: string; // final prompt sent to Gemini
  model: string; // e.g. "models/gemini-pro"
  requestPayload: any; // data sent to generateContent
  rawResponse: any; // FULL raw Gemini response
  cleanedText: string; // extractGeminiText output
  parsedJson: any; // parsed json (if JSON tool)
  missingFields: string[]; // based on tool schema
  error: string | null; // human readable error
  errorStack: string | null; // err.stack if exists
  location: string; // filename + line number where failure happened
  environment: { envVars: any }; // dump of process.env + import.meta.env
}

const events: AIDebugEvent[] = [];

function getEnvSnapshot() {
  try {
    return {
      ...(typeof process !== "undefined" ? (process as any).env ?? {} : {}),
      ...((import.meta as any)?.env ?? {})
    };
  } catch (err) {
    console.warn("Failed to capture environment for AI debug", err);
    return {};
  }
}

export function addAIDebugEvent(event: AIDebugEvent): void {
  try {
    events.push({
      ...event,
      environment: event.environment ?? { envVars: getEnvSnapshot() }
    });
  } catch (err) {
    console.warn("Failed to add AI debug event", err);
  }
}

export function getAIDebugEvents(): AIDebugEvent[] {
  return [...events];
}

export function clearAIDebugEvents(): void {
  events.length = 0;
}
