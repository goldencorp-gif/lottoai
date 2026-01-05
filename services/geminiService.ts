
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS } from "../constants";

/**
 * Executes AI requests with a robust fallback strategy.
 * 
 * PRIORITY ORDER:
 * 1. Manual Key (LocalStorage) - Developer override.
 * 2. Environment Key (process.env) - Injected by Vite (works for Local Dev & Static Builds).
 * 3. Runtime Key (window.process) - For environments like IDX/AI Studio.
 * 4. Server Proxy (/api/generate) - For secure production deployments where key is hidden.
 */
async function executeGenAIRequest(model: string, contents: any, config?: any) {
  
  // 1. Gather Client-Side Keys
  let apiKey = (typeof window !== 'undefined' && localStorage.getItem('gemini_api_key'));
  
  if (!apiKey) {
      // Access the key injected by Vite config
      // @ts-ignore
      apiKey = process.env.API_KEY;
  }

  if (!apiKey && typeof window !== 'undefined') {
      apiKey = (window as any).process?.env?.API_KEY;
  }

  // 2. Try Client-Side Execution (Fastest & Easiest for Dev)
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({ 
        model, 
        contents, 
        config 
      });
      return {
        text: response.text || "",
        candidates: response.candidates,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (err: any) {
      console.warn("Client-side request failed. Attempting fallback if applicable...", err);
      // If the error is not about a missing key (e.g. Quota exceeded), we might still want to try the proxy
      // if we suspect the client key is just invalid but the server might have a valid one.
      // However, usually we just throw here to avoid double-latency unless it's a network error.
    }
  }

  // 3. Try Server-Side Proxy (Production Fallback)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, contents, config })
    });
    
    // Check if the endpoint actually exists (common error in local dev without Vercel)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        // If we get HTML (404), it means the API route doesn't exist
        if (text.includes("<!DOCTYPE html>")) {
           throw new Error("API Endpoint missing. (Note: '/api/generate' requires Vercel or a backend server).");
        }
        throw new Error("Server returned non-JSON response.");
    }

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error || `Server Error ${response.status}`);
    }

    return {
      text: data.text || "",
      candidates: data.candidates || [],
      groundingMetadata: data.groundingMetadata
    };
  } catch (err: any) {
    console.error("AI Service Error:", err);
    
    // Provide a specific, helpful error message based on the failure mode
    if (err.message.includes("API Endpoint missing")) {
         if (!apiKey) {
             throw new Error("Configuration Error: No API Key found. Please set API_KEY in your .env file or Vercel Settings.");
         }
    }
    
    throw new Error(err.message || "AI Service Unavailable. Please check your internet connection.");
  }
}

const getLanguageInstruction = (lang: Language) => {
  switch (lang) {
    case 'zh': return "Respond in Simplified Chinese.";
    case 'es': return "Respond in Spanish.";
    default: return "Respond in English.";
  }
};

const getOfficialSearchTerm = (game: string): string => {
  const map: Record<string, string> = {
    [LotteryGameType.US_POWERBALL]: "USA Powerball",
    [LotteryGameType.US_MEGA_MILLIONS]: "USA Mega Millions",
    [LotteryGameType.AU_POWERBALL]: "Australian Powerball",
  };
  return map[game] || game;
};

/**
 * Fetches the latest draw results using Google Search grounding.
 */
