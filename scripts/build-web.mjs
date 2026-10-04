import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB_DIR = join(ROOT, 'www');
const WEB_ENTRIES = ['index.html', 'manifest.webmanifest', 'src', 'assets', 'vendor'];

// www — только результат сборки. Игру редактируют в корневых src/assets/index.html.
// Удаляем исключительно этот заранее определённый каталог внутри проекта.
await rm(WEB_DIR, { recursive: true, force: true });
await mkdir(WEB_DIR, { recursive: true });
for (const entry of WEB_ENTRIES) {
  await cp(join(ROOT, entry), join(WEB_DIR, entry), { recursive: true });
}

// В старых Android WebView Capacitor предоставляет безопасные отступы через CSS variables.
// Подмена выполняется только в сборке: исходные CSS и Safari env() остаются прежними.
const cssPath = join(WEB_DIR, 'src/style.css');
const css = await readFile(cssPath, 'utf8');
const safeAreaCss = css.replace(/env\(safe-area-inset-(top|right|bottom|left)\)/g,
  (_, side) => `var(--safe-area-inset-${side}, env(safe-area-inset-${side}))`);
await writeFile(cssPath, safeAreaCss);
console.log('BLOOP web build ready: www/ (shared source, no bundler).');
