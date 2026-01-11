
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(videoFile);
  });

  const prompt = `
    Analyze this video and provide a complete transcription in Serbian (LATIN SCRIPT).
    Break down the text into short segments (captions).
    Each segment MUST have accurate start and end timestamps in seconds.
    The segments should be natural and timed precisely with the speech.
    Return ONLY a JSON array of objects with "text", "start", and "end" properties.
    Use ONLY Serbian Latin characters (č, ć, š, ž, đ).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: videoFile.type,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER }
            },
            required: ["text", "start", "end"]
          }
        }
      }
    });

    const rawResult = JSON.parse(response.text || "[]");
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `caption-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Neuspešna transkripcija videa. Proverite veličinu fajla ili internet konekciju.");
  }
}
