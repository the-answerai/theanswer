/**
 * E2E tests for secureRun.js multi-project behavior.
 * Run: npm run test:e2e
 *
 * Strategy:
 *   - Copy bws-secure into a tmp consumer-style repo
 *   - Shim `./node_modules/.bin/bws` to a fake CLI that returns canned secrets
 *   - Invoke secureRun.js wrapping a sink script that serializes process.env
 *   - Assert on the child env and on leftover .env.secure* files
 *
 * Cross-platform: Unix uses a #!/usr/bin/env node shebang shim; Windows uses a `bws.cmd`
 * wrapper. Set E2E_DISABLE_WINDOWS=1 to skip the suite on Windows if a host misbehaves.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

import { createConsumerRepo, runSecureRun, teardown, writeFixture } from './helpers.mjs';

// E2E_DISABLE_WINDOWS=1 will skip on Windows if the cmd-shim path misbehaves on a given host.
const skipIfWindows =
  process.platform === 'win32' && process.env.E2E_DISABLE_WINDOWS === '1'
    ? { skip: 'E2E disabled on Windows via E2E_DISABLE_WINDOWS=1' }
    : {};

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const U3 = '33333333-3333-4333-8333-333333333333';
const INVALID = 'not-a-uuid';

const baseSecrets = (overrides = {}) => ({
  BWS_TEST_VAR: overrides.BWS_TEST_VAR || 'present',
  ...overrides
});

function toBwsSecrets(record) {
  return Object.entries(record).map(([key, value]) => ({ key, value: String(value) }));
}

test(
  'single UUID direct bypass: child env has secrets and BWS_PROJECT_ID=uuid',
  skipIfWindows,
  () => {
    const repo = createConsumerRepo();
    writeFixture(repo.tmpDir, {
      projects: {
        [U1]: toBwsSecrets(baseSecrets({ API_KEY: 'single-key', DATABASE_URL: 'single-db' }))
      }
    });
    try {
      const r = runSecureRun(repo, { env: { BWS_PROJECT_ID: U1 } });
      assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
      assert.equal(r.childEnv.API_KEY, 'single-key');
      assert.equal(r.childEnv.DATABASE_URL, 'single-db');
      assert.equal(r.childEnv.BWS_TEST_VAR, 'present');
      assert.equal(r.childEnv.BWS_PROJECT_ID, U1);
      assert.ok(
        !('BWS_PROJECT_IDS' in r.childEnv),
        'BWS_PROJECT_IDS should be absent for single UUID'
      );
    } finally {
      teardown(repo.tmpDir);
    }
  }
);

test(
  'multi UUID direct bypass: overlay order (later wins) + BWS_PROJECT_IDS set',
  skipIfWindows,
  () => {
    const repo = createConsumerRepo();
    writeFixture(repo.tmpDir, {
      projects: {
        [U1]: toBwsSecrets(
          baseSecrets({ API_KEY: 'shared', DATABASE_URL: 'db1', FROM_1: 'only1' })
        ),
        [U2]: toBwsSecrets(baseSecrets({ DATABASE_URL: 'db2-overrides', FROM_2: 'only2' }))
      }
    });
    try {
      const r = runSecureRun(repo, { env: { BWS_PROJECT_ID: `${U1}, ${U2}` } });
      assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
      assert.equal(r.childEnv.API_KEY, 'shared', 'non-overlapping key from project 1 should load');
      assert.equal(r.childEnv.DATABASE_URL, 'db2-overrides', 'later project should win overlay');
      assert.equal(r.childEnv.FROM_1, 'only1');
      assert.equal(r.childEnv.FROM_2, 'only2');
      assert.equal(
        r.childEnv.BWS_PROJECT_ID,
        U1,
        'child BWS_PROJECT_ID should be the primary (first) UUID'
      );
      assert.equal(
        r.childEnv.BWS_PROJECT_IDS,
        `${U1},${U2}`,
        'BWS_PROJECT_IDS should list all loaded UUIDs in order'
      );
    } finally {
      teardown(repo.tmpDir);
    }
  }
);

test('invalid UUID segments are skipped, valid ones still load', skipIfWindows, () => {
  const repo = createConsumerRepo();
  writeFixture(repo.tmpDir, {
    projects: {
      [U1]: toBwsSecrets(baseSecrets({ ONLY_VALID: 'yes' }))
    }
  });
  try {
    const r = runSecureRun(repo, { env: { BWS_PROJECT_ID: `${INVALID}, ${U1}` } });
    assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
    assert.equal(r.childEnv.ONLY_VALID, 'yes');
    assert.equal(r.childEnv.BWS_PROJECT_ID, U1);
  } finally {
    teardown(repo.tmpDir);
  }
});

test('duplicate UUIDs (case-insensitive) are deduped, order preserved', skipIfWindows, () => {
  const repo = createConsumerRepo();
  writeFixture(repo.tmpDir, {
    projects: {
      [U1]: toBwsSecrets(baseSecrets({ A: '1' })),
      [U2]: toBwsSecrets(baseSecrets({ B: '2' }))
    }
  });
  try {
    const r = runSecureRun(repo, {
      env: { BWS_PROJECT_ID: `${U1}, ${U1.toUpperCase()}, ${U2}` }
    });
    assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
    assert.equal(r.childEnv.A, '1');
    assert.equal(r.childEnv.B, '2');
    assert.equal(
      r.childEnv.BWS_PROJECT_IDS,
      `${U1},${U2}`,
      'duplicates should not appear in BWS_PROJECT_IDS'
    );
  } finally {
    teardown(repo.tmpDir);
  }
});

test('cleanup: .env.secure* files are removed after a successful run', skipIfWindows, () => {
  const repo = createConsumerRepo();
  writeFixture(repo.tmpDir, {
    projects: {
      [U1]: toBwsSecrets(baseSecrets({ A: '1' })),
      [U2]: toBwsSecrets(baseSecrets({ B: '2' }))
    }
  });
  try {
    const r = runSecureRun(repo, { env: { BWS_PROJECT_ID: `${U1}, ${U2}` } });
    assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
    assert.deepEqual(
      r.leftoverSecureFiles,
      [],
      `expected no .env.secure* leftover, found: ${r.leftoverSecureFiles.join(', ')}`
    );
  } finally {
    teardown(repo.tmpDir);
  }
});

test('BWS_KEEP_SECURE_FILES=true preserves .env.secure* after a run', skipIfWindows, () => {
  const repo = createConsumerRepo();
  writeFixture(repo.tmpDir, {
    projects: {
      [U1]: toBwsSecrets(baseSecrets({ A: '1' })),
      [U2]: toBwsSecrets(baseSecrets({ B: '2' }))
    }
  });
  try {
    const r = runSecureRun(repo, {
      env: { BWS_PROJECT_ID: `${U1}, ${U2}`, BWS_KEEP_SECURE_FILES: 'true' }
    });
    assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
    assert.ok(r.leftoverSecureFiles.length > 0, 'expected .env.secure* files preserved');
    assert.ok(
      r.leftoverSecureFiles.some((f) => f === `.env.secure.${U1}`),
      `expected .env.secure.${U1}, got ${r.leftoverSecureFiles.join(', ')}`
    );
  } finally {
    teardown(repo.tmpDir);
  }
});

test(
  'fail-fast: one unknown UUID in multi + BWS_MULTI_PROJECT_FAIL_FAST=true exits non-zero',
  skipIfWindows,
  () => {
    const repo = createConsumerRepo();
    writeFixture(repo.tmpDir, {
      projects: {
        [U1]: toBwsSecrets(baseSecrets({ A: '1' }))
        // U3 deliberately missing → fake-bws returns 404
      }
    });
    try {
      const r = runSecureRun(repo, {
        env: {
          BWS_PROJECT_ID: `${U1}, ${U3}`,
          BWS_MULTI_PROJECT_FAIL_FAST: 'true'
        }
      });
      assert.notEqual(r.status, 0, `expected non-zero exit, got ${r.status}. stderr:\n${r.stderr}`);
    } finally {
      teardown(repo.tmpDir);
    }
  }
);

test('multiline secret round-trips across overlay merge', skipIfWindows, () => {
  const multiline = '-----BEGIN KEY-----\nabc=def=ghi==\nline3\n-----END KEY-----';
  const repo = createConsumerRepo();
  writeFixture(repo.tmpDir, {
    projects: {
      [U1]: toBwsSecrets(baseSecrets({ PRIVATE_KEY: 'will-be-overridden' })),
      [U2]: toBwsSecrets(baseSecrets({ PRIVATE_KEY: multiline }))
    }
  });
  try {
    const r = runSecureRun(repo, { env: { BWS_PROJECT_ID: `${U1}, ${U2}` } });
    assert.equal(r.status, 0, `secureRun exit ${r.status}. stderr:\n${r.stderr}`);
    assert.equal(
      r.childEnv.PRIVATE_KEY,
      multiline,
      'multiline value should round-trip intact through merge'
    );
  } finally {
    teardown(repo.tmpDir);
  }
});
