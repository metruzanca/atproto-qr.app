import fs from 'node:fs/promises';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

function normalizeOrigin(value: string | undefined): string {
  const raw = (value ?? '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return '';
  }
}

function oauthMetadataPlugin(): Plugin {
  let outDir = '';
  let env: Record<string, string> = {};
  return {
    name: 'oauth-client-metadata',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      // Resolved env: `.env` files merged with the process environment, so a
      // local build and a CI build generate the same document.
      env = config.env as Record<string, string>;
    },
    closeBundle: async () => {
      // `VITE_DOMAIN` is the single source of truth for this deployment's origin.
      const origin = normalizeOrigin(env.VITE_DOMAIN) || normalizeOrigin(process.env.VITE_DOMAIN);
      if (!origin) {
        console.warn('[oauth-client-metadata] VITE_DOMAIN is not set — skipping metadata generation.');
        return;
      }
      const metadata = {
        client_id: `${origin}/oauth-client-metadata.json`,
        client_name: 'atproto QR',
        client_uri: origin,
        redirect_uris: [`${origin}/oauth/callback`],
        scope: 'atproto transition:generic',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        application_type: 'web',
        dpop_bound_access_tokens: true,
      };
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(
        path.join(outDir, 'oauth-client-metadata.json'),
        JSON.stringify(metadata, null, 2) + '\n',
      );
    },
  };
}

export default defineConfig({
  plugins: [oauthMetadataPlugin(), devtools(), solidPlugin(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});