export interface GeminiTextResult {
  rawText: string;
  error: string | null;
}

export interface GeminiJsonResult<T> extends GeminiTextResult {
  data: T;
}

export function extractGeminiText(response: any): string {
  try {
    // New Gemini 1.5 format
    const parts = response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts[0]?.text) {
      return parts[0].text;
    }

    // Older fallback
    if (typeof response.text === "function") {
      return response.text();
    }

    return "";
  } catch {
    return "";
  }
}

function getGeminiApiKey(): string {
  // Support both Vite (browser build) and direct Node execution (scripts).
  const runtimeEnv = typeof process !== "undefined" ? (process as any).env : undefined;
  const key = import.meta?.env?.VITE_GEMINI_API_KEY ?? runtimeEnv?.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API key is not configured.");
  }
  return key;
}

async function callGeminiGenerateContent(modelName: string, body: Record<string, any>) {
  const apiKey = getGeminiApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Gemini API request failed (${response.status} ${response.statusText}). ${errorText || "No response body."}`
    );
  }

  return response.json();
}

const cleanJsonText = (rawText: string) => {
  let cleaned = (rawText || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json|```/g, "").trim();
  }
  return cleaned;
};

export async function generateGeminiJson<T>(
  prompt: string,
  fallback: T,
  modelName = "gemini-1.5-flash"
): Promise<GeminiJsonResult<T>> {
  try {
    const result = await callGeminiGenerateContent(modelName, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    let rawText = extractGeminiText(result);
    rawText = cleanJsonText(rawText);

    if (!rawText) {
      return { data: fallback, rawText: "", error: "Gemini returned an empty response." };
    }

    try {
      const parsed = JSON.parse(rawText) as T;
      return { data: parsed, rawText, error: null };
    } catch (parseError) {
      return {
        data: fallback,
        rawText,
        error:
          "Failed to parse JSON: " +
          (parseError instanceof Error ? parseError.message : "Unknown JSON error")
      };
    }
  } catch (err: any) {
    return {
      data: fallback,
      rawText: "",
      error: err?.message ?? "Unknown Gemini error"
    };
  }
}

export async function generateGeminiText(
  prompt: string,
  modelName = "gemini-1.5-flash"
): Promise<GeminiTextResult> {
  try {
    const result = await callGeminiGenerateContent(modelName, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const rawText = extractGeminiText(result)?.trim() ?? "";
    return { rawText, error: null };
  } catch (err: any) {
    return { rawText: "", error: err?.message ?? "Unknown Gemini error" };
  }
}
