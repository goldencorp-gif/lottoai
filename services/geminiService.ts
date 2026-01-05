
import { GoogleGenAI, Type } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS, LOTTERY_THEORIES } from "../constants";

// Helper to safely get the AI client
// We initialize lazily to prevent "process is not defined" errors during initial page load
const getAiClient = () => {
  let apiKey = "";
  try {
    // We access process.env.API_KEY safely. 
    // If a bundler replaces this string, it becomes a string literal.
    // If not, and process is undefined, the catch block handles the crash.
    apiKey = process.env.API_KEY || "";
  } catch (e) {
    console.warn("Runtime Environment Warning: Could not access process.env.API_KEY. Ensure you have a valid API Key configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

const getLanguageInstruction = (lang: Language) => {
  switch (lang) {
    case 'zh': return "Respond in Simplified Chinese (Mandarin).";
    case 'es': return "Respond in Spanish.";
    case 'hi': return "Respond in Hindi.";
    case 'vi': return "Respond in Vietnamese.";
    default: return "Respond in English.";
  }
};

// Maps internal/affiliate game names to the Official Global names for better search results
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
    
    // Australian mappings
    [LotteryGameType.AU_SAT_LOTTO]: "Australian Saturday Lotto",
    [LotteryGameType.AU_MON_WED_LOTTO]: "Australian Monday Wednesday Lotto",
    [LotteryGameType.AU_OZ_LOTTO]: "Oz Lotto Australia",
    [LotteryGameType.AU_POWERBALL]: "Australian Powerball",
    [LotteryGameType.AU_SET_FOR_LIFE]: "Set for Life Australia"
  };
  return map[game] || game;
};

export async function fetchLatestDraws(game: string): Promise<string> {
  const ai = getAiClient();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const searchTerm = getOfficialSearchTerm(game);
  
  // Optimized prompt for "Auto-Sync"
  // Strictly limits the AI to 10 results to prevent long processing times
  const prompt = `
    Task: Find the official winning numbers for "${searchTerm}".
    Action: Use Google Search to find the most recent results.
    
    CRITICAL LIMIT: Retrieve exactly the last 10 draws up to ${today}. 
    Do not process more than 10 rows to ensure speed.
    
    Required Output Format (Text Only List):
    "Draw [Date]: [Main Numbers] (Bonus: [Bonus Numbers])"
    
    Notes:
    - If the official site has 20+ results, IGNORE the older ones. Stop after 10.
    - Strictly formatted list only. No intro/outro text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "";
    
    if (!text) {
       if (response.candidates?.[0]?.groundingMetadata) {
         return "Found sources but couldn't extract text. Please verify manually via the 'Verify on Google' button.";
       }
       return "Could not retrieve results automatically. Please enter data manually.";
    }

    // Extract grounding sources (URLs)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
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
  const ai = getAiClient();
  const focusNumbers = numbers.slice(0, 5).join(', ');
  const prompt = `A cinematic, high-quality 3D render of lottery balls with the numbers ${focusNumbers} floating in a mystical, golden glowing void. 
  The balls are shiny, polished textures. There is magical gold dust in the air. 
  The lighting is dramatic and luxurious. Photorealistic, 8k resolution, lottery luck theme.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
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
  const ai = getAiClient();
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };

  const exclusionPrompt = unwantedNumbers.length > 0
    ? `CRITICAL EXCLUSION: You MUST NOT include any of these numbers: ${unwantedNumbers.join(', ')}.`
    : "";

  const angelContext = angelNumberHint
    ? `USER ANGEL SIGNAL: The user has provided a specific signal/sighting: "${angelNumberHint}". Interpret this signal into relevant numbers (e.g., if they saw 11:11, consider 11 or 22; if they saw birds, consider numbers associated with symbols). PRIORITIZE patterns matching this signal within the Angel Numbers Theory.`
    : "";

  const theoryContext = LOTTERY_THEORIES
    .filter(t => enabledTheories.includes(t.name))
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const allTheoryNames = LOTTERY_THEORIES.map(t => t.name);
  const disabledTheories = allTheoryNames.filter(name => !enabledTheories.includes(name));
  const negativePrompt = disabledTheories.length > 0 
      ? `STRICT CONSTRAINT: You must IGNORE the following theories as they are disabled: ${disabledTheories.join(', ')}. Do not let these methods influence the selection.` 
      : "";
  
  const historyContent = history && history.trim().length > 0
    ? `History: ${history}`
    : `History: NO HISTORICAL DATA PROVIDED.
       ACTION: Generate numbers based purely on Theoretical Probability for a ${config.mainCount}/${config.mainRange} game structure. 
       Ignore "Repeat Numbers Theory" and "Similar Sequence Theory" as there is no history to analyze. Focus on Angel Numbers or Random Distribution.`;

  const prompt = `
    You are an expert Lottery Analyst using specific mathematical models.
    Game: ${game} (${config.mainCount} numbers from 1-${config.mainRange}).
    ${historyContent}
    
    You must strictly apply ONLY the following enabled theories to find the strongest numbers:
    ${theoryContext || "Apply general statistical frequency and distribution analysis only."}

    ${negativePrompt}
    ${angelContext}

    Task: Analyze the context and identify 5-10 numbers that best satisfy the criteria of the ENABLED theories listed above.
    ${exclusionPrompt}

    Return ONLY a JSON object with a property 'numbers' containing an array of integers.
  `;

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
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
  
  const ai = getAiClient();
  const baseConfig = GAME_CONFIGS[game as LotteryGameType] || GAME_CONFIGS[LotteryGameType.CUSTOM];
  const config = { ...baseConfig, ...customConfig };
  
  const actualMainCount = systemNumber || config.mainCount;
  const isSystem = systemNumber !== null && systemNumber > config.mainCount;
  
  // Updated separate barrel logic to include AU Powerball
  const isSeparateBarrelGame = 
    game === LotteryGameType.US_POWERBALL || 
    game === LotteryGameType.US_MEGA_MILLIONS || 
    game === LotteryGameType.EURO_MILLIONS || 
    game === LotteryGameType.EURO_JACKPOT || 
    game === LotteryGameType.LA_PRIMITIVA || 
    game === LotteryGameType.AU_POWERBALL;
  
  const langPrompt = getLanguageInstruction(language);

  const coveragePrompt = includeCoverageStrategy 
    ? `EXTREMELY IMPORTANT: The user wants a "Win Coverage Strategy". 
       Based on the mathematical odds of ${game} (${config.mainCount} balls from ${config.mainRange}) and the fact they are playing ${entryCount} ${isSystem ? `System ${systemNumber}` : 'Standard'} entries:
       1. Calculate the approximate probability of winning the Top 3 divisions (Div 1, Div 2, Div 3).
       2. For 'probability', provide the odds (e.g., '1 in 8,000,000' or '1 in 500'). NEVER return 'N/A' or 'Unknown'. If specific odds are complex, provide a best-effort mathematical estimate based on combinations.
       3. For 'requirement', explicitly state the win condition (e.g., 'Match 6 Main', 'Match 5 + Supp'). NEVER return 'N/A'.
       4. Provide exactly 3 rows in the 'coverageStats' array for the top 3 prize tiers.
       Ensure the text explanation is in ${language}.`
    : "";

  const exclusionPrompt = unwantedNumbers.length > 0
    ? `CRITICAL EXCLUSION: You MUST NOT include any of these numbers: ${unwantedNumbers.join(', ')}.`
    : "";

  const angelContext = angelNumberHint
    ? `USER ANGEL SIGNAL: The user has provided a specific signal/sighting: "${angelNumberHint}". Interpret this signal into relevant numbers (e.g., if they saw 11:11, consider 11 or 22; if they saw birds, consider numbers associated with symbols). PRIORITIZE patterns matching this signal within the Angel Numbers Theory.`
    : "";

  const theoryContext = LOTTERY_THEORIES
    .filter(t => enabledTheories.includes(t.name))
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const allTheoryNames = LOTTERY_THEORIES.map(t => t.name);
  const disabledTheories = allTheoryNames.filter(name => !enabledTheories.includes(name));
  const negativePrompt = disabledTheories.length > 0 
      ? `STRICT CONSTRAINT: You must IGNORE the following theories as they are disabled: ${disabledTheories.join(', ')}. Do not let these methods influence the selection.` 
      : "";

  const powerballInstructions = isSeparateBarrelGame 
    ? `
      CRITICAL TWO-BARREL GAME INSTRUCTION:
      The Game is ${game}. It has TWO separate barrels.
      1. Main Barrel: Numbers 1 to ${config.mainRange}.
      2. Bonus/Power/Star Barrel: Numbers 1 to ${config.bonusRange || 20}.
      
      You must analyze both barrels independently from the history.
      For each entry, you MUST provide:
      - The Main Numbers in the 'entries' array.
      - A SINGLE strongest Powerball/MegaBall/Star number in the 'powerballs' array. 
      (Even if the game draws 2 stars like EuroMillions, provide the ONE most statistically probable number for this field).
      `
    : "IMPORTANT: ONLY provide the MAIN set of numbers for each entry. IGNORE supplementary/bonus numbers in the output.";

  const historyContent = history && history.trim().length > 0
    ? `History: ${history}`
    : `History: NO HISTORICAL DATA PROVIDED.
       IMPORTANT: You must perform a "Cold Analysis" based purely on Theoretical Probability and the Game Rules defined above.
       - Do not reference past draws.
       - Use Random Distribution logic combined with enabled theories (like Angel Numbers if applicable).
       - In the 'analysis' section, explicitly state that this is a Theoretical Projection because no history was provided.`;

  const systemInstruction = `
    You are an expert Global Lottery Analyst and Mathematician. 
    ${langPrompt}
    
    Game: ${game}
    Structure: ${config.mainCount} main numbers (range 1-${config.mainRange}).
    
    You must apply ONLY the following enabled theories:
    ${theoryContext || "General statistical analysis only."}

    ${negativePrompt}
    ${angelContext}

    ${powerballInstructions}
    
    ${isSystem ? `System ${systemNumber} Mode: Provide ${systemNumber} numbers per entry.` : `Standard Mode: Provide ${config.mainCount} numbers per entry.`}

    ${exclusionPrompt}
    ${coveragePrompt}

    Return your response as a JSON object with:
    - entries: An array of ${entryCount} arrays. Each inner array must have exactly ${actualMainCount} main numbers (sorted).
    - powerballs: ${isSeparateBarrelGame ? `An array of ${entryCount} integers (one Powerball/Star per entry) range 1-${config.bonusRange}.` : `Leave empty or omitted.`}
    - analysis: Detailed explanation of how the specific theories were applied. If Powerball/Star, explain the selection specifically. (MUST BE IN ${language}).
    - theoriesApplied: Array of names of theories used.
    - suggestedNumbers: A distinct list of 5-10 "Hot" or "High Confidence" numbers.
    - strategicWeight: A number from 1 to 100 representing confidence.
    - coverageStats: (Optional) Array of { division, probability, requirement }.
  `;

  const userPrompt = `
    ${historyContent}
    Entry: ${isSystem ? `System ${systemNumber}` : 'Standard'} (${entryCount} sets)
    Lucky Numbers: ${luckyNumbers.join(', ') || 'None'}
    Unwanted Numbers: ${unwantedNumbers.join(', ') || 'None'}
    Angel Signal Hint: ${angelNumberHint || 'None'}
    Perform deep statistical analysis now.
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
      items: { type: Type.NUMBER },
      description: `The separate Powerball/Star/Reintegro number for each entry (1-${config.bonusRange})`
    };
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: ["entries", "analysis", "theoriesApplied", "strategicWeight", "suggestedNumbers", ...(isSeparateBarrelGame ? ["powerballs"] : [])]
          }
        }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      systemLabel: isSystem ? `System ${systemNumber}` : 'Standard',
      groundingSources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Market Data",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri)
    };
  } catch (error) {
    console.error("Prediction Error:", error);
    throw new Error("Analysis engine failed.");
  }
}
