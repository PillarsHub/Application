import { cp, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('@tabler/core/package.json'));
const destination = fileURLToPath(new URL('../public/vendor/tabler/', import.meta.url));
const { version } = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));

// Keep stable, same-origin URLs for sandboxed HTML widgets as well as the app.
// CSS image paths are relative to dist/css, so preserve the dist directory layout.
const assets = [
  'css/tabler.min.css',
  'css/tabler-flags.min.css',
  'css/tabler-payments.min.css',
  'css/tabler-vendors.min.css',
  'js/tabler.min.js',
];

for (const asset of assets) {
  const target = join(destination, asset);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(packageRoot, 'dist', asset), target);
  await cp(join(packageRoot, 'dist', `${asset}.map`), `${target}.map`);
}

for (const directory of ['img/flags', 'img/payments', 'libs/jsvectormap']) {
  const target = join(destination, directory);
  await mkdir(target, { recursive: true });
  await cp(join(packageRoot, 'dist', directory), target, { recursive: true });
}

console.log(`Synced Tabler ${version} assets.`);
