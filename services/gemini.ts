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
    if (Array.isArray(parts) && typeof parts[0]?.text === "string") {
      return parts[0].text;
    }

    return "";
  } catch {
    return "";
  }
}

export async function getGeminiModel(modelName: string) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
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
    const model = await getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    let rawText =
      typeof result.response?.text === "function"
        ? result.response.text()
        : extractGeminiText(result.response);
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
    const model = await getGeminiModel(modelName);
    const result = await model.generateContent(prompt);

    const rawText =
      (typeof result.response?.text === "function"
        ? result.response.text()
        : extractGeminiText(result.response)
      )
        ?.trim() ?? "";
    return { rawText, error: null };
  } catch (err: any) {
    return { rawText: "", error: err?.message ?? "Unknown Gemini error" };
  }
}
