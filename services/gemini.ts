import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiTextResult {
  rawText: string;
  error: string | null;
}

export interface GeminiJsonResult<T> extends GeminiTextResult {
  data: T;
}

export function extractGeminiText(response: any): string {
  try {
    const parts = response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts[0]?.text) {
      return parts[0].text;
    }

    if (typeof response.text === "function") {
      return response.text();
    }

    return "";
  } catch {
    return "";
  }
}

function getGeminiApiKey(): string {
  const runtimeEnv = typeof process !== "undefined" ? (process as any).env : undefined;
  const key = import.meta?.env?.VITE_GEMINI_API_KEY ?? runtimeEnv?.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API key is not configured.");
  }
  return key;
}

let genAI: GoogleGenerativeAI | null = null;

function getGenerativeModel(modelName: string) {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return genAI.getGenerativeModel({ model: modelName });
}

async function callGeminiGenerateContent(modelName: string, prompt: string, generationConfig?: Record<string, any>) {
  const model = getGenerativeModel(modelName);
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(generationConfig ? { generationConfig } : {})
  });
  return response.response;
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
    const result = await callGeminiGenerateContent(modelName, prompt, { responseMimeType: "application/json" });

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
    const result = await callGeminiGenerateContent(modelName, prompt);

    const rawText = extractGeminiText(result)?.trim() ?? "";
    return { rawText, error: null };
  } catch (err: any) {
    return { rawText: "", error: err?.message ?? "Unknown Gemini error" };
  }
}
