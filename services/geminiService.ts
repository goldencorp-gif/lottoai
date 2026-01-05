
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS } from "../constants";

/**
 * Executes AI requests.
 * STRATEGY: PROXY FIRST (Business Mode)
 * 1. Try to call the backend API (/api/generate). This keeps keys secure and UX clean.
 * 2. If a developer/user has manually set a key in LocalStorage (Dev Mode), use that directly.
 */
async function executeGenAIRequest(model: string, contents: any, config?: any) {
  
  // 1. Check for Manual Dev Key (Optional override for developers)
  const localStoredKey = (typeof window !== 'undefined' && localStorage.getItem('gemini_api_key'));
  
  // If a manual key exists, use Client-Side execution (Dev Mode)
  if (localStoredKey) {
    const ai = new GoogleGenAI({ apiKey: localStoredKey });
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
    } catch (err) {
      console.warn("Manual Key failed, falling back to server...", err);
    }
  }

  // 2. Default: Call Server-Side Proxy (Business Mode)
  // This is what 99% of users will use. No login required.
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, contents, config })
    });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        // If we get HTML back (like a 404 page), the backend isn't configured correctly.
        throw new Error("Server API not reachable. Please ensure the app is deployed correctly.");
    }

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error || "Server processing failed.");
    }

    return {
      text: data.text || "",
      candidates: data.candidates || [],
      groundingMetadata: data.groundingMetadata
    };
  } catch (err: any) {
    console.error("AI Service Error:", err);
    throw new Error("AI Service Unavailable. Please try again later.");
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
        throw new Error("Analysis engine returned empty data.");
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
    throw new Error("Prediction failed. Please try again.");
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