export async function fetchLatestDraws(game: string): Promise<{ data: string; sources: { title: string; uri: string }[] }> {
  const searchTerm = getOfficialSearchTerm(game);
  const prompt = `Find the 10 most recent official draw results for "${searchTerm}". Output each draw on a new line: "Date: Main Numbers (Bonus: Numbers)". Do not include extra text. Use Google Search for accuracy.`;

  try {
    const response = await executeGenAIRequest('gemini-3-pro-preview', prompt, {
      tools: [{ googleSearch: {} }],
    });

    if (!response.text) {
        throw new Error("AI returned empty data.");
    }

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.groundingMetadata?.groundingChunks || [];
    chunks.forEach((c: any) => {
      if (c.web?.uri) {
        sources.push({ title: c.web.title || "Official Source", uri: c.web.uri });
      }
    });

    return {
      data: response.text,
      sources: sources
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Performs deep statistical analysis and generates prediction entries using Pro model.
 */
export async function analyzeAndPredict(
  game: string,
  history: string,
  entryCount: number,
  luckyNumbers: number[] = [],
  unwantedNumbers: number[] = [],
  angelNumberHint: string = "",
  includeCoverageStrategy: boolean = false,
  enabledTheories: string[] = [],
  systemNumber: number | null = null,
  customConfig?: Partial<GameConfig>,
  language: Language = 'en'
): Promise<PredictionResult> {
  
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };
  const isSystem = systemNumber !== null && systemNumber > config.mainCount;
  
  const systemInstruction = `
    You are a Master Lottery Statistician. 
    Use advanced complex reasoning to evaluate patterns.
    ${getLanguageInstruction(language)}
    
    ANALYSIS REQUIREMENTS:
    1. HOT/COLD CHECK: Identify numbers appearing most and least in history.
    2. SEQUENTIAL GAP: Look for numbers that haven't appeared in a long duration.
    3. THEORIES: ${enabledTheories.join(', ')}.
    ${includeCoverageStrategy ? "OPTIMIZE FOR COVERAGE: Ensure entries spread across the number range to maximize statistical probability." : ""}
    
    GAME RULES: ${config.mainCount} balls (1-${config.mainRange}).
    
    EXCLUDE: ${unwantedNumbers.join(', ')}.
    FAVOR: ${luckyNumbers.join(', ')}.
    ${angelNumberHint ? `ANGEL SYMBOLISM: "${angelNumberHint}"` : ''}

    RETURN JSON ONLY.
  `;

  const userPrompt = `History Data Provided:\n${history}\n\nTask: Generate ${entryCount} ${isSystem ? 'System ' + systemNumber : 'Standard'} lines for ${game}.`;

  try {
    const response = await executeGenAIRequest('gemini-3-pro-preview', userPrompt, {
       systemInstruction,
       responseMimeType: "application/json",
       responseSchema: {
         type: Type.OBJECT,
         properties: {
           entries: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
           powerballs: { type: Type.ARRAY, items: { type: Type.NUMBER } },
           analysis: { type: Type.STRING },
           theoriesApplied: { type: Type.ARRAY, items: { type: Type.STRING } },
           strategicWeight: { type: Type.NUMBER }
         },
         required: ["entries", "analysis", "strategicWeight"]
       }
    });

    return JSON.parse(response.text || "{}") as PredictionResult;
  } catch (error: any) {
    throw new Error(error.message || "Prediction failed. Please try again.");
  }
}

/**
 * Scans market patterns and historical data to suggest lucky numbers.
 */
export async function getAiSuggestions(
  game: string,
  _history: string,
  enabledTheories: string[],
  unwantedNumbers: number[],
  angelInput: string,
  customConfig?: Partial<GameConfig>,
  _language: Language = 'en'
): Promise<number[]> {
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };

  const prompt = `Based on selected theories (${enabledTheories.join(', ')}), suggest 5 lucky numbers for ${game} (1-${config.mainRange}).
  Exclude: ${unwantedNumbers.join(', ')}. 
  Angel signal context: ${angelInput}.
  Return a JSON array of 5 numbers only.`;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER }
      }
    });
    return JSON.parse(response.text || "[]") as number[];
  } catch (error) {
    return [];
  }
}

/**
 * Generates an AI vision board image.
 */
export async function generateLuckyImage(numbers: number[], gameName: string): Promise<string | null> {
  const prompt = `A highly detailed, ethereal vision board for winning the ${gameName}. 
  The image should feature the lucky numbers ${numbers.join(', ')} integrated into a cosmic theme of wealth and prosperity. 
  Hyper-realistic, gold and indigo tones, sparkles and light rays.`;

  try {
    const response = await executeGenAIRequest('gemini-2.5-flash-image', {
       parts: [{ text: prompt }] 
    }, {
      imageConfig: { aspectRatio: "1:1" }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
