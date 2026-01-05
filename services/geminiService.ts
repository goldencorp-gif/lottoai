import { GoogleGenAI, Type } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS, LOTTERY_THEORIES } from "../constants";

// --- HYBRID API CLIENT ---

// This function determines whether to use the direct SDK (Preview Mode) 
// or the Vercel Serverless Function (Production Mode).
async function executeGenAIRequest(model: string, contents: any, config?: any) {
  let apiKey = "";
  try {
    // If running in a context where process.env is polyfilled (local Vite), use it.
    // In production Vercel, this might be undefined on the client, forcing the fetch fallback.
    apiKey = process.env.API_KEY || "";
  } catch (e) {
    // Ignore environment error
  }

  // OPTION 1: DIRECT SDK (Client-side Key Available - Local Dev)
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
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
      console.warn("Direct SDK failed, attempting backend proxy...", err);
      // Fallthrough to Option 2
    }
  }

  // OPTION 2: PROXY VIA VERCEL FUNCTION (Production)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, contents, config })
    });

    if (response.status === 404) {
      console.error("Backend function not found. Ensure Vercel functions are deployed.");
      throw new Error("Backend Service Not Found.");
    }

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
           errorMessage = errorJson.message;
        }
      } catch (e) {
        if (responseText && responseText.length < 200) {
            errorMessage = `Server Error: ${responseText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    
    return {
      text: data.text || "",
      candidates: data.candidates || [],
      groundingMetadata: data.groundingMetadata
    };
  } catch (err: any) {
    console.error("API Request Failed:", err);
    throw new Error(err.message || "Failed to connect to AI service.");
  }
}

// --- UTILITIES ---

const getLanguageInstruction = (lang: Language) => {
  switch (lang) {
    case 'zh': return "Respond in Simplified Chinese (Mandarin).";
    case 'es': return "Respond in Spanish.";
    case 'hi': return "Respond in Hindi.";
    case 'vi': return "Respond in Vietnamese.";
    default: return "Respond in English.";
  }
};

const getOfficialSearchTerm = (game: string): string => {
  const map: Record<string, string> = {
    [LotteryGameType.US_POWERBALL]: "US Powerball",
    [LotteryGameType.US_MEGA_MILLIONS]: "US Mega Millions",
    [LotteryGameType.EURO_MILLIONS]: "EuroMillions",
    [LotteryGameType.EURO_JACKPOT]: "EuroJackpot",
    [LotteryGameType.ITALIAN_SUPER]: "SuperEnalotto",
    [LotteryGameType.UK_LOTTO]: "UK National Lottery",
    [LotteryGameType.IRISH_LOTTO]: "Irish National Lottery",
    [LotteryGameType.LA_PRIMITIVA]: "La Primitiva Spain",
    [LotteryGameType.AU_SAT_LOTTO]: "Australian Saturday Lotto",
    [LotteryGameType.AU_MON_WED_LOTTO]: "Australian Monday Wednesday Lotto",
    [LotteryGameType.AU_OZ_LOTTO]: "Oz Lotto Australia",
    [LotteryGameType.AU_POWERBALL]: "Australian Powerball",
    [LotteryGameType.AU_SET_FOR_LIFE]: "Set for Life Australia"
  };
  return map[game] || game;
};

// --- API FUNCTIONS ---

export async function fetchLatestDraws(game: string): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const searchTerm = getOfficialSearchTerm(game);
  
  const prompt = `
    Task: Find the official winning numbers for "${searchTerm}".
    Action: Use Google Search to find the most recent results.
    
    CRITICAL LIMIT: Retrieve exactly the last 10 draws up to ${today}. 
    Do not process more than 10 rows.
    
    Required Output Format (Text Only List):
    "Draw [Date]: [Main Numbers] (Bonus: [Bonus Numbers])"
    
    Notes:
    - If the official site has 20+ results, IGNORE the older ones. Stop after 10.
    - Strictly formatted list only. No intro/outro text.
  `;

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
      tools: [{ googleSearch: {} }],
    });

    let text = response.text || "";
    
    if (!text) {
       if (response.groundingMetadata) {
         return "Found sources but couldn't extract text. Please verify manually via the 'Verify on Google' button.";
       }
       return "Could not retrieve results automatically. Please enter data manually.";
    }

    const chunks = response.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web?.uri)
      .filter((uri: string) => uri);

    if (sources.length > 0) {
      const uniqueSources = [...new Set(sources)];
      text += "\n\n--- Verified Sources ---\n" + uniqueSources.slice(0, 3).join('\n');
    }

    return text;
  } catch (error) {
    console.error("Error fetching latest draws:", error);
    throw error;
  }
}

export async function generateLuckyImage(numbers: number[], gameName: string): Promise<string | null> {
  const focusNumbers = numbers.slice(0, 5).join(', ');
  const prompt = `A cinematic, high-quality 3D render of lottery balls for the game ${gameName} with the numbers ${focusNumbers} floating in a mystical, golden glowing void. 
  The balls are shiny, polished textures. There is magical gold dust in the air. 
  The lighting is dramatic and luxurious. Photorealistic, 8k resolution, lottery luck theme.`;

  try {
    const response = await executeGenAIRequest('gemini-2.5-flash-image', {
       parts: [{ text: prompt }]
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}

export async function getAiSuggestions(
  game: string,
  history: string,
  enabledTheories: string[],
  unwantedNumbers: number[] = [],
  angelNumberHint: string = "",
  customConfig?: Partial<GameConfig>,
  language: Language = 'en'
): Promise<number[]> {
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };
  const langPrompt = getLanguageInstruction(language);

  const exclusionPrompt = unwantedNumbers.length > 0
    ? `CRITICAL EXCLUSION: You MUST NOT include any of these numbers: ${unwantedNumbers.join(', ')}.`
    : "";
  
  const angelContext = angelNumberHint
    ? `CONSIDER ANGEL HINT: "${angelNumberHint}". If this hint suggests numbers, prioritize them.`
    : "";

  const prompt = `
    You are an expert Lottery Analyst.
    ${langPrompt}
    Game: ${game} (${config.mainCount} balls, 1-${config.mainRange}).
    
    HISTORY DATA:
    ${history || "No history provided."}

    Theories: ${enabledTheories.join(', ')}.
    ${angelContext}

    Task: Return 5-10 strong candidate numbers based on the analysis.
    ${exclusionPrompt}

    Return ONLY a JSON object: { "numbers": [int] }
  `;

  try {
     const response = await executeGenAIRequest('gemini-3-flash-preview', prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numbers: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER }
            }
          }
        }
     });
    
    const json = JSON.parse(response.text || "{}");
    return json.numbers || [];
  } catch (error) {
    console.error("Suggestion Error", error);
    return [];
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
  
  const isSystem = systemNumber !== null && systemNumber > config.mainCount;
  
  const isSeparateBarrelGame = 
    game === LotteryGameType.US_POWERBALL || 
    game === LotteryGameType.US_MEGA_MILLIONS || 
    game === LotteryGameType.EURO_MILLIONS || 
    game === LotteryGameType.EURO_JACKPOT || 
    game === LotteryGameType.ITALIAN_SUPER || 
    game === LotteryGameType.LA_PRIMITIVA || 
    game === LotteryGameType.AU_POWERBALL;
  
  const langPrompt = getLanguageInstruction(language);

  const coveragePrompt = includeCoverageStrategy 
    ? `STRATEGY: Win Coverage is ACTIVE. Calculate probabilities for Top 3 divisions. Provide 'coverageStats'.`
    : "";

  const exclusionPrompt = unwantedNumbers.length > 0
    ? `EXCLUDE: ${unwantedNumbers.join(', ')}.`
    : "";

  const angelContext = angelNumberHint
    ? `ANGEL SIGNAL: "${angelNumberHint}". Prioritize patterns matching this signal.`
    : "";

  const theoryContext = LOTTERY_THEORIES
    .filter(t => enabledTheories.includes(t.name))
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const historyContent = history && history.trim().length > 0
    ? `HISTORY DATA PROVIDED:\n${history}\n\n*** CRITICAL INSTRUCTION ***:\n1. Analyze the history specifically for Hot (frequent) and Cold (overdue) numbers.\n2. In your analysis JSON field, you MUST explicitly mention which numbers were chosen based on history.`
    : `NO HISTORY DATA.\nPerform Theoretical Probability Analysis only.`;

  const powerballInstructions = isSeparateBarrelGame 
    ? `TWO BARRELS: Main (1-${config.mainRange}) and Bonus (1-${config.bonusRange || 20}). Analyze independently. Output 'powerballs' array.`
    : "ONE BARREL: Main numbers only. Ignore 'powerballs' output.";

  const systemInstruction = `
    You are an expert Lottery Analyst.
    ${langPrompt}
    
    Game: ${game}
    Structure: ${config.mainCount} balls (1-${config.mainRange}).
    
    Enabled Theories:
    ${theoryContext || "General Statistics"}

    ${angelContext}
    ${powerballInstructions}
    
    Mode: ${isSystem ? `System ${systemNumber}` : 'Standard'} (${entryCount} lines).

    ${exclusionPrompt}
    ${coveragePrompt}
    
    ${historyContent}

    Return JSON:
    - entries: Array of arrays (main numbers only, sorted).
    - powerballs: Array of numbers (if applicable).
    - analysis: Explanation of strategy. Mention specific history trends if data was provided.
    - theoriesApplied: List of theories.
    - suggestedNumbers: List of top picks.
    - strategicWeight: Confidence score (1-100).
    - coverageStats: Optional array of { division, probability, requirement }.
  `;

  const userPrompt = `
    Entry Count: ${entryCount}
    Lucky Numbers: ${luckyNumbers.join(', ') || 'None'}
    Unwanted: ${unwantedNumbers.join(', ') || 'None'}
    Angel Hint: ${angelNumberHint || 'None'}
    
    Generate predictions now.
  `;

  const schemaProperties: any = {
    entries: {
      type: Type.ARRAY,
      items: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER }
      }
    },
    analysis: { type: Type.STRING },
    theoriesApplied: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    suggestedNumbers: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER }
    },
    strategicWeight: { type: Type.NUMBER },
    coverageStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          division: { type: Type.STRING },
          probability: { type: Type.STRING },
          requirement: { type: Type.STRING }
        },
        required: ["division", "probability", "requirement"]
      }
    }
  };

  if (isSeparateBarrelGame) {
    schemaProperties.powerballs = {
      type: Type.ARRAY,
      items: { type: Type.NUMBER }
    };
  }

  try {
    const response = await executeGenAIRequest('gemini-3-flash-preview', userPrompt, {
       systemInstruction,
       responseMimeType: "application/json",
       responseSchema: {
         type: Type.OBJECT,
         properties: schemaProperties,
         required: ["entries", "analysis", "theoriesApplied", "strategicWeight", "suggestedNumbers"]
       }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      systemLabel: isSystem ? `System ${systemNumber}` : 'Standard',
      groundingSources: response.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Market Data",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri)
    };
  } catch (error) {
    console.error("Prediction Error:", error);
    throw new Error("Analysis engine failed.");
  }
}