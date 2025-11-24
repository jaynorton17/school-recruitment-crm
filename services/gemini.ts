import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiTextResult {
  rawText: string;
  error: string | null;
}

export interface GeminiJsonResult<T> extends GeminiTextResult {
  data: T;
}

export const MODEL_NAME = "models/gemini-pro";

function getGeminiApiKey(): string {
  const key = import.meta?.env?.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API key is not configured.");
  }
  return key;
}

const cleanJsonText = (rawText: string) => {
  let cleaned = (rawText || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json|```/g, "").trim();
  }
  return cleaned;
};

export const getGeminiModel = async (modelName = MODEL_NAME) => {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({ model: modelName });
};

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

    const raw = response.response.text();
    const rawText = cleanJsonText(raw);

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

export async function generateGeminiText(prompt: string): Promise<GeminiTextResult> {
  try {
    const model = await getGeminiModel();
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const rawText = response.response.text().trim();

    if (!rawText) {
      return { rawText: "", error: "Gemini returned an empty response." };
    }

    return { rawText, error: null };
  } catch (err: any) {
    return { rawText: "", error: err?.message ?? "Unknown Gemini error" };
  }
}
