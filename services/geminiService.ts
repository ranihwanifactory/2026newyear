import { GoogleGenAI } from "@google/genai";

// Fix: Initializing GoogleGenAI with the environment API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a festive fortune/encouragement for the 2026 Year of the Red Horse.
 */
export const generateHorseFortune = async (content: string): Promise<string> => {
  try {
    // Fix: Using gemini-3-flash-preview for basic text tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `2026년 병오년(붉은 말의 해)를 맞아 다음 소원에 대한 힘찬 응원과 운세를 한 문장으로 적어줘: "${content}"`,
      config: {
        systemInstruction: "You are a professional fortune teller for the 2026 Year of the Red Horse. Provide encouraging and energetic responses in Korean. Keep the response short and impactful.",
      },
    });
    // Fix: Accessing .text property directly as per guidelines
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};