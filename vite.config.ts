import fs from 'node:fs/promises';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

import { DEFAULT_APP_ORIGIN, normalizeOrigin } from './src/lib/origin';

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
      // `VITE_DOMAIN` pins this deployment's origin; unset, fall back to the
      // canonical origin so the app and its metadata never point at nothing.
      const origin =
        normalizeOrigin(env.VITE_DOMAIN) || normalizeOrigin(process.env.VITE_DOMAIN) || DEFAULT_APP_ORIGIN;
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