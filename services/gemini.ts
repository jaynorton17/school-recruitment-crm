import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

const getApiKey = () => {
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set. Add it to your Cloud Run service configuration.");
  }
  return apiKey;
};

export const getGeminiModel = (model: string) => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({ model });
};
