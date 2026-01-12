
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  // Funkcija koja pronalazi ključ bez obzira na prefiks (VITE_ ili običan)
  const getApiKey = () => {
    try {
      // @ts-ignore
      const viteKey = import.meta.env?.VITE_API_KEY;
      if (viteKey) return viteKey;

      // @ts-ignore
      const processKey = typeof process !== 'undefined' ? (process.env?.VITE_API_KEY || process.env?.API_KEY) : null;
      if (processKey) return processKey;

      // @ts-ignore
      const winKey = (window as any).process?.env?.VITE_API_KEY || (window as any).process?.env?.API_KEY || (window as any).VITE_API_KEY || (window as any).API_KEY;
      if (winKey) return winKey;

      return null;
    } catch (e) {
      return null;
    }
  };

  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("Srb Caption: API ključ nije pronađen. Proveri Vercel Settings.");
    throw new Error("Greška: API_KEY nije pronađen. Molimo podesite VITE_API_KEY u Vercel Environment Variables i uradite Redeploy.");
  }

  // Inicijalizacija sa pronađenim ključem
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
    Podeli rečenice na male delove (titlove) od po 2-5 reči za dinamičan prikaz.
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
    if (!text) throw new Error("AI nije vratio titlove.");

    const rawResult = JSON.parse(text.trim());
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `caption-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API key not valid")) {
      throw new Error("API ključ nije validan. Proveri ga u Google AI Studio.");
    }
    throw new Error(error.message || "Problem sa transkripcijom.");
  }
}
