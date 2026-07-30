'use strict';

// A deliberately tiny stand-in for tenant-app: the front end of the same
// instance as sandbox-api. It renders its own identity and whatever it can read
// from the API, which makes a partial deploy visible — app on a new version
// while the api is still on the old one, or vice versa.

const http = require('node:http');

const PORT = Number(process.env.PORT || 3000);
const API_URL = process.env.API_URL || '';

const identity = {
  component: 'sandbox-app',
  version: process.env.APP_VERSION || 'dev',
  instance: process.env.INSTANCE || 'unknown',
  cluster: process.env.CLUSTER || 'unknown',
  environment: process.env.ENVIRONMENT || 'unknown',
  stack: process.env.STACK || 'unknown',
};

const failReadiness = process.env.FAIL_READINESS === 'true';

const fetchApi = async () => {
  if (!API_URL) return { error: 'API_URL not set' };
  try {
    const res = await fetch(`${API_URL}/version`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { error: `api returned ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: String(err.message || err) };
  }
};

const page = (api) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>sandbox-app — ${identity.instance}</title>
<style>
  body{font:16px/1.6 system-ui,sans-serif;margin:3rem auto;max-width:44rem;padding:0 1rem}
  table{border-collapse:collapse;width:100%;margin:1rem 0}
  th,td{text-align:left;padding:.4rem .6rem;border-bottom:1px solid #ddd}
  th{width:11rem;font-weight:600}
  code{background:#f4f4f5;padding:.1rem .3rem;border-radius:3px}
</style></head><body>
<h1>sandbox-app</h1>
<p>Front-end component of instance <code>${identity.instance}</code>.</p>
<h2>This component</h2>
<table>${Object.entries(identity)
  .map(([k, v]) => `<tr><th>${k}</th><td><code>${v}</code></td></tr>`)
  .join('')}</table>
<h2>sandbox-api reports</h2>
<table>${Object.entries(api)
  .map(([k, v]) => `<tr><th>${k}</th><td><code>${v}</code></td></tr>`)
  .join('')}</table>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  if (path === '/health-check') {
    const status = failReadiness ? 503 : 200;
    res.writeHead(status, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ status: failReadiness ? 'failing' : 'ok' }));
  }

  if (path === '/version') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(identity, null, 2));
  }

  const body = page(await fetchApi());
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(JSON.stringify({ msg: 'listening', port: PORT, ...identity }));
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(JSON.stringify({ msg: 'shutting down', signal }));
    server.close(() => process.exit(0));
  });
}
