import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const output = resolve('.expo/ui-preview');
await mkdir(output, { recursive: true });
await build({
  entryPoints: ['tests/browser/harness.tsx'],
  outfile: join(output, 'app.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true' },
  alias: {
    'react-native': 'react-native-web',
    'react-native-svg': resolve('node_modules/react-native-svg/lib/module/elements.web.js'),
    'expo-status-bar': resolve('tests/browser/status-bar.ts'),
    'expo-crypto': resolve('tests/browser/crypto-adapter.ts'),
    'expo-font': resolve('tests/browser/font-adapter.ts'),
    '@react-native/assets-registry/registry': resolve('tests/browser/asset-registry.ts'),
  },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.json'],
  loader: { '.ttf': 'dataurl', '.png': 'dataurl', '.js': 'jsx' },
  plugins: [{ name: 'no-native-svg-audio-in-ui-harness', setup(builder) {
    builder.onResolve({ filter: /NativeSvgSoundModule(?:\.js)?$/ }, () => ({ path: resolve('tests/browser/svg-sound.ts') }));
  } }],
});
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body,#root{margin:0;height:100%;width:100%}#root{display:flex;flex-direction:column}body{font-family:system-ui}*{box-sizing:border-box}</style></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>';
if (!process.argv.includes('--build-only')) createServer(async (request, response) => {
  if (request.url === '/app.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(await readFile(join(output, 'app.js')));
  } else { response.setHeader('Content-Type', 'text/html'); response.end(html); }
}).listen(4173, '127.0.0.1', () => process.stdout.write('UI test preview ready on http://127.0.0.1:4173\n'));
