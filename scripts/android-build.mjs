import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const task = process.argv[2];
if (!['assembleDebug', 'bundleRelease'].includes(task)) throw new Error('Unsupported Android build task.');
const javaHome = process.env.JAVA_HOME;
if (javaHome && !existsSync(resolve(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
  throw new Error('JAVA_HOME must point to JDK 21 (Android Studio embedded jbr is supported).');
}

// Windows .bat запускается штатной оболочкой; task ограничен фиксированным списком выше.
const executable = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : './gradlew';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', `gradlew.bat ${task}`] : [task];
const child = spawn(executable, args, {
  cwd: resolve(root, 'android'),
  stdio: 'inherit',
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
