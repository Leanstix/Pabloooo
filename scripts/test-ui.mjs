import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, readFile, stat } from 'node:fs/promises';
import { createBrotliDecompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { execFileSync, spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const env = { ...process.env };
if (process.platform === 'linux') {
  const root = resolve(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..');
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const output = join(tmpdir(), `pabloooo-ui-chromium-${version}`);
  const executable = join(output, 'chromium');
  await mkdir(output, { recursive: true });
  if ((await stat(executable).catch(() => null))?.size < 1000000 || !(await stat(executable).catch(() => null))) {
    await pipeline(createReadStream(join(root, 'bin/chromium.br')), createBrotliDecompress(), createWriteStream(executable));
    await chmod(executable, 0o700);
    for (const name of ['swiftshader', 'fonts']) {
      const archive = join(output, `${name}.tar`);
      await pipeline(createReadStream(join(root, `bin/${name}.tar.br`)), createBrotliDecompress(), createWriteStream(archive));
      execFileSync('tar', ['--no-same-owner', '-xf', archive, '-C', output]);
    }
  }
  env.PABLOOOO_CHROMIUM = executable;
  env.LD_LIBRARY_PATH = [output, env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  env.FONTCONFIG_PATH = join(output, 'fonts');
}
const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { env, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code ?? 1; });
