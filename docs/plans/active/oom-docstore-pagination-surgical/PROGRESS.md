# Progress - OOM DocStore Pagination Surgical

## Status

- Current phase: Planning complete, implementation not started.

## Completed

- Created dedicated worktree from `staging`:
  - Path: `/Users/diegocosta/dev/work/aai/theanswer-staging-oom-surgical`
  - Branch: `fix/oom-docstore-pagination-surgical`
- Confirmed current hotspot locations:
  - Full chunk load in `_insertIntoVectorStoreWorkerThread`
  - Unbounded concurrent chunk saves in `_saveChunksToStorage`
- Wrote surgical plan with constrained scope and verification criteria.
- Ran parallel subagent investigation to close hidden assumptions:
  - Internal code-path risk audit for `_saveChunksToStorage` and `_insertIntoVectorStoreWorkerThread`
  - Caller/contract dependency mapping for upsert middleware/queue paths
  - Render OOM observability validation (events vs app logs)
- Updated `PLAN.md` with explicit gaps, compatibility constraints, and stronger acceptance criteria.
- Ran Oracle validation on updated plan; resolved remaining ambiguity by explicitly locking delete ordering semantics for this surgical pass.

## Next actions

1. Implement Change A (paged read + upsert aggregation).
2. Implement Change B (bounded chunk persistence batching).
3. Preserve compatibility constraints (docId propagation, return shape, status/counter semantics, safe-delete ordering).
4. Run diagnostics, build, and high-volume upsert verification.
5. Validate no Render OOM instance event in target verification window.
6. Document measured memory behavior and final outcome.

## Notes

- Intentionally limiting first iteration to one server file to minimize risk.
- If memory remains high after this pass, phase 2 candidate is streaming loader outputs before in-memory chunk materialization.
