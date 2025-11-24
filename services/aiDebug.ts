export interface AiDebugInfo {
  prompt: string;
  rawText: string;
  parsed: any;
  missingFields: string[];
  emptyFields: string[];
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
  const empty: string[] = [];

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      data: fallback,
      debug: {
        prompt,
        rawText,
        parsed,
        missingFields: requiredFields,
        emptyFields: [],
        errorMessage: "Parsed AI response is not a valid object."
      }
    };
  }

  for (const field of requiredFields) {
    const hasKey = Object.prototype.hasOwnProperty.call(parsed, field);
    const value = (parsed as any)[field];

    // Truly missing: key not present, or null / undefined
    if (!hasKey || value === null || value === undefined) {
      missing.push(field);
      continue;
    }

    // Present but empty – allowed, but tracked separately
    if (
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0)
    ) {
      empty.push(field);
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
      emptyFields: empty,
      errorMessage: ok
        ? ""
        : `Missing required fields: ${missing.join(", ")}`
    }
  };
}
