import { generateGeminiJson, generateGeminiText, GeminiJsonResult, GeminiTextResult } from "./gemini";

export type AiMode =
  | "PA"
  | "Coach"
  | "Strategist"
  | "Alerts"
  | "Transcriber"
  | "Matcher"
  | "Utility";

export interface UnifiedAiRequest<T> {
  mode: AiMode;
  prompt: string;
  fallback: T;
}

export type UnifiedAiResponse<T> = GeminiJsonResult<T>;

/**
 * Unified AI entry point.
 * For now, all modes use JSON output via generateGeminiJson.
 * Later we can switch models or formats per mode inside this function.
 */
export async function callUnifiedAI<T>(
  req: UnifiedAiRequest<T>
): Promise<UnifiedAiResponse<T>> {
  const { prompt, fallback } = req;
  // We ignore mode in logic for now, but keep it for future routing.
  return await generateGeminiJson<T>(prompt, fallback);
}

/**
 * Optional helper for text-based modes if needed later.
 */
export async function callUnifiedText(
  mode: AiMode,
  prompt: string
): Promise<GeminiTextResult> {
  return await generateGeminiText(prompt);
}
