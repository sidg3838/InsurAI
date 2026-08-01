import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { evaluateClaimWithGemini } from './src/server/geminiEvaluator';
import { ClaimData, PolicyRulesConfig } from './src/types';
import { DEFAULT_POLICY_RULES } from './src/data/mockClaims';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      service: 'InsurAI Claims Copilot Engine',
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString()
    });
  });

  // Test Gemini API Key & Model endpoint
  app.all('/api/test-key', async (req, res) => {
    try {
      const apiKey = req.body?.apiKey || (req.query?.apiKey as string) || (req.headers['x-api-key'] as string) || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured.',
          message: 'Please enter a Google AI Studio API key in the text field.'
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
        return res.json({
          success: true,
          message: 'Gemini 3.6 Flash model fetched and verified successfully!',
          model: 'gemini-3.6-flash'
        });
      }

      return res.status(500).json({ success: false, error: 'Failed to fetch Gemini model response.' });
    } catch (err: any) {
      console.error('Test API Key error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch AI evaluation key/model',
        message: err?.message || 'Error communicating with Gemini API'
      });
    }
  });

  // Evaluate Claim API
  app.post('/api/evaluate-claim', async (req, res) => {
    try {
      const { claim, rules, apiKey: bodyKey } = req.body as { claim: ClaimData; rules?: PolicyRulesConfig; apiKey?: string };
      if (!claim || !claim.id) {
        return res.status(400).json({ success: false, error: 'Invalid or missing claim payload.' });
      }

      const activeRules = rules || DEFAULT_POLICY_RULES;
      const apiKey = bodyKey || (req.headers['x-api-key'] as string) || process.env.GEMINI_API_KEY;

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

      return res.json({
        success: true,
        aiFetched: true,
        assessment
      });
    } catch (err: any) {
      console.error('Error evaluating claim:', err);
      return res.status(500).json({
        success: false,
        aiFetched: false,
        error: 'Failed to fetch AI evaluation',
        message: err?.message || 'Internal server error'
      });
    }
  });

  // Serve Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsurAI Claims Copilot Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
