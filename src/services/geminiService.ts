import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

export async function translateText(text: string, targetLanguage: string): Promise<TranslationResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the following text to ${targetLanguage}. 
    Only output the translated text. 
    If the source language is not English, detect it.
    
    Text: "${text}"`,
    config: {
      temperature: 0.1,
    }
  });

  return {
    translatedText: response.text || "",
  };
}
