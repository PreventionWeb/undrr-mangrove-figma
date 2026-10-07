# Repository split status

Updated 7 October 2026. Repository migration is the current focus. Native Figma changes and publication are parked.

## Verified checkpoints

- Maintenance tooling and the normal 32-family/383-variant construction entry are migrated to this repository. Maintenance remains the default workflow.
- Fresh remote source and toolkit checkouts at upstream `d5e790d3` and toolkit `1953670d` passed locked installation and all six maintenance/normal build, check and test commands. Generated source CSS, maintenance JSON, normal JSON and normal runtime matched the retained outputs exactly. This is a bounded checkpoint, not final feature-head validation.
- The complete 3,161-file tracked upstream checkpoint is independently archived. Its checksum and preservation limits are in [the evidence index](../evidence/index.json). The upstream feature branch and separate native backups remain intact.
- One unchanged original expanded exporter invocation completed successfully. Independent review verified its input pins, trace receipt, unchanged source inputs and complete packet: 139 draft families, 2,269 variants, six dependencies, 79,225 variables, 4,063 text definitions and 337 effects. The packet is 210,368,334 bytes with SHA256 `f01e9a8e2700e3506c77f7dd0659b7f944e41f1703d01e0e7231b83bfa235b18`.
- Independent review reproduced the actual read classification. A cold loader replay produced 156 file-URL package reads matching the original opaque-read candidate paths and order. It identified the ambient parent package read as Browserslist configuration discovery during Babel target resolution. An explicit configuration refusal removed that discovery in a focused fixture with unchanged fixture output. This corroborates loader behaviour; it does not recover the original opaque arguments or prove complete exporter parity.

- The expanded recipe cohort is extracted with 63 toolkit-owned source files and compact input metadata. One actual migrated export passed independent full-file comparison with the original 210,368,334-byte packet. All 188 operation pins and 1,817 source/tool/reference inputs remained unchanged before and after execution.
- Seven private reference archives passed exact 1,270-member validation and actual whole-cache admission. Nine draft release assets, including the index and provenance sidecar, were uploaded and authenticated downloads matched all expected hashes. The release remains draft; this is not public retrieval acceptance.
- A private four-path thin source fixture passed locked installation and source CSS generation. Its minimal lock alignment adds eight workspace peer metadata lines without changing resolved dependencies. All 440 other source input bytes and four source runtime entry files match the preserved fixture. All six maintenance/normal commands pass against this fixture with exact retained outputs.

## Remaining migration gates

1. Finish the portable expanded prepare/export entry and the finite case-sensitive Tag stylesheet mapping. Keep explicit source, toolkit, reference and output ownership and exact corruption refusal.
2. Migrate supporting tests and operational tooling in bounded runnable groups. Preserve the original assertions, including intentional source/helper corruption, and account separately for retired experimental procedures.
3. Complete reference delivery and fresh public acquisition. Preserve all licence/provenance records and nonexecuting historical proof types. Draft authenticated downloads do not establish public URL or clean downloaded-cache acceptance.
4. Validate the final thin-source profile and final feature-head setup while retaining exact maintenance/normal output and complete expanded compatibility. The private fixture is a checkpoint, not a rewritten upstream PR.
5. Account for remaining scripts, tests and documentation, and index historical evidence separately. Reduce [Mangrove PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) by a normal commit only after migration and preservation gates pass. The reviewed private candidate now has four paths: token-engine exports, a documentation index link, Figma integration documentation and minimal existing workspace lock metadata alignment. Its base remains `spike/react-aria-surface`.
6. Update both PR descriptions and acceptance criteria from the final reviewed trees. Changes to this repository remain in [draft PR #1](https://github.com/PreventionWeb/undrr-mangrove-figma/pull/1), targeting `main`.

## Acceptance boundary

Additional bounded connector tests reproduce two original payload-budget failures exactly; see [the inherited transport gates](RELEASE-STATUS.md#inherited-connector-transport-gates). Their assertions remain intact and their failure is separate from extraction compatibility.

These checks establish migration evidence only. Expanded native rendering, fonts, capacity, page assembly, publication, consumer restoration and novice handoff remain separate [release gates](RELEASE-STATUS.md). Passing token publication or source recipes does not satisfy them. Actual local expanded reference admission has passed. Upstream thinning and public reference retrieval have not occurred yet.

GitHub listing endpoints may be suppressed. Status is checked through exact-number PR requests; listing responses are not used to claim queue completeness. Actions are unavailable, so verification is local.
