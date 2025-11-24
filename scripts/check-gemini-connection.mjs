import { generateGeminiText } from "../services/gemini";

async function main() {
  try {
    const healthPrompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

Health check: confirm the service is reachable.

JSON schema:
{
  "status": "string"
}

Respond with "OK" in the status field if healthy. Use an empty string if uncertain.

Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

    const { rawText, error } = await generateGeminiText(healthPrompt, "gemini-1.5-flash");

    console.log("Gemini connection succeeded.");
    if (rawText) {
      console.log("Sample response:", rawText.slice(0, 200));
    }
    if (error) {
      console.warn("Warning: Gemini reported an issue:", error);
    }
  } catch (error) {
    console.error("Gemini connection failed:", error?.message ?? error);
    process.exit(1);
  }
}

main();
