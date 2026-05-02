import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const minimumSeverity = new Map([
  ['info', 0],
  ['low', 1],
  ['moderate', 2],
  ['high', 3],
  ['critical', 4],
]);
const threshold = minimumSeverity.get('moderate');

async function runAudit() {
  try {
    const { stdout } = await execFileAsync('npm', ['audit', '--json'], {
      maxBuffer: 1024 * 1024 * 10,
    });
    return stdout;
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error && typeof error.stdout === 'string') {
      return error.stdout;
    }
    throw error;
  }
}

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const directDeps = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);
const audit = JSON.parse(await runAudit());
const vulnerabilities = Object.values(audit.vulnerabilities ?? {});
const directFindings = vulnerabilities.filter((vulnerability) => {
  const name = vulnerability.name;
  const severity = minimumSeverity.get(vulnerability.severity) ?? 0;
  return directDeps.has(name) && vulnerability.isDirect && severity >= threshold;
});

if (directFindings.length > 0) {
  console.error('Direct dependency vulnerabilities found:');
  for (const finding of directFindings) {
    console.error(`- ${finding.name}: ${finding.severity}`);
  }
  process.exit(1);
}

console.log('No moderate-or-higher vulnerabilities in direct dependencies.');
