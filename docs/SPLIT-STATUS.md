# Toolkit scope and acceptance

Updated 8 October 2026.

## Completed

- Mangrove PR #1319 merged into main as `5deafc2869a6a293c4019f42703f4f44c24f75ed`: six files, 99 additions and one deletion. Token-engine exports and shared Storybook documentation are upstream; React Aria changes are excluded.
- The full toolkit checkpoint and history are preserved on the [evidence branch](EVIDENCE.md).
- Toolkit PR #1 now targets a maintained scope: variable/style maintenance, bounded 32-family/383-variant construction, relevant tests and operating documentation.
- Expanded recipes, page patterns, optional reference/supporting commands and detailed historical inventories are excluded from the maintained tree.
- A clean locked install and all six maintained commands pass against the supported source; retained normal code and historical compatibility fixtures are unchanged. Independent scope/dependency review found no blockers.
- Designer-to-code and selected component maintenance runbooks include ownership, recovery and review safeguards. Fresh-agent orientation passed previously; it does not establish human novice native acceptance.

## Remaining acceptance

- Review and merge toolkit PR #1 against its narrowed scope.
- Establish compatibility against current Mangrove main. The supported historical source checkpoint remains required for both export workflows.
- Perform one actual bounded designer/developer handoff and an extracted-plugin native rehearsal, then relevant publication/consumer checks.
- Complete affected [native release gates](RELEASE-STATUS.md); source/mock checks do not close them.
- Once toolkit documentation lands on main, update the upstream overview's immutable toolkit links to durable main links in a focused follow-up.

GitHub listing endpoints may be suppressed; status uses exact-number PR requests. Actions are unavailable, and Linux execution remains unverified. Local verification is recorded in [validation](VALIDATION.md).
