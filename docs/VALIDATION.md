# Maintained-toolkit validation

The historical extraction, remote-install, expanded parity and supporting-test receipts remain at their recorded revisions on the [evidence checkpoint](EVIDENCE.md). They are not new native acceptance results.

## Retained baseline

Supported Mangrove source revision: `1639293738232ade132b442ab0fe983dec3d65d5`. Original toolkit executable verification: `e39d58f2e5d87698a6ea4e96d8fe9ad53a09c3a0`.

The retained maintenance tests verify five-brand alias closure, isolated generation/freshness, source mutation/refusal, repeat importer identity, selected-brand switching, controller concurrency/refusal and interface routing. The seed asset-record SHA256 is `7bc8ab098383dc5ac6c008d46e5a15f1ef440c66cc028d44203fe554f271a04c`.

Bounded construction tests retain original DTO/runtime hashes and 32-family/383-variant assertions, plus builder/layout/flow/UI/export/font behaviour. `test:kit:extraction` and `test:kit:behavior` partition the existing aggregate without altering its assertions.

## Narrowed PR checks, 8 October 2026

On Node.js 24.18.0, a clean `npm ci` using the pruned lockfile passed (122 installed packages). The six maintained commands passed against the installed supported source checkout:

- `npm run build`, `npm run check`, `npm test`.
- `npm run build:kit`, `npm run check:kit`, `npm run test:kit`.

The maintenance asset-record hash remains unchanged. Normal extraction tests retain the original DTO/runtime hashes, 32 families and 383 variants; all behavioural mocks pass. All 65 files in the retained normal construction cohort are byte-identical to the preserved toolkit checkpoint. No exporter, importer or native runtime code changed during narrowing.

Independent read-only review found no dependency-removal or scope blockers: local module references resolve, needed compiler/mock dependencies remain, source-lock paths exist and local Markdown links resolve. Touched Markdown/JSON formatting, copy checks and `git diff --check` pass. Expanded commands are removed from this checkout; their historical receipts remain separate. Native execution, publication and human acceptance are not part of this scope change.

A source trial at merged Mangrove main `5deafc2869a6a293c4019f42703f4f44c24f75ed` fails before export because `_control-tokens.scss` is absent. Both maintenance and construction continue to require the historical supported source; current-main compatibility remains open. No missing style defaults are invented, and no source guards or historical baseline hashes are relaxed.
