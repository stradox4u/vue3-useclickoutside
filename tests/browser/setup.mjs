import { cpSync } from 'node:fs';
import { build, preview } from 'vite';
import { preparePackedConsumer } from '../packed-consumer.mjs';

export default async function setup() {
  const { directory, cleanup } = preparePackedConsumer();
  const config = { root: directory, configFile: false, logLevel: 'warn' };

  try {
    cpSync(new URL('./fixture/', import.meta.url), directory, { recursive: true });
    await build(config);
    const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
    process.env.PLAYWRIGHT_APP_URL = server.resolvedUrls.local[0];

    return async () => {
      try {
        await server.close();
      } finally {
        cleanup();
      }
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
