/**
 * Helpers for E2E tests that spawn the real secureRun.js in a simulated consumer repo.
 *
 * Not Windows-safe (relies on #!/usr/bin/env node shebangs + executable bits).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const FAKE_BWS = path.join(__dirname, 'fake-bws.mjs');
export const ENV_SINK = path.join(__dirname, 'env-sink.mjs');

/**
 * Copy the bws-secure source into a temp consumer repo layout:
 *   <tmp>/.env                                   (BWS_ACCESS_TOKEN=fake-token)
 *   <tmp>/bwsconfig.json                         (when config provided)
 *   <tmp>/node_modules/.bin/bws                  (node shim over fake-bws)
 *   <tmp>/scripts/bws-secure/                    (copy of the repo excluding heavy/binary paths)
 *   <tmp>/scripts/bws-secure/requiredVars.env    (pre-created to skip the codebase scan)
 */
export function createConsumerRepo({
  config = null,
  envFile = 'BWS_ACCESS_TOKEN=fake-token\n'
} = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bws-e2e-'));
  const bwsDest = path.join(tmpDir, 'scripts', 'bws-secure');
  fs.mkdirSync(path.dirname(bwsDest), { recursive: true });

  fs.cpSync(REPO_ROOT, bwsDest, {
    recursive: true,
    dereference: false,
    filter: (src) => {
      const rel = path.relative(REPO_ROOT, src);
      if (
        rel.startsWith('node_modules') ||
        rel.startsWith('.git') ||
        rel.startsWith('bin/backup')
      ) {
        return false;
      }
      return true;
    }
  });

  fs.writeFileSync(path.join(bwsDest, 'requiredVars.env'), '', 'utf8');

  // Give the copied bws-secure access to the real node_modules (pnpm layout is tricky to copy).
  const copyNodeModules = path.join(bwsDest, 'node_modules');
  if (!fs.existsSync(copyNodeModules)) {
    fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), copyNodeModules, 'dir');
  }

  const nmBin = path.join(tmpDir, 'node_modules', '.bin');
  fs.mkdirSync(nmBin, { recursive: true });

  if (process.platform === 'win32') {
    // Windows: cmd.exe shim resolves via PATHEXT for explicit relative paths too.
    const cmdContent = `@ECHO OFF\r\nnode "${FAKE_BWS}" %*\r\n`;
    fs.writeFileSync(path.join(nmBin, 'bws.cmd'), cmdContent, 'utf8');
    // Placeholder so ensureBwsInstalled()'s existsSync check on `bws` passes.
    fs.writeFileSync(path.join(nmBin, 'bws'), '', 'utf8');
  } else {
    const fakeBwsUrl = new URL('file://' + FAKE_BWS).href;
    const shim = `#!/usr/bin/env node\nawait import(${JSON.stringify(fakeBwsUrl)});\n`;
    const shimPath = path.join(nmBin, 'bws');
    fs.writeFileSync(shimPath, shim, 'utf8');
    fs.chmodSync(shimPath, 0o755);
  }

  fs.writeFileSync(path.join(tmpDir, '.env'), envFile, 'utf8');

  if (config) {
    fs.writeFileSync(path.join(tmpDir, 'bwsconfig.json'), JSON.stringify(config, null, 2), 'utf8');
  }

  return { tmpDir, bwsDest };
}

export function writeFixture(tmpDir, fixture) {
  const p = path.join(tmpDir, '.fake-bws-fixture.json');
  fs.writeFileSync(p, JSON.stringify(fixture), 'utf8');
  return p;
}

/**
 * Run secureRun.js inside a consumer repo, wrapping `node <env-sink.mjs>`.
 * @param {{ tmpDir: string, bwsDest: string }} repo
 * @param {{ env?: Record<string,string>, timeoutMs?: number }} [opts]
 * @returns {{ status: number|null, stdout: string, stderr: string, childEnv: Record<string,string>, leftoverSecureFiles: string[], tmpDir: string }}
 */
export function runSecureRun(repo, opts = {}) {
  const sink = path.join(repo.tmpDir, 'e2e-child-env.json');
  if (fs.existsSync(sink)) fs.unlinkSync(sink);
  const fixture = path.join(repo.tmpDir, '.fake-bws-fixture.json');

  const pathSep = process.platform === 'win32' ? ';' : ':';
  const binPath = path.join(repo.tmpDir, 'node_modules', '.bin');
  const env = {
    ...process.env,
    PATH: `${binPath}${pathSep}${process.env.PATH || ''}`,
    ...(process.platform === 'win32' && process.env.Path
      ? { Path: `${binPath};${process.env.Path}` }
      : {}),
    FAKE_BWS_FIXTURE: fixture,
    E2E_ENV_SINK: sink,
    BWS_SUPPRESS_ALL: 'true',
    BWS_NO_OVERRIDE: 'true',
    NETLIFY: '',
    VERCEL: '',
    DEBUG: '',
    ...opts.env
  };

  const res = spawnSync(
    process.execPath,
    [path.join(repo.bwsDest, 'secureRun.js'), process.execPath, ENV_SINK],
    {
      cwd: repo.tmpDir,
      env,
      encoding: 'utf8',
      timeout: opts.timeoutMs || 30000
    }
  );

  let childEnv = {};
  if (fs.existsSync(sink)) {
    try {
      childEnv = JSON.parse(fs.readFileSync(sink, 'utf8'));
    } catch {
      childEnv = {};
    }
  }

  const leftoverSecureFiles = fs
    .readdirSync(repo.tmpDir)
    .filter((f) => f === '.env.secure' || f.startsWith('.env.secure.'));

  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    childEnv,
    leftoverSecureFiles,
    tmpDir: repo.tmpDir
  };
}

export function teardown(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
