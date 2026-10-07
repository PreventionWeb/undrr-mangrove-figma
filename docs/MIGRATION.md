# Migration plan

## Initial extraction

The reduced maintenance implementation has been copied from the exact upstream checkpoint in `source-lock.json`. The only source-boundary changes are an explicit `MANGROVE_SOURCE_ROOT` adapter and separating generated output paths from source input paths. The upstream token engine stays upstream. The exporter test's runtime prefix assertion now includes the native-collections flag already emitted by the original bundle.

The upstream maintenance merge manifest is retained as provenance in `source-lock.json`, not as an assertion that those files should also land in the component repository.

## Next steps

1. Complete a clean-download source/reference workflow and native acceptance for the extracted maintenance entry. Keep the complete output comparison as a migration gate for later cohorts.
2. Preserve an immutable complete upstream spike checkpoint and independently verify an archive before changing or removing its branch.
3. Audit full builder dependencies and classify captured files as required inputs, small test fixtures, reproducible outputs or historical evidence. Some source-footprint captures are executable recipe inputs and cannot simply be deleted.
4. Migrate the builder and recipes in independently reviewable cohorts. Keep experimental catalogue work separate from the maintenance entry.
5. Package required bulk reference inputs as release assets. Index exact file names, byte sizes, SHA256 digests, source revisions, provenance and retrieval URLs. Verify downloading and building from a clean checkout before claiming portability.
6. Reduce upstream PR #1319 to necessary source/export changes, with links to this repository and the preserved checkpoint. Reconcile the intended base with the separate React Aria work.

## Acceptance limits

Extraction and passing mocks do not establish native library acceptance. Outstanding upstream gates include changed text/effect-style publication, composite consumer updates and novice handoff. The expanded catalogue also retains native font, rendering, capacity and page-assembly gates. No Figma file is mutated or published by scaffolding this repository.
