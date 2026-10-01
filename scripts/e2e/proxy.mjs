// Maps the Supabase REST path (/rest/v1/...) onto a bare PostgREST, which is
// all supabase-js needs for database calls.
import http from 'node:http';

const LISTEN = Number(process.env.E2E_PROXY_PORT || 3056);
const TARGET = Number(process.env.E2E_POSTGREST_PORT || 3055);

http
  .createServer((req, res) => {
    if (!req.url.startsWith('/rest/v1')) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: `e2e proxy: no route for ${req.url}` }));
      return;
    }
    const upstream = http.request(
      { host: '127.0.0.1', port: TARGET, method: req.method, path: req.url.slice('/rest/v1'.length) || '/', headers: req.headers },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      }
    );
    upstream.on('error', (err) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: `e2e proxy: ${err.message}` }));
    });
    req.pipe(upstream);
  })
  .listen(LISTEN, '127.0.0.1', () => console.log(`e2e proxy on ${LISTEN} -> postgrest ${TARGET}`));
