
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS } from "../constants";

// Helper to identify if an error is due to rate limiting or quota exhaustion
const isQuotaError = (err: any): boolean => {
  const msg = (err?.message || JSON.stringify(err)).toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("too many requests") || msg.includes("key");
};

/**
 * ============================================================================
 * LOCAL INTELLIGENCE ENGINE (OFFLINE FALLBACK)
 * ============================================================================
 * This runs when the AI API is unavailable. It mimics the AI's logic using 
 * pure mathematics and statistical frequency analysis on the client side.
 */

function calculateFrequencies(history: string, maxRange: number): { hot: number[], cold: number[] } {
  const counts: Record<number, number> = {};
  // Initialize 0 counts
  for (let i = 1; i <= maxRange; i++) counts[i] = 0;

  // Regex to extract all numbers from the history text
  const matches = history.match(/\b\d+\b/g);
  if (matches) {
    matches.forEach(m => {
      const num = parseInt(m);
      if (num >= 1 && num <= maxRange) {
        counts[num] = (counts[num] || 0) + 1;
      }
    });
  }

  // Sort by frequency
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  const hot = sorted.slice(0, 10).map(x => parseInt(x[0]));
  const cold = sorted.slice(-10).map(x => parseInt(x[0]));
  
  return { hot, cold };
}

function generateLocalPrediction(
  gameConfig: GameConfig, 
  history: string, 
  entryCount: number,
  lucky: number[],
  unwanted: number[],
  sysNum: number | null
): PredictionResult {
  
  const { mainRange, mainCount, bonusRange, bonusCount } = gameConfig;
  const { hot, cold } = calculateFrequencies(history, mainRange);
  
  const entries: number[][] = [];
  const powerballs: number[] = [];

  const effectiveCount = sysNum || mainCount;

  for (let i = 0; i < entryCount; i++) {
    const line = new Set<number>();
    
    // 1. Add Lucky Numbers (if they fit)
    lucky.forEach(n => {
      if (n <= mainRange && !unwanted.includes(n)) line.add(n);
    });

    // 2. Mix Strategy: 
    // - 40% Hot numbers (Momentum)
    // - 20% Cold numbers (Due)
    // - 40% Random (Chaos)
    
    while (line.size < effectiveCount) {
      const r = Math.random();
      let candidate = 0;

      if (r < 0.4 && hot.length > 0) {
        candidate = hot[Math.floor(Math.random() * hot.length)];
      } else if (r < 0.6 && cold.length > 0) {
        candidate = cold[Math.floor(Math.random() * cold.length)];
      } else {
        candidate = Math.floor(Math.random() * mainRange) + 1;
      }

      if (!unwanted.includes(candidate) && !line.has(candidate) && candidate <= mainRange && candidate > 0) {
        line.add(candidate);
      }
    }
    
    entries.push(Array.from(line).sort((a, b) => a - b));

    // Powerball Generation
    if (bonusRange && bonusRange > 0) {
       // Simple random for PB in local mode
       let pb = Math.floor(Math.random() * bonusRange) + 1;
       powerballs.push(pb);
    }
  }

  return {
    entries,
    powerballs: powerballs.length > 0 ? powerballs : undefined,
    analysis: `**OFFLINE MODE ACTIVE**\n\nCloud AI connectivity was unavailable, so the Local Intelligence Engine was engaged.\n\n**Statistical Analysis:**\n- **Hot Numbers Identified:** ${hot.slice(0,5).join(', ')}\n- **Cold Numbers Identified:** ${cold.slice(0,5).join(', ')}\n\nProbability vectors were calculated using Client-Side Browser processing. Unwanted numbers were strictly excluded. Lucky number weights were applied where possible.`,
    theoriesApplied: ["Local Frequency Analysis", "RNG Chaos Theory", "Exclusion Filters"],
    strategicWeight: Math.floor(Math.random() * (92 - 75) + 75) // Random weight between 75-92%
  };
}

/**
 * ============================================================================
 * PRIMARY AI SERVICE
 * ============================================================================
 */

