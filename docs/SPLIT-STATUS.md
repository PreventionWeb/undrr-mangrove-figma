# Toolkit scope and acceptance

Updated 9 October 2026.

## Completed

- Mangrove PR #1319 merged into main as `5deafc2869a6a293c4019f42703f4f44c24f75ed`: six files, 99 additions and one deletion. Token-engine exports and shared Storybook documentation are upstream; React Aria changes are excluded.
- The full toolkit checkpoint and history are preserved on the [evidence branch](EVIDENCE.md).
- Toolkit PR #1 now targets a maintained scope: variable/style maintenance, bounded 32-family/383-variant construction, relevant tests and operating documentation.
- Expanded recipes, page patterns, optional reference/supporting commands and detailed historical inventories are excluded from the maintained tree.
- The narrowing checkpoint passed a clean locked install. Current checks use the supported source with reused dependencies. The normal construction aggregate now runs source-contract, behavioural and page-layout tests; historical runtime parity remains separate and fails at the intentional Pages guard. Historical fixtures remain unchanged. See [dated validation](VALIDATION.md).
- Finite Book Card/Editorial CTA and static Tag releases are published with recorded consumer validation. The selected unchanged-source Tag runner and canonical four-page organisation have bounded acceptance; see [release status](RELEASE-STATUS.md).
- Designer-to-code and selected component maintenance runbooks include ownership, recovery and review safeguards. Fresh-agent orientation passed previously; it does not establish human novice native acceptance.

## Remaining acceptance

- Review and merge toolkit PR #1 against its narrowed scope.
- Establish compatibility against current Mangrove main. The supported historical source checkpoint remains required for both export workflows.
- Perform the human designer pilot and one actual designer/developer handoff. New or changed releases still need their affected native, publication and consumer checks; existing finite releases do not establish broader acceptance.
- Complete affected [native release gates](RELEASE-STATUS.md); source/mock checks do not close them.
- Once toolkit documentation lands on main, update the upstream overview's immutable toolkit links to durable main links in a focused follow-up.

GitHub listing endpoints may be suppressed; status uses exact-number PR requests. Actions are unavailable, and Linux execution remains unverified. Local verification is recorded in [validation](VALIDATION.md).
