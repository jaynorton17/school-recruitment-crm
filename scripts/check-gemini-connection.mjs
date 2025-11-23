import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY. Set it in your environment or GitHub secret.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: "Health check: please reply with OK." }] }],
    });

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
