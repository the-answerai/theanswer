#!/usr/bin/env node
/**
 * Writes the child process's env (serialized JSON) to the path at E2E_ENV_SINK.
 * Used by E2E tests to observe what the wrapped command received.
 */
import fs from 'node:fs';

const sink = process.env.E2E_ENV_SINK;
if (!sink) {
  process.exit(0);
}
const snapshot = {};
for (const [k, v] of Object.entries(process.env)) {
  snapshot[k] = v;
}
fs.writeFileSync(sink, JSON.stringify(snapshot));
