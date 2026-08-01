import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const apiKey = body?.apiKey || req.query?.apiKey || req.headers?.['x-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured.',
        message: 'Please enter a Google AI Studio API key.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Ping test',
    });

    if (response.text) {
      return res.status(200).json({
        success: true,
        message: 'Gemini 3.6 Flash model fetched and verified successfully!',
        model: 'gemini-3.6-flash'
      });
    }

    return res.status(500).json({ success: false, error: 'Failed to fetch Gemini model response.' });
  } catch (err: any) {
    console.error('Test API Key Vercel error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch AI evaluation key/model',
      message: err?.message || 'Error communicating with Gemini API'
    });
  }
}
