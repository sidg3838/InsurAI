import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { evaluateClaimWithGemini } from './src/server/geminiEvaluator';
import { ClaimData, PolicyRulesConfig } from './src/types';
import { DEFAULT_POLICY_RULES } from './src/data/mockClaims';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'InsurAI Claims Copilot Engine',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Evaluate Claim API
  app.post('/api/evaluate-claim', async (req, res) => {
    try {
      const { claim, rules } = req.body as { claim: ClaimData; rules?: PolicyRulesConfig };
      if (!claim || !claim.id) {
        return res.status(400).json({ error: 'Invalid or missing claim payload.' });
      }

      const activeRules = rules || DEFAULT_POLICY_RULES;
      const apiKey = process.env.GEMINI_API_KEY;

      const { assessment } = await evaluateClaimWithGemini(claim, activeRules, apiKey);

      return res.json({
        success: true,
        assessment
      });
    } catch (err: any) {
      console.error('Error evaluating claim:', err);
      return res.status(500).json({
        error: 'Failed to evaluate claim.',
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
