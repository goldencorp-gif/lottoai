
import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server Configuration Error: API Key missing. Please set API_KEY in Netlify Site Settings." })
      };
    }

    const { model, contents, config } = JSON.parse(event.body || '{}');

    if (!model || !contents) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Bad Request: Missing model or contents." })
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      contents,
      config: config || {}
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: result.text || "",
        candidates: result.candidates || [],
        groundingMetadata: result.candidates?.[0]?.groundingMetadata
      })
    };

  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" })
    };
  }
};
