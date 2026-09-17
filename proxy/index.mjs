import http from 'node:http';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  console.warn('[cors-proxy] ALLOWED_ORIGINS is not set — allowing requests from any origin.');
}

const PORT = Number(process.env.PORT || 8080);

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin ?? '';

  if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  const allowOrigin = ALLOWED_ORIGINS.length > 0 ? origin : '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    ...(ALLOWED_ORIGINS.length > 0 ? { 'Vary': 'Origin' } : {}),
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end('method not allowed');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const target = url.searchParams.get('url');
  if (!target) {
    res.writeHead(400);
    res.end('missing url');
    return;
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    res.writeHead(400);
    res.end('invalid url');
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.writeHead(400);
    res.end('invalid url');
    return;
  }

  try {
    const upstream = await fetch(target);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      ...corsHeaders,
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    });
    res.end(body);
  } catch {
    res.writeHead(502);
    res.end('upstream request failed');
  }
});

server.listen(PORT, () => {
  console.log(`[cors-proxy] listening on :${PORT}`);
});