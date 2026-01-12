
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
    throw new Error("Greška: API_KEY nije pronađen. Molimo podesite VITE_API_KEY.");
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
    ZADATAK: Brutalno precizna transkripcija videa na SRPSKOM jeziku (LATINICA).
    
    PRAVILA ZA SINHRONIZACIJU:
    1. TAČNOST U STOTINKU: Start i End moraju biti 100% usklađeni sa zvukom. (npr. 1.12, 2.45).
    2. GRUPISANJE: Pravi prirodne segmente od 1 do 4 reči. Nemoj razbijati svaku reč posebno, AI treba da oseti ritam govora.
    3. MILISEKUNDA JE BITNA: Tekst mora da se pojavi TAČNO kad reč krene.
    4. BEZ PAUZA: Ako govornik nastavlja bez pauze, End trenutnog titla mora biti identičan kao Start sledećeg.
    
    JEZIK:
    - Koristi č, ć, š, ž, đ.
    - Isključivo JSON niz.
    
    FORMAT: [{"text": "Primer rečenice", "start": 0.15, "end": 1.45}]
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
    throw new Error(error.message || "Problem sa transkripcijom.");
  }
}
