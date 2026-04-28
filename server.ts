import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.post('/api/conversations', async (req, res) => {
    try {
      const { custom_greeting } = req.body;
      const apiKey = process.env.TAVUS_API_KEY;
      const personaId = process.env.PERSONA_ID;

      console.log('Initiating Tavus conversation request...');
      console.log('Target URL: https://api.tavus.io/v2/conversations');

      if (!apiKey || !personaId) {
        return res.status(500).json({ 
          error: 'Missing Tavus configuration. Please set TAVUS_API_KEY and PERSONA_ID.' 
        });
      }

      // Using axios for more robust timeout handling
      const response = await axios.post('https://api.tavus.io/v2/conversations', {
        persona_id: personaId,
        custom_greeting: custom_greeting || "Hey, I'm Nova. Great to connect with you. What can I help you with today?",
        properties: {
          max_call_duration: 3600,
          enable_recording: true,
          participant_left_timeout: 60
        }
      }, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 100000 // 100 seconds timeout for replica provisioning
      });

      console.log('Tavus conversation created successfully:', response.data.conversation_id);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      
      const errorDetail = error.response?.data || (isTimeout ? 'The Tavus API connection timed out. Retrying may help.' : error.message);
      
      console.error('Tavus API Error Detail:', JSON.stringify(errorDetail));
      
      res.status(status).json({ 
        error: errorDetail,
        code: error.code || 'UNKNOWN_ERROR',
        isTimeout
      });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
