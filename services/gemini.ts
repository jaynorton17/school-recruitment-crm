import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiTextResult {
  rawText: string;
  error: string | null;
}

export interface GeminiJsonResult<T> extends GeminiTextResult {
  data: T;
}

export const MODEL_NAME = "models/gemini-pro";

/**
 * Pull API Key safely
 */
function getGeminiApiKey(): string {
  const key = import.meta?.env?.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured.");
  return key;
}

/**
 * Cleans the raw model output of code fences, junk, stray commentary.
 */
const cleanJsonText = (rawText: string): string => {
  if (!rawText) return "";

  let cleaned = rawText.trim();

  // Remove triple-backtick blocks
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.replace(/[\u0000-\u001F]+/g, " "); // invisible control chars

  // Remove prefixes like "Here's the JSON:" or "Sure! ..."
  cleaned = cleaned.replace(/^here.*?:/i, "").trim();
  cleaned = cleaned.replace(/^sure.*?:/i, "").trim();
  cleaned = cleaned.replace(/^assistant.*?:/i, "").trim();

  // Try to isolate JSON object inside any surrounding text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
};

/**
 * Build Gemini client
 */
export const getGeminiModel = async (modelName = MODEL_NAME) => {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Generate JSON with stable parsing and fallback protection.
 */
export async function generateGeminiJson<T>(
  prompt: string,
  fallback: T
): Promise<GeminiJsonResult<T>> {
  try {
    const model = await getGeminiModel();

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const raw = response.response?.text?.() ?? "";
    const rawText = cleanJsonText(raw);

    if (!rawText) {
      return {
        data: fallback,
        rawText,
        error: "Gemini returned an empty or unusable response."
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        data: parsed as T,
        rawText,
        error: null
      };
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

/**
 * Generate raw text model output (used by chat-style tools).
 */
export async function generateGeminiText(
  prompt: string
): Promise<GeminiTextResult> {
  try {
    const model = await getGeminiModel();

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const raw = response.response?.text?.() ?? "";
    const rawText = raw.trim();

    if (!rawText) {
      return { rawText: "", error: "Gemini returned an empty response." };
    }

    return { rawText, error: null };
  } catch (err: any) {
    return { rawText: "", error: err?.message ?? "Unknown Gemini error" };
  }
}
