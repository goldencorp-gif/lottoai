
import { GoogleGenAI } from "@google/genai";

export default async (request: Request) => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in Netlify environment variables");
      return new Response(JSON.stringify({ error: "Server Configuration Error: API_KEY is missing in Netlify Environment Variables. Please add it in Site Settings." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { model, contents, config } = body;

    const ai = new GoogleGenAI({ apiKey });
    
    // Safety settings to prevent blocking legitimate lottery data
    const finalConfig = {
      ...config,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // Call Gemini API
    const result = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents,
      config: finalConfig
    });

    const responseData = {
      text: result.text || "",
      candidates: result.candidates,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Function Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
