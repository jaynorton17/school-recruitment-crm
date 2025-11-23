import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set. Add it to your .env.local file.");
  }

  return apiKey;
};

export const getGeminiModel = (model: string) => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({ model });
};
