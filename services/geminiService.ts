import { GoogleGenAI, Type } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS, LOTTERY_THEORIES } from "../constants";

/**
 * Internal helper to execute GenAI requests with direct SDK access and fallback proxy support.
 */
async function executeGenAIRequest(model: string, contents: any, config?: any) {
  let apiKey = "";
  try {
    apiKey = process.env.API_KEY || "";
  } catch (e) {}

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return {
        text: response.text || "",
        candidates: response.candidates,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (err) {
      console.warn("Direct SDK failed, attempting backend proxy...", err);
    }
  }

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, contents, config })
    });
    const data = await response.json();
    return {
      text: data.text || "",
      candidates: data.candidates || [],
      groundingMetadata: data.groundingMetadata
    };
  } catch (err: any) {
    throw new Error(err.message || "Failed to connect to AI service.");
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
export async function fetchLatestDraws(game: string): Promise<string> {
  const searchTerm = getOfficialSearchTerm(game);
  const prompt = `Find the 10 most recent official draw results for "${searchTerm}". Output each draw on a new line: "Date: Main Numbers (Bonus: Numbers)". Do not include extra text. Use Google Search for accuracy.`;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
      tools: [{ googleSearch: {} }],
    });

    let text = response.text || "";
    const chunks = response.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web?.uri).filter((u: string) => u);

    if (sources.length > 0) {
      text += "\n\nSOURCES:\n" + [...new Set(sources)].slice(0, 3).join('\n');
    }
    return text;
  } catch (error) {
    throw error;
  }
}

/**
 * Performs deep statistical analysis and generates prediction entries.
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
    ${getLanguageInstruction(language)}
    
    ANALYSIS REQUIREMENTS:
    1. HOT/COLD CHECK: Identify numbers appearing most and least in history.
    2. SEQUENTIAL GAP: Look for numbers that haven't appeared in a long duration.
    3. THEORIES: ${enabledTheories.join(', ')}.
    
    GAME RULES: ${config.mainCount} balls (1-${config.mainRange}).
    
    EXCLUDE: ${unwantedNumbers.join(', ')}.
    FAVOR: ${luckyNumbers.join(', ')}.
    ${angelNumberHint ? `ANGEL SYMBOLISM: "${angelNumberHint}"` : ''}

    RETURN JSON ONLY.
  `;

  const userPrompt = `History:\n${history}\n\nGenerate ${entryCount} ${isSystem ? 'System ' + systemNumber : 'Standard'} lines.`;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', userPrompt, {
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error("AI Prediction failed.");
  }
}

/**
 * Scans market patterns and historical data to suggest lucky numbers.
 */
export async function getAiSuggestions(
  game: string,
  history: string,
  enabledTheories: string[],
  unwantedNumbers: number[],
  angelInput: string,
  customConfig?: Partial<GameConfig>,
  language: Language = 'en'
): Promise<number[]> {
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };

  const prompt = `Based on history and selected theories (${enabledTheories.join(', ')}), suggest 5 lucky numbers for ${game} (1-${config.mainRange}).
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
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Suggestions failed", error);
    return [];
  }
}

/**
 * Generates an AI vision board image based on lucky numbers using the Flash Image model.
 */
export async function generateLuckyImage(numbers: number[], gameName: string): Promise<string | null> {
  const prompt = `A highly detailed, ethereal vision board for winning the ${gameName}. 
  The image should feature the lucky numbers ${numbers.join(', ')} integrated into a cosmic theme of wealth and prosperity. 
  Hyper-realistic, gold and indigo tones, sparkles and light rays.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    // Iterate through parts to find the image part
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Lucky image generation failed", error);
    return null;
  }
}