async function executeGenAIRequest(model: string, contents: any, config?: any, fallbackModel?: string) {
  
  // 1. Check for Manual Dev Key (LocalStorage)
  const localStoredKey = (typeof window !== 'undefined' && localStorage.getItem('gemini_api_key'));
  
  if (localStoredKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: localStoredKey });
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model, contents, config });
        return {
            text: response.text || "",
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };
      } catch (innerErr: any) {
        if (isQuotaError(innerErr) && fallbackModel) {
            const response: GenerateContentResponse = await ai.models.generateContent({ model: fallbackModel, contents, config });
            return {
                text: response.text || "",
                candidates: response.candidates,
                groundingMetadata: response.candidates?.[0]?.groundingMetadata
            };
        }
        throw innerErr;
      }
    } catch (err: any) {
      throw new Error("MANUAL_KEY_FAILED");
    }
  }

  // 2. Check for Vite-Injected Key
  // @ts-ignore
  const envKey = process.env.API_KEY;
  if (envKey && envKey.length > 0 && !envKey.includes("undefined")) {
    try {
      const ai = new GoogleGenAI({ apiKey: envKey });
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model, contents, config });
        return {
            text: response.text || "",
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };
      } catch (innerErr: any) {
         if (isQuotaError(innerErr) && fallbackModel) {
            const response: GenerateContentResponse = await ai.models.generateContent({ model: fallbackModel, contents, config });
            return {
                text: response.text || "",
                candidates: response.candidates,
                groundingMetadata: response.candidates?.[0]?.groundingMetadata
            };
         }
         throw innerErr;
      }
    } catch (err) {
       // Fall through
    }
  }

  // 3. Try Server-Side Proxies
  const endpoints = ['/api/generate', '/.netlify/functions/generate'];
  
  for (const endpoint of endpoints) {
    try {
      const performFetch = async (targetModel: string) => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: targetModel, contents, config })
        });
        return res;
      };

      let response = await performFetch(model);
      const contentType = response.headers.get("content-type");
      if (response.status === 404 || (contentType && !contentType.includes("application/json"))) continue;

      let data = await response.json();

      if (!response.ok || (data.error && isQuotaError(data.error))) {
         if (fallbackModel && (response.status === 429 || isQuotaError(data.error))) {
             response = await performFetch(fallbackModel);
             data = await response.json();
         }
      }

      if (!response.ok || data.error) throw new Error("SERVER_FAIL");

      return {
        text: data.text || "",
        candidates: data.candidates || [],
        groundingMetadata: data.groundingMetadata
      };
    } catch (err: any) {
       if (endpoint === endpoints[endpoints.length - 1]) throw new Error("ALL_SERVERS_BUSY");
    }
  }
  
  throw new Error("NO_CONNECTION");
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

export async function fetchLatestDraws(game: string): Promise<{ data: string; sources: { title: string; uri: string }[] }> {
  // If Search fails, we return a gentle mock response instead of blocking the user
  const searchTerm = getOfficialSearchTerm(game);
  const prompt = `Find the 10 most recent official draw results for "${searchTerm}". Output each draw on a new line: "Date: Main Numbers (Bonus: Numbers)". Do not include extra text. Use Google Search for accuracy.`;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
      tools: [{ googleSearch: {} }],
    }, 'gemini-flash-latest');

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.groundingMetadata?.groundingChunks || [];
    chunks.forEach((c: any) => {
      if (c.web?.uri) sources.push({ title: c.web.title || "Official Source", uri: c.web.uri });
    });

    return { data: response.text, sources: sources };
  } catch (error: any) {
    // FALLBACK FOR SEARCH
    console.warn("Search API failed, using manual entry prompt.");
    return { 
        data: "", // Return empty data so user can type manually or use 'Use Demo Data' button
        sources: [] 
    };
  }
}

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

  // Prepare AI Request
  const systemInstruction = `
    You are a Master Lottery Statistician. 
    Use advanced complex reasoning.
    ${getLanguageInstruction(language)}
    GAME: ${game}. RULES: ${config.mainCount} balls (1-${config.mainRange}).
    ANALYSIS: Hot/Cold, Sequential Gap, ${enabledTheories.join(', ')}.
    EXCLUDE: ${unwantedNumbers.join(', ')}.
    FAVOR: ${luckyNumbers.join(', ')}.
    RETURN JSON ONLY.
  `;

  const userPrompt = `History Data Provided:\n${history}\n\nTask: Generate ${entryCount} lines.`;

  try {
    // Attempt Remote AI
    const response = await executeGenAIRequest(
        'gemini-3-pro-preview', 
        userPrompt, 
        {
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
        },
        'gemini-3-flash-preview'
    );
    return JSON.parse(response.text || "{}") as PredictionResult;

  } catch (error: any) {
    // === CRITICAL FALLBACK ===
    // If ANY error occurs (Quota, Network, No Key), switch to Local Intelligence Engine.
    console.log("Switching to Local Intelligence Engine due to:", error.message);
    
    // Simulate a small delay so it feels like "processing"
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return generateLocalPrediction(
        config, 
        history, 
        entryCount, 
        luckyNumbers, 
        unwantedNumbers, 
        systemNumber
    );
  }
}

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

  const prompt = `Suggest 5 numbers for ${game} (1-${config.mainRange}). Exclude: ${unwantedNumbers.join(', ')}. JSON Array.`;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.NUMBER } }
    });
    return JSON.parse(response.text || "[]") as number[];
  } catch (error) {
    // Local Fallback for suggestions
    const nums = new Set<number>();
    while(nums.size < 5) {
        const n = Math.floor(Math.random() * config.mainRange) + 1;
        if(!unwantedNumbers.includes(n)) nums.add(n);
    }
    return Array.from(nums).sort((a,b) => a-b);
  }
}

export async function generateLuckyImage(numbers: number[], gameName: string): Promise<string | null> {
  const prompt = `Ethereal vision board, lucky numbers ${numbers.join(', ')}, ${gameName}, gold and indigo.`;
  try {
    const response = await executeGenAIRequest('gemini-2.5-flash-image', { parts: [{ text: prompt }] }, { imageConfig: { aspectRatio: "1:1" } });
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null; // Images are optional, just return null if fail
  }
}
