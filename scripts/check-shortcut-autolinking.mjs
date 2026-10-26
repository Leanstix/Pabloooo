import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
const manifest = require.resolve('expo-modules-autolinking/package.json');
const cli = resolve(
  dirname(manifest),
  JSON.parse(readFileSync(manifest, 'utf8')).bin['expo-modules-autolinking'],
);
const result = JSON.parse(
  execFileSync(process.execPath, [cli, 'resolve', '--platform', 'android', '--json'], {
    cwd: root,
    encoding: 'utf8',
  }),
);
const module = result.modules.find((item) => item.packageName === 'pablo-shortcut');
assert.ok(
  module,
  'Expo must discover the local PabloShortcut module without an npm file dependency.',
);
const project = module.projects.find(
  (item) => resolve(item.sourceDir) === resolve(root, 'modules/pablo-shortcut/android'),
);
assert.ok(project, 'PabloShortcut must link from the committed local modules directory.');
assert.ok(
  project.modules.some(
    (item) => item.classifier === 'expo.modules.pabloshortcut.PabloShortcutModule',
  ),
  'PabloShortcut native implementation must be registered.',
);
process.stdout.write('Local PabloShortcut Android autolinking verified.\n');
