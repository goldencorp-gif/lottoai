import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Reject non-POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables.");
      return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    // 4. Parse Body (Vercel parses JSON automatically for valid content-types)
    const { model, contents, config } = req.body;

    // 5. Initialize AI
    const ai = new GoogleGenAI({ apiKey });
    
    // 6. Execute Request
    const result = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents,
      config: config || {}
    });

    const responseData = {
      text: result.text || "",
      candidates: result.candidates,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };

    // 7. Return Success
    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}