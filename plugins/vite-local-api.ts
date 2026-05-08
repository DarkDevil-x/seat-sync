/**
 * vite-local-api.ts
 *
 * Vite dev-server plugin that intercepts every /api/* request and runs the
 * corresponding Vercel-style handler file (api/**\/*.ts) in-process using
 * Vite's ssrLoadModule – so TypeScript is transpiled by Vite itself and HMR
 * works for API changes too.
 *
 * URL → file resolution order:
 *   /api/foo/bar  →  api/foo/bar.ts
 *                 →  api/foo/[id].ts   (with req.query.id = "bar")
 *                 →  api/[id]/bar.ts   (with req.query.id = "foo")
 *
 * No new npm packages required – works with plain `npm run dev`.
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { resolve } from 'path';
import { existsSync } from 'fs';

// ── tiny mock that satisfies VercelRequest / VercelResponse ───────────────────
function buildMockRes(res: ServerResponse) {
  let _status = 200;
  const _headers: Record<string, string | string[]> = {};

  const mockRes: Record<string, unknown> = {
    statusCode: 200,
    status(code: number) { _status = code; mockRes.statusCode = code; return mockRes; },

    setHeader(name: string, value: string | string[]) {
      _headers[name] = value;
      res.setHeader(name, value);
      return mockRes;
    },

    getHeader(name: string) { return _headers[name]; },

    json(data: unknown) {
      const body = JSON.stringify(data);
      if (!res.headersSent) {
        res.writeHead(_status, { 'Content-Type': 'application/json', ..._headers });
      }
      res.end(body);
      return mockRes;
    },

    end(chunk?: string) {
      if (!res.headersSent) res.writeHead(_status, _headers);
      res.end(chunk);
      return mockRes;
    },

    send(data: unknown) {
      if (data !== null && typeof data === 'object') return (mockRes as any).json(data);
      if (!res.headersSent) res.writeHead(_status, _headers);
      res.end(data == null ? '' : String(data));
      return mockRes;
    },

    redirect(urlOrStatus: string | number, url?: string) {
      const target = typeof urlOrStatus === 'string' ? urlOrStatus : url!;
      const code   = typeof urlOrStatus === 'number' ? urlOrStatus : 302;
      res.writeHead(code, { Location: target, ..._headers });
      res.end();
      return mockRes;
    },
  };

  return mockRes;
}

function resolveHandlerFile(
  root: string,
  segments: string[],
  params: Record<string, string>,
): string | null {
  // We've consolidated everything into a single router for Vercel Hobby limits
  const routerPath = resolve(root, 'api', 'index.ts');
  if (existsSync(routerPath)) return routerPath;
  return null;
}

// ── read the full request body as a string ────────────────────────────────────
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

// ── plugin ─────────────────────────────────────────────────────────────────────
export function localApiPlugin(): Plugin {
  let root = process.cwd();

  return {
    name: 'vite-local-api',

    configResolved(config) {
      root = config.root;
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api')) return next();

        const [pathname, search] = url.split('?');
        const query = Object.fromEntries(new URLSearchParams(search ?? ''));
        const params: Record<string, string> = {};

        // Strip leading /api and split into segments
        const segments = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
        if (segments.length === 0) return next(); // bare /api

        const handlerFile = resolveHandlerFile(root, segments, params);
        if (!handlerFile) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `No handler: ${pathname}` }));
          return;
        }

        // Read + parse body
        const rawBody = await readBody(req);
        let body: unknown = {};
        if (rawBody) {
          try { body = JSON.parse(rawBody); } catch { body = rawBody; }
        }

        // Build mock Vercel req/res
        const mockReq = {
          method: req.method ?? 'GET',
          headers: req.headers,
          body,
          query: { ...query, ...params },
          url: req.url,
          cookies: {},
        };
        const mockRes = buildMockRes(res);

        try {
          // ssrLoadModule transpiles TypeScript via Vite's own pipeline
          const viteRoot = root.replace(/\\/g, '/');
          const relPath   = handlerFile.replace(/\\/g, '/').replace(viteRoot, '');
          const mod = await server.ssrLoadModule(relPath);
          const handler = mod.default;
          if (typeof handler !== 'function') {
            throw new Error(`Handler in ${relPath} has no default export`);
          }
          await handler(mockReq, mockRes);
        } catch (err) {
          console.error('[vite-local-api] error:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined
            }));
          }
        }
      });
    },
  };
}
