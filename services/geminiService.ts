import {GoogleGenAI} from "@google/genai";

/**
 * Generates a festive fortune/encouragement for the 2026 Year of the Red Horse.
 * The GoogleGenAI instance is created inside the function to ensure it uses the
 * most up-to-date API key and avoids initialization errors during module load.
 */
export const generateHorseFortune = async (content: string): Promise<string> => {
  try {
    // CRITICAL: Initialize right before making the call as per instructions
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // Using gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `2026년 병오년(붉은 말의 해)를 맞아 다음 소원에 대한 힘찬 응원과 운세를 한 문장으로 적어줘: "${content}"`,
      config: {
        systemInstruction: "You are a professional fortune teller for the 2026 Year of the Red Horse. Provide encouraging and energetic responses in Korean. Keep the response short and impactful.",
      },
    });

    // Access the .text property directly (not a method) as per SDK guidelines
    return response.text?.trim() || "붉은 말이 당신의 소원을 싣고 힘차게 달려나갑니다! 행운이 가득하길 바랍니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "붉은 말이 당신의 소원을 싣고 힘차게 달려나갑니다! 행운이 가득하길 바랍니다.";
  }
};