
import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function Handler
export default async function handler(request: any, response: any) {
  // CORS Handling
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Preflight Options
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("Server Error: API_KEY environment variable is missing.");
      return response.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    const { model, contents, config } = request.body;

    if (!model || !contents) {
      return response.status(400).json({ error: "Bad Request: Missing model or contents." });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Note: generateContent can handle both simple text and complex objects
    const result = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config || {}
    });

    if (!result) {
       throw new Error("Empty response from AI provider.");
    }

    // Standardize response format
    return response.status(200).json({
      text: result.text || "",
      candidates: result.candidates || [],
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    });

  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return response.status(500).json({ 
      error: error.message || "Internal Server Error",
      details: error.toString()
    });
  }
}
