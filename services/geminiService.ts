
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  // Sigurniji način pristupa environment varijabli u browseru
  let apiKey = "";
  
  try {
    // @ts-ignore
    apiKey = process.env.API_KEY;
  } catch (e) {
    console.error("Greška pri čitanju process.env:", e);
  }

  // Debug poruka u konzoli (vidljiva samo tebi u F12)
  console.log("Provera API ključa...", apiKey ? "Ključ je detektovan." : "Ključ NIJE detektovan.");

  if (!apiKey || apiKey === "undefined") {
    throw new Error("API ključ nije detektovan. OBAVEZNO uradi 'Redeploy' na Vercelu nakon dodavanja Environment varijable!");
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
      throw new Error("Model nije vratio tekst. Pokušaj ponovo.");
    }

    const rawResult = JSON.parse(response.text.trim());
    return rawResult.map((c: any, index: number) => ({
      ...c,
      id: `caption-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    console.error("Detaljna AI greška:", error);
    
    let userMessage = "Greška u AI obradi.";
    if (error.message?.includes("API key")) {
      userMessage = "API ključ nije validan. Proveri da li je 'Generative Language API' omogućen u Google Cloud konzoli.";
    } else if (error.status === 429) {
      userMessage = "Limit zahteva je dostignut (Rate Limit). Sačekaj 60 sekundi.";
    }

    throw new Error(userMessage);
  }
}
