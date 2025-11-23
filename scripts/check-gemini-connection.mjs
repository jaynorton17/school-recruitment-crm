import { generateGeminiText } from "../services/gemini";

async function main() {
  try {
    const { rawText, error } = await generateGeminiText("Health check: please reply with OK.");

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
