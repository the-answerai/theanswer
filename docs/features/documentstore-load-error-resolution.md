# Document Store Load Error Resolution

## Goal
Resolve load failures and instability when processing very large domain datasets in Document Store flows, especially during preview/process operations.

## Problem Summary (from meeting transcripts)
- High limits in preview/process could timeout or overload the platform when datasets reached tens of thousands of domains.
- The processing path was effectively waiting to collect all chunks before safe persistence completed, creating memory pressure during large runs.
- Failure handling risked ending in a bad state where a long run could fail late and lose practical progress.

Source transcripts reviewed:
- `/Users/diegocosta/Downloads/GMT20260311-174121_Recording.transcript.vtt`
- `/Users/diegocosta/Downloads/GMT20260311-160055_Recording.transcript.vtt`
- `/Users/diegocosta/Downloads/GMT20260312-182400_Recording.transcript.vtt`

## Scope Delivered

### 1) Durable batch persistence for chunk save flows
File: `packages/server/src/services/documentstore/index.ts`

- Save chunks in bounded batches (`SAVE_BATCH_SIZE`) with per-batch failure handling.
- Preserve partial progress by updating loader/store status to `STALE` when a batch fails.
- Report real persisted counts (`totalChunks`, `totalChars`) instead of optimistic totals.

### 2) Safe delete timing with pre-existing scope only
File: `packages/server/src/services/documentstore/index.ts`

- Capture pre-existing chunk IDs before inserting replacements.
- Delete only those pre-existing IDs after successful persistence.
- Avoid broad post-save deletes that can match newly inserted rows.

### 3) Upsert pipeline stability for large datasets
File: `packages/server/src/services/documentstore/index.ts`

- Keep keyset pagination (`MoreThan(lastId)`) for chunk reads into upsert.
- Preserve full-cleanup contract by accumulating docs and calling upsert once in that branch.
- Maintain organization scoping on read/write/delete paths.

### 4) Preview pagination contract
Files:
- `packages/server/src/Interface.DocumentStore.ts`
- `packages/server/src/services/documentstore/index.ts`

- Added `previewChunkOffset` to preview data contract.
- Added offset-aware slicing in `previewChunks` response.

## What This Fixes
- Reduces timeout/instability risk under high-volume loads by avoiding all-or-nothing behavior in save paths.
- Prevents accidental deletion of newly saved chunks in refresh/save flows.
- Improves recoverability of long-running loads by preserving persisted progress and clear status transitions.

## Validation Performed
- `pnpm --filter flowise test -- --runInBand test/services/documentstore/index.test.ts`
- `pnpm --filter flowise build`
- `pnpm --filter flowise-components build`

## Remaining Performance Note
- `previewChunks` currently still generates all chunks before applying offset/count slicing.
- This is functionally correct but can be expensive for very large datasets.
- Follow-up optimization can move to windowed generation to avoid materializing the full set for small previews.
