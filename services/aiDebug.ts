export interface AiDebugInfo {
  prompt: string;
  rawText: string;
  parsed: any;
  missingFields: string[];
  errorMessage: string;
}

export function analyseAiResponse<T>(
  rawText: string,
  parsed: any,
  requiredFields: string[],
  fallback: T,
  prompt: string
): { ok: boolean; data: T; debug: AiDebugInfo } {

  const missing: string[] = [];

  for (const field of requiredFields) {
    if (
      parsed[field] === undefined ||
      parsed[field] === null ||
      parsed[field] === "" ||
      (Array.isArray(parsed[field]) && parsed[field].length === 0)
    ) {
      missing.push(field);
    }
  }

  const ok = missing.length === 0;

  return {
    ok,
    data: ok ? parsed : fallback,
    debug: {
      prompt,
      rawText,
      parsed,
      missingFields: missing,
      errorMessage: ok
        ? ""
        : `Missing required fields: ${missing.join(", ")}`
    }
  };
}
