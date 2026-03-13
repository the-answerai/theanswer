# OOM DocStore Pagination Surgical Plan

## Goal

Eliminate OOM risk during document store upsert with the smallest safe set of code changes.

## Why this plan

Current OOM pressure comes from loading all chunks into memory and writing all chunks in unbounded parallelism. We will cap memory by batching at read and write boundaries, without changing the external API contract.

## Scope (Surgical)

1. `packages/server/src/services/documentstore/index.ts`
   - Update `_insertIntoVectorStoreWorkerThread` to upsert in paged batches instead of `find()` all chunks at once.
   - Update `_saveChunksToStorage` to replace global `Promise.all` over every chunk with bounded batch inserts.

## Non-goals

- No changes to document loader node contracts.
- No UI changes.
- No changes to vector store provider implementations.
- No schema migration.

## Implementation details

### Change A: Paged read + upsert loop

Location: `_insertIntoVectorStoreWorkerThread`.

Current behavior:
- Reads all `DocumentStoreFileChunk` rows for `storeId`/`docId` in one query.
- Builds one large `Document[]` in memory.
- Calls one monolithic upsert.

New behavior:
- Read chunks by `take`/`skip` (or equivalent ordered paging) with stable order by `chunkNo`.
- For each page:
  - Map only current page to `Document[]`.
  - Call `vectorStoreObj.vectorStoreMethods.upsert` with page docs.
  - Release references before next page.
- Aggregate numeric metrics (`numAdded`, `numUpdated`, `numSkipped`, `numDeleted`, `totalKeys`) across pages.
- Keep response shape compatible.

Default batch size:
- Start with `500` chunks/page (constant near function; no config surface change in this iteration).

### Change B: Bounded chunk persistence

Location: `_saveChunksToStorage`.

Current behavior:
- `Promise.all(response.chunks.map(...))` attempts saving all chunks concurrently.

New behavior:
- Insert chunks in bounded batches (for example `100` per batch).
- Process batches sequentially; inside a batch use `Promise.all` or sequential saves (prefer predictable bounded concurrency).
- Preserve chunk numbering and metadata behavior exactly.

## Risk assessment

- Primary risk: behavior drift in upsert result aggregation.
- Mitigation: preserve existing result keys and sum only numeric counters.
- Secondary risk: longer processing time due to bounded concurrency.
- Mitigation: choose balanced batch sizes and validate runtime on representative data.

## Gaps and assumptions closed

### Confirmed assumptions

- Render OOM evidence can be authoritative in instance events even when app logs do not include explicit heap traces.
- Main memory hotspots are in `documentstore/index.ts` at chunk save fan-out and all-at-once chunk fetch/upsert.

### Critical gaps and plan updates

1. **Chunk replacement safety was implicit**
   - Gap: delete ordering behavior must be explicit to avoid accidental semantic drift.
   - Plan update: keep current delete-first behavior (`delete` then insert) in this surgical iteration to avoid hidden contract changes; phase 2 can improve replacement safety with staged swap semantics.

2. **Chunk ordering and numbering constraints were implicit**
   - Gap: downstream reads depend on deterministic `chunkNo` ordering.
   - Plan update: preserve 1-indexed sequential `chunkNo` assignment and global order across batches.

3. **Status and counters integrity was under-specified**
   - Gap: `loader.totalChunks`, `loader.totalChars`, and loader/store status transitions are consumed by callers/UI.
   - Plan update: preserve current status semantics and accurate aggregate counters in batched mode.

4. **Error semantics for partial failures were ambiguous**
   - Gap: behavior under batch failure must remain explicit and compatible.
   - Plan update: keep fail-fast behavior, preserve wrapped `InternalFlowiseError` format, and avoid returning partial success payloads that change API contract.

5. **Pagination strategy had concurrency assumptions**
   - Gap: offset pagination can drift under concurrent writes.
   - Plan update: for this surgical iteration, scope to existing doc/store processing path and stable ordering; if drift appears in validation, phase 2 upgrades to keyset pagination.

6. **Vector upsert contract constraints were not explicit**
   - Gap: batching must not alter return shape consumed by middleware/queue callers.
   - Plan update: preserve return object shape and existing metric keys while summing per-batch numeric fields.

7. **Proof criteria for production OOM were weak**
   - Gap: previous verification did not mandate Render event-level evidence.
   - Plan update: acceptance now requires no Render OOM instance event for the target workload window, plus memory trend below hard limit.

## Hard compatibility constraints

- Preserve response shape from upsert middleware paths (direct and queue modes).
- Preserve `docId` propagation in upsert responses.
- Preserve current error wrapping style and HTTP error behavior.
- Preserve multi-tenant fields (`organizationId`, `userId`, `workspaceId`) in chunk persistence and upsert path.
- Keep code changes within `packages/server/src/services/documentstore/index.ts`.

## Verification plan

1. Targeted TypeScript checks
   - Ensure `packages/server/src/services/documentstore/index.ts` has zero diagnostics.

2. Build
   - Build server package successfully.

3. Functional check
   - Run document store upsert with a large file set (same scenario that previously OOMed).
   - Confirm completion without process crash.

4. Memory check
   - Observe peak heap during upsert and confirm it no longer scales linearly with total chunk count.
   - Validate no new Render instance event `Ran out of memory (used over 2GB)` during the verification window.

## Acceptance criteria

- No OOM crash in previously failing large upsert scenario.
- No Render OOM instance event for the validated workload/time window.
- Upsert completes and data is queryable.
- API contract remains compatible.
- Minimal file touch: only `documentstore/index.ts` for code change.

## Rollback

- Revert only this branch commit(s); no schema/data migration rollback needed.
