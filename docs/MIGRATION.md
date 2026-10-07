# Repository migration

Mangrove owns its token engine, tokens, components, styles and authored media. This repository owns Figma export/import adapters, maintenance and construction plugins, recipe translation, supporting tests and operating documentation. Maintenance remains the default entry; normal construction and expanded export are optional commands.

## Supported source and preservation

The pushed thin Mangrove checkpoint is `1639293738232ade132b442ab0fe983dec3d65d5`. Its four-path integration retains token-engine exports, the documentation link, Figma integration documentation and minimal workspace lock alignment. The original extraction revisions remain provenance in `source-lock.json`; they are not substituted for the actual source head during export.

The complete upstream checkpoint `d5e790d3b0318730fdbd270279f340f35a2833ab` is preserved in a 3,161-path archive. Its checksum and limits are recorded in [the evidence index](../evidence/index.json). Git history and native backups remain separate. Inactive historical tooling is accounted for in [the ownership index](TOOLING-OWNERSHIP.md), rather than presented as an active workflow.

## Compatibility

The normal kit contains 32 families and 383 finite variants. Its JSON and runtime retain their original bytes. Source reads use the explicit Mangrove checkout; compiler dependencies and Figma helpers belong to this toolkit. The historical FormAction source citation remains unchanged in the packet, while its guarded current helper is toolkit-owned; `source-lock.json` records that mapping.

The expanded catalogue contains 139 families and 2,269 variants. The migrated preserved-source packet matched the entire original file. The corrected private thin-source build differed only in the true `source.revision`. Reference inputs are checksum-pinned release assets; historical code proofs are nonexecuting members. Public retrieval and fresh whole-cache admission passed independent review.

Fresh remote clones at the supported source checkpoint and toolkit `e39d58f2e5d87698a6ea4e96d8fe9ad53a09c3a0` passed locked installation, source CSS generation and all six maintenance/normal commands. All retained output hashes matched. The separately guarded expanded preparation and full 1,270-member cache verification also passed.

## Final review

- Final remote expanded packet comparison: **passed independent review**, with only the actual top-level source revision changed.
- Final remote 19-test supporting cohort: **all 19 passed independent review**, with unchanged protected inputs.
- Repository split acceptance: **pending human review of the two PRs and final evidence**.

The 63 historical contract documents and 119 remaining inactive reusable sources are accounted for; activating them is not a split acceptance gate. Native rendering, fonts, capacity, edited reflow, canonical integration, publication and consumer handoff remain separate [release gates](RELEASE-STATUS.md).
