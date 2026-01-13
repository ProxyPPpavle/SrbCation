
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  const getApiKey = () => {
    try {
      // @ts-ignore
      const viteKey = import.meta.env?.VITE_API_KEY;
      if (viteKey) return viteKey;
      // @ts-ignore
      const processKey = typeof process !== 'undefined' ? (process.env?.VITE_API_KEY || process.env?.API_KEY) : null;
      if (processKey) return processKey;
      return null;
    } catch (e) {
      return null;
    }
  };

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY nije pronađen.");

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(videoFile);
  });

  const prompt = `
    ZADATAK: Brutalna i apsolutna transkripcija svakog izgovorenog sloga na SRPSKOM (LATINICA).
    
    STRIKTNA PRAVILA:
    1. NE SMEŠ PRESKOČITI NIJEDNU REČ. Ako neko mrmlja ili brzo priča, pokušaj da dešifruješ, nemoj ostavljati prazno.
    2. TAČNOST U STOTINKU: Start i End moraju pratiti zvuk u milisekundu (npr. 1.05, 1.82).
    3. RITAM: Grupisanje po 2-4 reči koje čine logičku celinu.
    4. KONTINUITET: Između dva titla ne sme biti "rupe" u vremenu ako se govor nastavlja.
    5. JEZIK: Koristi š, đ, č, ć, ž.
    
    FORMAT: JSON array objekata [{"text": "...", "start": 0.0, "end": 1.0}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: videoFile.type, data: base64Data } }] }],
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
    if (!text) throw new Error("Prazan odgovor.");
    const rawResult = JSON.parse(text.trim());
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `cap-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    throw new Error(error.message || "Problem sa AI obradom.");
  }
}
