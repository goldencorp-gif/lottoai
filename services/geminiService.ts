
import { Type } from "@google/genai";
import { LotteryGameType, PredictionResult, GameConfig, Language } from "../types";
import { GAME_CONFIGS, LOTTERY_THEORIES } from "../constants";

// Helper to call our secure server proxy
// This prevents the API_KEY from being exposed in the browser
async function callSecureAI(model: string, contents: any, config?: any) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        contents,
        config
      }),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Secure AI Call Failed:", error);
    throw error;
  }
}

const getLanguageInstruction = (lang: Language) => {
  switch (lang) {
    case 'zh': return "Respond in Simplified Chinese (Mandarin).";
    case 'es': return "Respond in Spanish.";
    case 'hi': return "Respond in Hindi.";
    case 'vi': return "Respond in Vietnamese.";
    default: return "Respond in English.";
  }
};

export async function fetchLatestDraws(game: string): Promise<string> {
  const prompt = `Find the 5 most recent official draw results for the lottery game: ${game}. 
  Format the output strictly as a list: "Draw [Date/Number]: [Numbers]".
  Ensure numbers are accurate.
  Include the official draw number if available.`;

  try {
    const response = await callSecureAI('gemini-3-flash-preview', prompt, {
      tools: [{ googleSearch: {} }],
    });

    let text = response.text || "Could not fetch historical data automatically.";

    // Extract grounding sources (URLs)
    const chunks = response.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web?.uri)
      .filter((uri: string) => uri);

    if (sources.length > 0) {
      const uniqueSources = [...new Set(sources)];
      text += "\n\n--- Source References ---\n" + uniqueSources.join('\n');
    }

    return text;
  } catch (error) {
    console.error("Error fetching latest draws:", error);
    return "Error fetching data from web.";
  }
}

export async function generateLuckyImage(numbers: number[], gameName: string): Promise<string | null> {
  const focusNumbers = numbers.slice(0, 5).join(', ');
  const prompt = `A cinematic, high-quality 3D render of lottery balls with the numbers ${focusNumbers} floating in a mystical, golden glowing void. 
  The balls are shiny, polished textures. There is magical gold dust in the air. 
  The lighting is dramatic and luxurious. Photorealistic, 8k resolution, lottery luck theme.`;

  try {
    const response = await callSecureAI('gemini-2.5-flash-image', {
        parts: [{ text: prompt }]
    });

    // The proxy returns the raw candidates structure
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

  const prompt = `
    You are an expert Lottery Analyst using specific mathematical models.
    Game: ${game} (${config.mainCount} numbers from 1-${config.mainRange}).
    History: ${history}
    
    You must strictly apply ONLY the following enabled theories to find the strongest numbers:
    ${theoryContext || "Apply general statistical frequency and distribution analysis only."}

    ${negativePrompt}
    ${angelContext}

    Task: Analyze the history and identify 5-10 numbers that best satisfy the criteria of the ENABLED theories listed above.
    The numbers must be the strongest intersection of these specific methodologies.
    ${exclusionPrompt}

    Return ONLY a JSON object with a property 'numbers' containing an array of integers.
  `;

  try {
     const response = await callSecureAI('gemini-3-flash-preview', prompt, {
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
    
    const json = JSON.parse(response.text);
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
  
  const actualMainCount = systemNumber || config.mainCount;
  const isSystem = systemNumber !== null && systemNumber > config.mainCount;
  
  // Detect if this is a "Two Barrel" game (Main numbers + Separate Powerball/Star/MegaBall)
  // US Powerball, US Mega, Euro Millions, Euro Jackpot, La Primitiva (Reintegro)
  const isSeparateBarrelGame = 
    game === LotteryGameType.US_POWERBALL || 
    game === LotteryGameType.US_MEGA_MILLIONS ||
    game === LotteryGameType.EURO_MILLIONS ||
    game === LotteryGameType.EURO_JACKPOT ||
    game === LotteryGameType.LA_PRIMITIVA;
  
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
    History: ${history}
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
    const response = await callSecureAI('gemini-3-flash-preview', userPrompt, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: ["entries", "analysis", "theoriesApplied", "strategicWeight", "suggestedNumbers", ...(isSeparateBarrelGame ? ["powerballs"] : [])]
        }
    });

    const result = JSON.parse(response.text);
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
