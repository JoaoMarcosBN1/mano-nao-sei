server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    const indexPath = join(__dirname, 'public', 'index.html');
    const html = await readFile(indexPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/chat') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const { prompt } = JSON.parse(body || '{}');

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'O prompt é obrigatório.' }));
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: response.text }));
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Erro interno' }));
    }

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

