# Migration plan

## Agreed repository boundary

The dedicated Figma repository is the destination for the bulk of upstream PR #1319 and the place to run occasional Figma updates. Changes here are reviewed through a feature-branch PR against `main`. The Mangrove PR will be reduced to documentation linking here and the integration or source contracts required by the tooling. The current upstream branch remains intact until migration and preservation checks pass.

Mangrove continues to own its token engine, token definitions, component implementation, styles and authored source media. This repository owns Figma adapters, maintenance and construction plugins, recipe translation, supporting tests and operational documentation. Construction and experimental catalogue workflows stay separate from the occasional variable/style maintenance entry.

Required captured recipe inputs must be classified before relocation. They are not interchangeable with historical evidence or generated output. Bulk reference inputs and evidence need immutable packages with revisions, checksums and retrieval instructions; small necessary fixtures may be tracked. No second editable copy of Mangrove tokens or component styles will be introduced.

The latest preserved upstream documentation checkpoint is `d5e790d3b0318730fdbd270279f340f35a2833ab`. The executable compatibility pin in `source-lock.json` remains unchanged until output comparison and source-boundary review justify a new pin. See [release validation status](RELEASE-STATUS.md) for current native gates. Repository migration does not establish native acceptance or require changes to the canonical library.

## Initial extraction

The reduced maintenance implementation has been copied from the exact upstream checkpoint in `source-lock.json`. The only source-boundary changes are an explicit `MANGROVE_SOURCE_ROOT` adapter and separating generated output paths from source input paths. The upstream token engine stays upstream. The exporter test's runtime prefix assertion now includes the native-collections flag already emitted by the original bundle.

The upstream maintenance merge manifest is retained as provenance in `source-lock.json`, not as an assertion that those files should also land in the component repository.

## Normal construction cohort

The normal 32-family/383-variant exporter, runtime and bounded connector compiler now live here with focused harnesses. Mangrove source reads use `MANGROVE_SOURCE_ROOT`; compiler/parser dependencies and Figma helper reads use this toolkit. Maintenance remains the default build/test workflow, with optional `build:kit`, `check:kit` and `test:kit` commands. Expanded recipes have now been extracted separately; their external reference delivery and supporting workflow migration are still in progress.

The normal JSON (14,776,426 bytes; SHA256 `4525e54bda48ecf28fc2503e534a132658ebc4ab7f26d8845be07713bc965943`) and full runtime (1,051,949 bytes; SHA256 `0954833c96b7ae710fc6876469e3bc72ba7c892dd03d4292e809bc4abf5082fd`) match the retained upstream output exactly. The initial source-only fixture exposed a remaining upstream Figma helper read; the corrected FormAction precision guard now reads the toolkit helper and still refuses changed precision or source mapping. Layout/canvas harnesses load their existing required helpers. Passing extraction checks do not close native release gates.

The historical FormAction packet citation `scripts/figma-maintenance-foundations.cjs:20` remains unchanged for byte compatibility. Its guarded current helper belongs to this toolkit at line 21. The explicit mapping and cohort paths are in `source-lock.json`; the original source compatibility revision and initial extraction provenance remain intact. No upstream Figma helper is required in the source-only footprint.

## Preservation checkpoint

The complete tracked upstream source at `d5e790d3` is preserved in `Mangrove-upstream-spike-d5e790d3-20261007.tar.gz` (262,166,740 bytes; SHA256 `0ca899f0f75e80c33b0f9959111152311279f21a29321a1e4a09245f3f627a18`). Independent review verifies all 3,161 tracked paths, Git blob identities, byte sizes, executable bits and symlinks. The upstream branch remains intact. Git history, untracked files, native `.fig` backups and earlier evidence packages remain separate and preserved.

This archive has no release download URL yet. It does not establish clean reference retrieval, a portable installation or native acceptance. Its checksum and scope are recorded in [the evidence index](../evidence/index.json).

## Next steps

See [the current split status](SPLIT-STATUS.md) for verified checkpoints, unresolved input boundaries and final migration gates.

1. Resolve observed expanded input ownership and loader dependencies, including opaque reads and ambient configuration discovery.
2. Migrate expanded recipes, supporting tests and operational tooling in independently reviewed cohorts with exact output compatibility. Keep experimental catalogue work separate from maintenance.
3. Package required bulk reference inputs as immutable release assets. Index exact membership, byte sizes, SHA256 digests, source revisions, licences, provenance and retrieval URLs.
4. Verify downloading and building from fresh checkouts at the final toolkit head before claiming portability. Check the complete expanded packet and retain exact maintenance/normal outputs and refusal behaviour.
5. Account for all remaining tooling and index historical evidence. Preserve the complete tracked upstream checkpoint, Git history and separate native backups.
6. Reduce upstream PR #1319 to necessary source/export changes and integration documentation, with links to this repository and the preserved checkpoint. Retain its `spike/react-aria-surface` base.

Native acceptance remains a separate release gate. It is not required to demonstrate repository relocation, and relocation does not close it.

## Acceptance limits

Extraction and passing mocks do not establish native library acceptance. Outstanding upstream gates include changed text/effect-style publication, composite consumer updates and novice handoff. The expanded catalogue also retains native font, rendering, capacity and page-assembly gates. No Figma file is mutated or published by scaffolding this repository.
