import { evaluateClaimWithGemini } from '../src/server/geminiEvaluator';
import { ClaimData, PolicyRulesConfig } from '../src/types';
import { DEFAULT_POLICY_RULES } from '../src/data/mockClaims';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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

    const { claim, rules, apiKey: bodyKey } = (body || {}) as {
      claim: ClaimData;
      rules?: PolicyRulesConfig;
      apiKey?: string;
    };

    if (!claim || !claim.id) {
      return res.status(400).json({ success: false, error: 'Invalid or missing claim payload.' });
    }

    const activeRules = rules || DEFAULT_POLICY_RULES;
    const apiKey = bodyKey || req.headers?.['x-api-key'] || process.env.GEMINI_API_KEY;

    const { assessment, aiFetched, aiError } = await evaluateClaimWithGemini(claim, activeRules, apiKey);

    if (!aiFetched) {
      return res.status(502).json({
        success: false,
        aiFetched: false,
        error: 'Failed to fetch AI evaluation',
        message: aiError || 'Failed to fetch key or model response from Gemini API',
        assessment
      });
    }

    return res.status(200).json({
      success: true,
      aiFetched: true,
      assessment
    });
  } catch (err: any) {
    console.error('Evaluate claim Vercel error:', err);
    return res.status(500).json({
      success: false,
      aiFetched: false,
      error: 'Failed to fetch AI evaluation',
      message: err?.message || 'Internal server error'
    });
  }
}
