/**
 * Shared parsing and serialization for BWS multi-project env handling.
 * Keeps overlay merge round-trips safe for multiline secret values.
 */

export const BWS_PROJECT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parse comma-separated project IDs: trim, validate UUIDs, dedupe (case-insensitive), preserve order.
 *
 * @param {string | undefined | null} projectIdString
 * @returns {{ ids: string[], skippedInvalid: string[], skippedDuplicates: string[] }}
 */
export function parseProjectIdsDetailed(projectIdString) {
  const skippedInvalid = [];
  const skippedDuplicates = [];
  if (!projectIdString || typeof projectIdString !== 'string') {
    return { ids: [], skippedInvalid, skippedDuplicates };
  }

  const raw = projectIdString
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const seen = new Set();
  const ids = [];

  for (const token of raw) {
    if (!BWS_PROJECT_UUID_RE.test(token)) {
      skippedInvalid.push(token);
      continue;
    }
    const dedupeKey = token.toLowerCase();
    if (seen.has(dedupeKey)) {
      skippedDuplicates.push(token);
      continue;
    }
    seen.add(dedupeKey);
    ids.push(token);
  }

  return { ids, skippedInvalid, skippedDuplicates };
}

/**
 * Ordered unique UUIDs only (backward-compatible with simple call sites).
 * @param {string | undefined | null} projectIdString
 * @returns {string[]}
 */
export function parseProjectIds(projectIdString) {
  return parseProjectIdsDetailed(projectIdString).ids;
}

/**
 * Parse env-like text (BWS CLI `-o env` or decrypted `.env.secure.<uuid>`).
 * Continuation lines follow a `KEY=value` line; lines that are not new `KEY=` assignments
 * extend the previous value (including blank lines — matches bws-dotenv behavior).
 *
 * @param {string} output
 * @param {{ stripSerializedContinuationSpace?: boolean }} [options]
 * @returns {Record<string, string>}
 */
export function parseEnvironmentOutput(output, options = {}) {
  const stripCont = options.stripSerializedContinuationSpace === true;
  const result = {};
  if (output === undefined || output === null) return result;

  const lines = String(output).split('\n');
  let currentKey = null;
  let currentValue = '';

  for (const line of lines) {
    if (line.includes('=') && !line.startsWith(' ') && !line.startsWith('\t')) {
      if (currentKey !== null) {
        result[currentKey] = currentValue;
      }
      const equalIndex = line.indexOf('=');
      currentKey = line.substring(0, equalIndex).trim();
      currentValue = line.substring(equalIndex + 1);
    } else if (currentKey !== null) {
      let segment = line;
      if (stripCont && line.startsWith(' ')) {
        segment = line.slice(1);
      }
      currentValue += '\n' + segment;
    }
  }

  if (currentKey !== null) {
    result[currentKey] = currentValue;
  }

  return result;
}

/**
 * Serialize a key-value record to plaintext parseable by parseEnvironmentOutput.
 * Multiline values use a leading space on continuation lines so embedded `=` does not
 * start a false new key line.
 *
 * @param {Record<string, string | undefined | null>} record
 * @returns {string}
 */
export function serializeEnvRecordToPlaintext(record) {
  const lines = [];
  for (const [key, value] of Object.entries(record)) {
    if (key === undefined || key === null || key === '') continue;
    const str = value === undefined || value === null ? '' : String(value);
    const parts = str.split('\n');
    lines.push(`${key}=${parts[0] ?? ''}`);
    for (let i = 1; i < parts.length; i++) {
      // Prefix so line does not parse as a new KEY= row; parser strips one leading space on read.
      lines.push(` ${parts[i]}`);
    }
  }
  return lines.join('\n');
}
