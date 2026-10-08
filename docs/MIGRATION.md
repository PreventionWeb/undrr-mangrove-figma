# Ownership and source boundary

Mangrove owns its token engine, YAML tokens, components, styles and authored media. This repository owns the variable/style exporter and importer, maintenance interface, bounded construction recipes/runtime and relevant tests. Source reads use `MANGROVE_SOURCE_ROOT`; source tokens/styles are not copied here.

## Supported source

[source-lock.json](../source-lock.json) records the supported Mangrove revision `1639293738232ade132b442ab0fe983dec3d65d5`, original extraction provenance and the retained normal construction cohort. Normal construction contains 32 families and 383 variants. The historical FormAction source citation remains in its packet; the current helper is toolkit-owned as recorded in the lock.

Mangrove [PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) merged into main as `5deafc2869a6a293c4019f42703f4f44c24f75ed`, adding only token-engine exports and integration documentation. It is independent of React Aria. The historical source branch remains preserved.

Current main lacks `stories/assets/scss/_control-tokens.scss`, which the shared foundations exporter requires. Both maintained workflows therefore still use the supported historical source checkout. Main-source compatibility needs a reviewed adapter/source decision and output comparison; merging the bridge does not establish it. Manual designer-to-Mangrove work does not require this toolkit or its historical checkout.

## Maintained versus preserved work

PR #1 is narrowed through ordinary commits after preserving the full toolkit checkpoint on an evidence branch. Maintenance, bounded construction and their dependency closure remain active. Expanded recipes, reference fetch/preparation, optional supporting-cohort commands, migration inventories and detailed receipts are available through [the evidence guide](EVIDENCE.md). Historical parity records remain tied to their exact revisions and are not relabelled as current native acceptance.

Adopting a new family or source revision requires a focused compatibility review. Inactive experiments are not an implementation or merge prerequisite. Apply the [native gates](RELEASE-STATUS.md) when releasing affected assets.
