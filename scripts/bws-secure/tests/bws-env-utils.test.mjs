/**
 * Run: node --test tests/bws-env-utils.test.mjs
 * Or: npm run test:bws-env
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseProjectIds,
  parseProjectIdsDetailed,
  parseEnvironmentOutput,
  serializeEnvRecordToPlaintext
} from '../bws-env-utils.js';

const u1 = '2d8c63de-62d5-4604-bb43-b357000e00b7';
const u2 = '8686161e-6b41-4498-b7bf-b3390109f1d3';

test('parseProjectIds: single UUID', () => {
  assert.deepEqual(parseProjectIds(u1), [u1]);
});

test('parseProjectIds: multi with spaces', () => {
  assert.deepEqual(parseProjectIds(` ${u1} , ${u2} `), [u1, u2]);
});

test('parseProjectIdsDetailed: invalid segments skipped, order preserved', () => {
  const d = parseProjectIdsDetailed(`not-a-uuid,${u1},bad,${u2}`);
  assert.deepEqual(d.ids, [u1, u2]);
  assert.deepEqual(d.skippedInvalid, ['not-a-uuid', 'bad']);
  assert.equal(d.skippedDuplicates.length, 0);
});

test('parseProjectIdsDetailed: duplicate UUIDs (case-insensitive)', () => {
  const d = parseProjectIdsDetailed(`${u1},${u1.toUpperCase()},${u2}`);
  assert.deepEqual(d.ids, [u1, u2]);
  assert.equal(d.skippedDuplicates.length, 1);
});

test('parseEnvironmentOutput + serializeEnvRecordToPlaintext: multiline round-trip', () => {
  const record = {
    A: 'line1\nline=with=equals\nline3',
    B: 'single',
    EMPTY: ''
  };
  const text = serializeEnvRecordToPlaintext(record);
  const back = parseEnvironmentOutput(text, { stripSerializedContinuationSpace: true });
  assert.equal(back.A, record.A);
  assert.equal(back.B, record.B);
  assert.equal(back.EMPTY, record.EMPTY);
});

test('overlay merge semantics via Object.assign (documentation)', () => {
  const base = { X: '1', Y: '2' };
  const overlay = { Y: '9', Z: '3' };
  assert.deepEqual({ ...base, ...overlay }, { X: '1', Y: '9', Z: '3' });
});
