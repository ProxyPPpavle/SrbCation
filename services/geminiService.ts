
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  // Direktan pristup ključu bez dodatnih provera koje mogu blokirati execution u nekim okruženjima
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Greška: API_KEY nije definisan u okruženju. Proveri Vercel Environment Variables i uradi Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error("Neuspešno čitanje fajla."));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(videoFile);
  });

  const prompt = `
    Analiziraj ovaj video i uradi transkripciju govora na SRPSKOM jeziku (LATINICA).
    Rezultat mora biti niz JSON objekata. 
    Podeli rečenice na male delove (titlove) od po 3-6 reči.
    Obavezno koristi srpska slova (č, ć, š, ž, đ).
    Format: [{"text": "Primer teksta", "start": 0.0, "end": 2.0}]
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

    const text = response.text;
    if (!text) throw new Error("AI nije vratio odgovor.");

    const rawResult = JSON.parse(text.trim());
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `caption-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(error.message || "Problem sa transkripcijom.");
  }
}
