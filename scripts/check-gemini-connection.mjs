import { getGeminiModel } from "../services/gemini";

async function main() {
  const model = getGeminiModel("gemini-1.5-flash");

  try {
    const result = await model.generateContent({ prompt: "Health check: please reply with OK." });

    const text = result.response?.text?.();

    console.log("Gemini connection succeeded.");
    if (text) {
      console.log("Sample response:", text.slice(0, 200));
    }
  } catch (error) {
    console.error("Gemini connection failed:", error?.message ?? error);
    process.exit(1);
  }
}

main();
