import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiTextResult {
  rawText: string;
  error: string | null;
}

export interface GeminiJsonResult<T> extends GeminiTextResult {
  data: T;
}

export async function getGeminiModel(modelName: string) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Set VITE_GEMINI_API_KEY.");
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

export async function generateGeminiJson<T>(prompt: string, fallback: T, modelName = "gemini-1.5-flash"): Promise<GeminiJsonResult<T>> {
  try {
    const model = await getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    let rawText = result.response.text() || "";
    rawText = cleanJsonText(rawText);

    if (!rawText) {
      return { data: fallback, rawText: "", error: "Gemini returned an empty response." };
    }

    try {
      const parsed = JSON.parse(rawText) as T;
      return { data: parsed, rawText, error: null };
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "Unknown parse error";
      return { data: fallback, rawText, error: `Failed to parse Gemini JSON response: ${message}` };
    }
  } catch (error) {
    return { data: fallback, rawText: "", error: error instanceof Error ? error.message : "Unknown Gemini error" };
  }
}

export async function generateGeminiText(prompt: string, modelName = "gemini-1.5-flash"): Promise<GeminiTextResult> {
  try {
    const model = await getGeminiModel(modelName);
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const rawText = (result.response.text() || "").trim();
    return { rawText, error: null };
  } catch (error) {
    return { rawText: "", error: error instanceof Error ? error.message : "Unknown Gemini error" };
  }
}
