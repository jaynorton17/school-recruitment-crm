import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiTextResult {
  rawText: string;
  error?: string;
}

export interface GeminiJsonResult<T extends object> extends GeminiTextResult {
  data: T;
}

let cachedApiKey: string | null = null;

const fetchApiKeyFromBackend = async (): Promise<string | null> => {
  if (typeof fetch !== "function") return null;

  try {
    const response = await fetch("/api/gemini-api-key");
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.apiKey || null;
  } catch (error) {
    console.warn("Falling back to environment Gemini API key; backend fetch failed.", error);
    return null;
  }
};

const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;

  const backendKey = await fetchApiKeyFromBackend();
  if (backendKey) {
    cachedApiKey = backendKey;
    return backendKey;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not available from the backend or environment.");
  }

  cachedApiKey = apiKey;
  return apiKey;
};

export const getGeminiModel = async (model: string) => {
  const genAI = new GoogleGenerativeAI(await getApiKey());
  return genAI.getGenerativeModel({ model });
};

export const safeExtractGeminiJson = <T extends object>(rawText: string, fallback: T): { data: T; error?: string } => {
  const cleanedText = (rawText || "").trim();
  if (!cleanedText) {
    return { data: fallback, error: "Gemini returned an empty response." };
  }

  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [codeBlockMatch ? codeBlockMatch[1] : cleanedText];

  const braceMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    candidates.push(braceMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return { data: parsed as T };
      }
    } catch {
      continue;
    }
  }

  return { data: fallback, error: "Failed to parse Gemini JSON response." };
};

export const generateGeminiText = async (prompt: string, modelName = "gemini-1.5-flash"): Promise<GeminiTextResult> => {
  try {
    const model = await getGeminiModel(modelName);
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const rawText = result.response.text();
    console.debug("Gemini raw response:", rawText);
    return { rawText };
  } catch (error) {
    console.error("Gemini call failed:", error);
    return { rawText: "", error: error instanceof Error ? error.message : "Unknown Gemini error" };
  }
};

export const generateGeminiJson = async <T extends object>(
  prompt: string,
  fallback: T,
  modelName = "gemini-1.5-flash"
): Promise<GeminiJsonResult<T>> => {
  const { rawText, error } = await generateGeminiText(prompt, modelName);
  const { data, error: parseError } = safeExtractGeminiJson<T>(rawText, fallback);
  return { rawText, data, error: error ?? parseError };
};
