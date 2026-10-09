# Maintained selected native rebuild

This optional entry reuses the shared connector compiler and kit builder. It supports an **unchanged-source rebuild of an already accepted static Tag library**, including its five auxiliary specimens, 25 brand/Tone cases and four headings. It pins the accepted static source packet; changing that pin needs a separate reviewed source/native release. It refuses first construction, missing helpers/styles, changed source values, unknown anatomy and asset migration. It never publishes.

The normal 32-family/383-variant kit and its generated output are unchanged. The native runner uses small maintained capture, mutation and Tag-policy modules, with no historical generated runtime or embedded Figma baseline. Its unchanged-source Tag path passed two ordinary native rebuilds in the retained unpublished rehearsal on 2026-10-08, including one final R3 execution. See [actual acceptance and report pins](../../docs/COMPONENT-MAINTENANCE.md#remaining-tooling-simplification).

## Prepare and run

Use the source revision in `source-lock.json`. Export the selected profile and compile the optional plugin:

```sh
MANGROVE_SOURCE_ROOT=/path/to/locked/mangrove npm run build:kit:tag -- --output /tmp/tag-source.json
npm run build:selected -- --source /tmp/tag-source.json --out /tmp/mangrove-selected-tag
```

Derive an initial target configuration from the accepted full snapshot for the intended kit, using the file key from its visible URL:

```sh
node scripts/build-figma-selected.cjs --source /tmp/tag-source.json \
  --baseline /tmp/tag-before.json --file-key FILE_KEY \
  --out /tmp/tag-target.json
```

Import `/tmp/mangrove-selected-tag/manifest.json` as a development plugin. Open the intended file and page, load the configuration, and confirm the visible file association. Choose **Capture session baseline**. The plugin keeps the full fresh baseline in memory and derives its matching configuration internally. Review the returned target, source checksum and inventory counts, then explicitly approve **Rebuild captured session**. The session token is consumed before execution; another execution requires a fresh capture.

The rebuild returns a small automatic recorded-check summary. **Save summary** retains that result; **Download full report** explicitly exports the complete evidence. Keep the full report for release review. It contains the full before/after snapshots, all mutation attempts, any temporary probe IDs and honest errors. A failure checkpoint is also downloadable before the final capture. The summary does not establish visual parity, human acceptance or publication. The advanced uploaded-baseline path remains available for recovery. Do not edit an installed bundle while it runs because Figma development plugins hot reload.

The single-session workflow passed two ordinary native executions of the same frozen candidate in the retained unpublished Tag rehearsal on 2026-10-09. Independent review confirmed exact full recorded preservation, repeat geometry and truthful summaries. See [session acceptance and report pins](../../docs/COMPONENT-MAINTENANCE.md#single-session-tag-workflow). See [local automation research and efficiency measurements](../../docs/AUTOMATION.md).

The target fence requires the page, local collection key, Tag set key and every ordered member ID/key. When native `fileKey` is unavailable, checking the fresh visible URL remains necessary. Configuration has no canonical-file bypass. Keep manifest ID `mangrove-tokens-exploratory` unchanged; use a distinct display name when necessary. Private plugin data belongs to that ID. When native `pluginId` is available, a different ID refuses before reading metadata or rebuilding. Reports distinguish the observed ID from the expected scope and explicitly record when it is unavailable.

The shared producer rebuilds only the existing Tag masters and source specimens. The policy restores the five source specimens to intrinsic HUG sizing after the generic renderer's FILL projection. Foundations, styles, other families, auxiliary examples, custom instance edits, links, modes, geometry and every recorded page must equal the baseline at the end. Any permanent creation or drift makes the report incomplete. There is no automatic rollback or publication.

## Verification and limits

```sh
MANGROVE_SOURCE_ROOT=/path/to/locked/mangrove npm run test:selected
```

To independently regenerate the recorded-check summary from a saved raw receipt and its exact source packet:

```sh
node scripts/summarize-figma-selected.cjs --report /path/to/full-report.json \
  --source /tmp/tag-source.json --out /path/to/new-summary.json
```

The CLI retains the raw report and records its checksum. It refuses an existing output path and exits unsuccessfully when recorded checks do not pass. It cannot establish native rendering or human acceptance from JSON alone.

Tests compare normal compiler output byte for byte, exercise the real shared producer and verify foreign mutations, immutable native data, failure journaling and preservation refusals. Models do not establish native font, geometry or raster equivalence.

Before calling this runner accepted, run it in the retained unpublished Tag rehearsal against a fresh baseline, inspect the source matrix, and repeat with exact full recorded geometry and zero permanent creation. Compare to the accepted static Tag source/anatomy. Keep a local `.fig` backup and the single report. No publication is required for this unchanged-source validation.

Tag remains static Latin SPAN content. Linked states, badges, grouped/constrained layout, RTL, arbitrary edits and source changes remain separate requests. Card/CTA support remain future extensions. The reusable capture module records the established native field schema, styled text segments, all local variable/style fields, instance links, plugin identities and every page without switching pages. Unsupported getters produce explicit read errors; the runner refuses an incomplete snapshot.
