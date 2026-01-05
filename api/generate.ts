
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { model, contents, config } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Server API Configuration Missing' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Call the Google AI Model securely on the server
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    // We extract the text here to simplify client handling
    // and pass back the raw candidates for things like grounding metadata
    const responseData = {
      text: response.text,
      candidates: response.candidates,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
