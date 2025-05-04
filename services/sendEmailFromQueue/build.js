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
  })
  .catch(() => process.exit(1));
