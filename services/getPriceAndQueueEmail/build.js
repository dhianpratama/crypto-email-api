const esbuild = require('esbuild');
const path = require('path');

esbuild
  .build({
    entryPoints: ['handler.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/handler.js',
    tsconfig: '../../tsconfig.json',
    alias: {
      '@shared': path.resolve(__dirname, '../../shared'),
    },
    external: [
      '@aws-sdk/client-sqs',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb',
      '@aws-sdk/client-ses',
    ],
  })
  .catch(() => process.exit(1));
