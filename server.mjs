import http from 'node:http';
import {existsSync} from 'node:fs';
import './build.mjs';

const envFile = new URL('./.env.local', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const {default: worker} = await import('./dist/server/index.js');
const port = Number(process.env.PORT || 3001);
const server = http.createServer(async (req, res) => {
  const host = req.headers.host;
  if (![`localhost:${port}`, `127.0.0.1:${port}`].includes(host)) {
    res.writeHead(403, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({error:'Use the local review page.'}));
  }
  try {
    const request = new Request(`http://${host}${req.url}`, {
      method:req.method, headers:req.headers,
      ...(!['GET','HEAD'].includes(req.method) ? {body:req,duplex:'half'} : {})
    });
    const response = await worker.fetch(request, {GEMINI_API_KEY:process.env.GEMINI_API_KEY});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({error:'Couldn’t process your review. Please try again.'}));
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the other review server and try again.` : 'The review server could not start.');
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Open http://localhost:${port}\nKeep this window open while using the review page.`));
