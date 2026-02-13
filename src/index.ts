import { setErrorConfig } from 'viem';
import { version } from './version.js';

setErrorConfig({
  getDocsUrl: ({ docsBaseUrl, docsPath = '', docsSlug }) =>
    docsPath
      ? `${docsBaseUrl ?? 'https://docs.gelato.cloud'}${docsPath}${docsSlug ? `#${docsSlug}` : ''}`
      : undefined,
  version: `@gelatocloud/gasless@${version}`
});

export * from './account/index.js';
export * from './bundler/index.js';
export * from './relayer/index.js';
export * from './types/index.js';
export * from './utils/index.js';
export { version } from './version.js';
