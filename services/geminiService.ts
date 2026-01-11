
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("API_KEY is missing in process.env");
    throw new Error("API ključ nije detektovan. Proveri Environment Variables na hostingu.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(videoFile);
  });

  const prompt = `
    Pažljivo analiziraj ovaj video i uradi kompletnu transkripciju govora na SRPSKOM JEZIKU (koristi LATINICU).
    Podeli tekst u veoma kratke segmente (titlove). Svaki segment treba da ima maksimalno 5-7 reči.
    Za svaki segment odredi precizno vreme početka (start) i kraja (end) u sekundama.
    Vrati rezultat ISKLJUČIVO kao JSON niz objekata sa poljima "text", "start" i "end".
    Koristi isključivo srpska slova: č, ć, š, ž, đ.
    Primer: [{"text": "Zdravo, ovo je test", "start": 0.5, "end": 2.5}]
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

    if (!response.text) {
      throw new Error("Model nije vratio odgovor.");
    }

    const rawResult = JSON.parse(response.text.trim());
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `caption-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    console.error("Detaljna AI greška:", error);
    
    let userMessage = "Problem sa AI transkripcijom.";
    if (error.message?.includes("API key")) {
      userMessage = "API ključ nije validan ili nema dozvole za Gemini 3.";
    } else if (error.status === 429) {
      userMessage = "Previše zahteva odjednom. Sačekaj malo pa pokušaj ponovo.";
    } else if (videoFile.size > 25 * 1024 * 1024) {
      userMessage = "Video je prevelik za direktno slanje (limit je oko 20-25MB).";
    }

    throw new Error(userMessage);
  }
}
