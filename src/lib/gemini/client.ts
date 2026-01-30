import { GoogleGenerativeAI } from "@google/generative-ai";

// Client Gemini singleton
let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
