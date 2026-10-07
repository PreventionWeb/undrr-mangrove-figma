# Repository split status

Updated 7 October 2026. Repository migration is the current focus. Native Figma changes and publication are parked.

## Verified checkpoints

- Maintenance tooling and the normal 32-family/383-variant construction entry are migrated to this repository. Maintenance remains the default workflow.
- Fresh remote source and toolkit checkouts at upstream `d5e790d3` and toolkit `1953670d` passed locked installation and all six maintenance/normal build, check and test commands. Generated source CSS, maintenance JSON, normal JSON and normal runtime matched the retained outputs exactly. This is a bounded checkpoint, not final feature-head validation.
- The complete 3,161-file tracked upstream checkpoint is independently archived. Its checksum and preservation limits are in [the evidence index](../evidence/index.json). The upstream feature branch and separate native backups remain intact.
- One unchanged original expanded exporter invocation completed successfully. Independent review verified its input pins, trace receipt, unchanged source inputs and complete packet: 139 draft families, 2,269 variants, six dependencies, 79,225 variables, 4,063 text definitions and 337 effects. The packet is 210,368,334 bytes with SHA256 `f01e9a8e2700e3506c77f7dd0659b7f944e41f1703d01e0e7231b83bfa235b18`.
- Independent review reproduced the actual read classification. A cold loader replay produced 156 file-URL package reads matching the original opaque-read candidate paths and order. It identified the ambient parent package read as Browserslist configuration discovery during Babel target resolution. An explicit configuration refusal removed that discovery in a focused fixture with unchanged fixture output. This corroborates loader behaviour; it does not recover the original opaque arguments or prove complete exporter parity.

## Remaining migration gates

1. Resolve the actual input boundary. The trace contains 2,255 observed file paths, 156 opaque object-path reads and one ambient parent `package.json` read outside the source checkout. Apply the reviewed loader boundary and remove ambient configuration dependence without changing complete recipe results. Distinguish executable helper bodies from immutable historical hash/provenance inputs.
2. Extract expanded recipes, supporting tests and operational tooling with explicit source, toolkit and verified reference ownership. Preserve original/current helper mappings and corruption refusal. Keep upstream tokens, component source, styles and authored media upstream.
3. Freeze the required reference manifest and immutable release assets, including licence/provenance records. The current candidate set contains 1,185 files totalling 401,599,561 bytes; this is not an admitted package. The reviewed retrieval prototype has a 64 MiB compressed and expanded limit per part, so real membership, multipart layout and public retrieval still need validation.
4. Verify an actual migrated expanded export against the complete original packet, plus missing/corrupt input refusal and source-only dependency checks. Run final clean acquisition, locked installation and reference download validation at the final toolkit head. Preserve exact maintenance and normal output compatibility.
5. Account for remaining scripts, tests and documentation, and index historical evidence separately. Reduce [Mangrove PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) by a normal commit only after migration and preservation gates pass. The reviewed, unapplied candidate has three paths: token-engine exports, a documentation index link and Figma integration documentation. Its base remains `spike/react-aria-surface`.
6. Update both PR descriptions and acceptance criteria from the final reviewed trees. Changes to this repository remain in [draft PR #1](https://github.com/PreventionWeb/undrr-mangrove-figma/pull/1), targeting `main`.

## Acceptance boundary

Additional bounded connector tests reproduce two original payload-budget failures exactly; see [the inherited transport gates](RELEASE-STATUS.md#inherited-connector-transport-gates). Their assertions remain intact and their failure is separate from extraction compatibility.

These checks establish migration evidence only. Expanded native rendering, fonts, capacity, page assembly, publication, consumer restoration and novice handoff remain separate [release gates](RELEASE-STATUS.md). Passing token publication or source recipes does not satisfy them. No upstream thinning or expanded reference admission has occurred yet.

GitHub listing endpoints may be suppressed. Status is checked through exact-number PR requests; listing responses are not used to claim queue completeness. Actions are unavailable, so verification is local.
