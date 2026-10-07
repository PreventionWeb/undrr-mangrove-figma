# Migration plan

## Agreed repository boundary

The dedicated Figma repository is the destination for the bulk of upstream PR #1319 and the place to run occasional Figma updates. Changes here are reviewed through a feature-branch PR against `main`. The Mangrove PR will be reduced to documentation linking here and the integration or source contracts required by the tooling. The current upstream branch remains intact until migration and preservation checks pass.

Mangrove continues to own its token engine, token definitions, component implementation, styles and authored source media. This repository owns Figma adapters, maintenance and construction plugins, recipe translation, supporting tests and operational documentation. Construction and experimental catalogue workflows stay separate from the occasional variable/style maintenance entry.

Required captured recipe inputs must be classified before relocation. They are not interchangeable with historical evidence or generated output. Bulk reference inputs and evidence need immutable packages with revisions, checksums and retrieval instructions; small necessary fixtures may be tracked. No second editable copy of Mangrove tokens or component styles will be introduced.

The latest preserved upstream documentation checkpoint is `d5e790d3b0318730fdbd270279f340f35a2833ab`. The executable compatibility pin in `source-lock.json` remains unchanged until output comparison and source-boundary review justify a new pin. See [release validation status](RELEASE-STATUS.md) for current native gates. Repository migration does not establish native acceptance or require changes to the canonical library.

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
