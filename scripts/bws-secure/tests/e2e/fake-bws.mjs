#!/usr/bin/env node
/**
 * Fake BWS CLI for E2E tests.
 *
 * Reads a JSON fixture at FAKE_BWS_FIXTURE containing:
 *   {
 *     "projects":       { "<uuid>": [ { "key": "K", "value": "V" }, ... ], ... },
 *     "globalSecrets":  [ { "key": "K", "value": "V" }, ... ]    // optional, for tokenless secret list
 *   }
 * Returns canned data based on argv.
 *
 * Supported invocations (covers what secureRun / bws-dotenv use):
 *   bws project list -t TOKEN
 *   bws secret list -t TOKEN --output json                 -> globalSecrets or []
 *   bws secret list -t TOKEN <UUID> --output json          -> projects[UUID] or exit 1
 *   bws secret list <UUID> -t TOKEN -o env                 -> env-format for projects[UUID]
 *   bws secret list -t TOKEN -o env                        -> env-format for globalSecrets
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const fixturePath = process.env.FAKE_BWS_FIXTURE;
const fixture =
  fixturePath && fs.existsSync(fixturePath)
    ? JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
    : { projects: {}, globalSecrets: [] };

function findUuidArg() {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return args.find((a) => uuidRe.test(a));
}

function emitEnvFormat(secrets) {
  const lines = secrets.map(({ key, value }) => `${key}=${value}`);
  process.stdout.write(lines.join('\n'));
}

function emitJson(data) {
  process.stdout.write(JSON.stringify(data));
}

try {
  if (args[0] === 'project' && args[1] === 'list') {
    process.exit(0);
  }
  if (args[0] === 'secret' && args[1] === 'list') {
    const uuid = findUuidArg();
    const wantsJson = args.includes('--output') && args[args.indexOf('--output') + 1] === 'json';
    const wantsEnv = args.includes('-o') && args[args.indexOf('-o') + 1] === 'env';

    if (uuid) {
      const secrets = fixture.projects ? fixture.projects[uuid] : undefined;
      if (!secrets) {
        process.stderr.write(`404 Not Found: ${uuid}`);
        process.exit(1);
      }
      if (wantsJson) {
        emitJson(secrets);
      } else if (wantsEnv) {
        emitEnvFormat(secrets);
      } else {
        emitJson(secrets);
      }
      process.exit(0);
    }
    const globals = fixture.globalSecrets || [];
    if (wantsJson) {
      emitJson(globals);
    } else if (wantsEnv) {
      emitEnvFormat(globals);
    } else {
      emitJson(globals);
    }
    process.exit(0);
  }
  process.stderr.write(`fake-bws: unsupported args: ${args.join(' ')}`);
  process.exit(2);
} catch (err) {
  process.stderr.write(`fake-bws error: ${err.message}`);
  process.exit(1);
}
