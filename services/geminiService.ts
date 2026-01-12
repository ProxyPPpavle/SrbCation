
import { GoogleGenAI, Type } from "@google/genai";
import { Caption } from "../types.ts";

export async function transcribeVideo(videoFile: File): Promise<Caption[]> {
  // --- AGRESIVNI DEBUG I PRETRAGA ---
  // Pokušavamo da nađemo ključ na svim mestima gde bi ga build tool ili platforma mogli ostaviti
  const searchEnv = () => {
    try {
      // 1. Standardni process.env
      // @ts-ignore
      if (typeof process !== 'undefined' && process && process.env && process.env.API_KEY) return process.env.API_KEY;
      
      // 2. Vite / moderni bundleri (import.meta.env)
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta && import.meta.env && import.meta.env.API_KEY) return import.meta.env.API_KEY;
      
      // 3. Globalni window objekti (često korišćeno za runtime config)
      const win = window as any;
      if (win.process?.env?.API_KEY) return win.process.env.API_KEY;
      if (win._env_?.API_KEY) return win._env_.API_KEY;
      if (win.ENV?.API_KEY) return win.ENV.API_KEY;
      if (win.API_KEY) return win.API_KEY;
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const apiKey = searchEnv();

  // ISPIS U KONZOLU KAO ŠTO JE KORISNIK TRAŽIO
  console.group("🚀 Srb Caption - DETALJNA DIJAGNOSTIKA");
  console.log("KORISNIČKI ZAHTEV: Štampanje svih dostupnih varijabli...");
  
  // Bezbedno štampanje process.env ako postoji
  try {
    // @ts-ignore
    console.log("Status 'process':", typeof process !== 'undefined' ? "Postoji" : "NE POSTOJI");
    // @ts-ignore
    if (typeof process !== 'undefined') console.log("Sadržaj process.env:", process.env);
  } catch(e) {
    console.log("Greška pri čitanju process.env:", e);
  }

  // Štampanje window.process ako postoji
  try {
    console.log("Window Process Env:", (window as any).process?.env);
  } catch(e) {}

  // Provera Vite/ESM okruženja
  try {
    // @ts-ignore
    console.log("Status 'import.meta.env':", typeof import.meta !== 'undefined' && import.meta.env ? "Postoji" : "NE POSTOJI");
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) console.log("Sadržaj import.meta.env:", import.meta.env);
  } catch(e) {}

  console.log("FINALNI REZULTAT PRETRAGE ZA 'API_KEY':", apiKey ? "PRONAĐEN ✅" : "NIJE PRONAĐEN ❌");
  
  if (apiKey) {
    console.log("Prva 4 karaktera ključa:", apiKey.substring(0, 4) + "****");
    console.log("PUNA VREDNOST KLJUČA (samo za tebe):", apiKey);
  } else {
    console.warn("UPOZORENJE: Vercel ne prosleđuje tvoje Environment Varijable u browser!");
    console.log("SAVET: Proveri u Vercelu 'Settings -> Environment Variables'.");
    console.log("Ako 'API_KEY' ne radi, probaj da dodaš novu varijablu 'VITE_API_KEY' sa istim ključem.");
  }
  console.groupEnd();
  // ---------------------------------

  if (!apiKey) {
    throw new Error(`Greška: API_KEY nije pronađen u browseru. 
    Vercel panel kaže da je tu, ali kôd ga ne vidi. 
    REŠENJE: Probaj da u Vercelu dodaš varijablu pod imenom 'VITE_API_KEY' (pored ove obične). 
    Nakon toga obavezno uradi novi Redeploy.`);
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
