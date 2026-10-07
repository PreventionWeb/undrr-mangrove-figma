# Validation checkpoints

Validated locally on 7 October 2026 with Node.js 24.18.0.

- Clean `npm ci --ignore-scripts` passed using this repository's lockfile and dependencies.
- `npm run build` and `npm run check` passed with explicit `MANGROVE_SOURCE_ROOT`.
- `npm test` passed: complete five-brand alias closure, isolated generation/freshness, source mutation and refusal guards, repeat importer identity, single-brand switching, controller refusal/concurrency and actual interface routing tests.
- The generated maintenance JSON is byte-for-byte identical to the original maintenance implementation at upstream `a4bb46dafb7134a230e9c79fd26cd7306d2a6203` for the same source inputs.
- Canonical asset-record JSON SHA256: `7bc8ab098383dc5ac6c008d46e5a15f1ef440c66cc028d44203fe554f271a04c`.
- Dependency audit reported zero vulnerabilities at the time of validation.

Twenty-eight extracted files retain their exact upstream bytes. Four have source-boundary/test adaptations documented in `docs/MIGRATION.md`; an additional adapter resolves the explicit source checkout. Source tokens and component styles were not copied into tracked files.

The validation source fixture was exported from local Git objects at the exact upstream revision, with the token engine, tokens, stories and original reduced implementation. Its YAML dependency was resolved from this repository's clean install. This verifies extraction compatibility without inheriting the large Mangrove dependency installation. It does not verify a fresh remote source download, the full upstream installation, native Figma rendering, publication or consumer acceptance. No bulk `holistic/assets` evidence was needed.

## Dedicated clone compatibility checkpoint

A fresh clone of this repository at `d24d42bed2ae1ea47985b19550b3effd487393b7` and clean `npm ci --ignore-scripts` passed on Node.js 24.18.0. Build, freshness checks and focused tests passed with explicit `MANGROVE_SOURCE_ROOT` pointing to the retained installed upstream checkout at `d5e790d3b0318730fdbd270279f340f35a2833ab`.

The generated maintenance JSON is byte-identical to the retained upstream output: 628,687 bytes; SHA256 `d910794d2864f8085169253e4f3a9629a91432756175f70f17326d4e5f1556bb`. The canonical asset-record hash remains `7bc8ab098383dc5ac6c008d46e5a15f1ef440c66cc028d44203fe554f271a04c`. This additional local compatibility result does not advance the executable source lock, prove a clean remote upstream installation or execute the extracted plugin natively. Construction migration has separate output and test gates.

## Final remote setup

Fresh remote checkouts at source `1639293738232ade132b442ab0fe983dec3d65d5` and toolkit `e39d58f2e5d87698a6ea4e96d8fe9ad53a09c3a0` passed their own locked installs and source CSS generation. All six commands (`build`, `check`, `test`, `build:kit`, `check:kit`, `test:kit`) passed. Independent review verified the actual heads, tracked-clean state, 23 recorded commands and six retained output hashes.

Original and observed raw package files retain the two key-order changes introduced during setup. Duplicate-free typed comparison proved semantic equality before the original bytes were restored. This is not a blanket permission to rewrite package metadata.

The final disabled expanded configuration passed all 1,817 current input guards and current module pins. Explicit reuse of the independently verified public cache was checked afresh across all 1,270 members. No new public download is claimed by this setup.

Final remote expanded packet: **passed independent review**. The 210,368,334-byte packet has SHA256 `da7e0071f07ae553e68bf74c4bbf937a4ebbce6d24f5369e190fe0617255a2a6`; every byte matches the original after replacing only its top-level source revision. Review SHA256: `5253f78e47b82dd3b1d7b50f97be35503a593a3d5f3a5f39ef902a4a173e91f8`.

Final remote supporting cohort: **all 19 passed independent review**. All 1,866 input hashes and identities remained unchanged. Review SHA256: `a64c6ea2cf7a79d3000a479f0f69d47452625f16432d96ff3bd0a8b8c510824c`. The earlier corrected private thin-source packet passed full comparison with only its true source revision changed; the earlier installed 19-test cohort passed independent review.

These results establish source/tool extraction compatibility. Native rendering, fonts, edited reflow, canonical integration, publication and consumer acceptance remain separate. No native operation ran during this verification.

## Occasional-maintenance workflow review, 7 October 2026

Three independent source/runbook audits identified missing manual design-to-code guidance, selected-family operating instructions and an ambiguous recovery-copy/publication sequence. The README now routes by requested task; the two runbooks and request template record ownership, compatibility decisions, comparison inputs and bounded acceptance. An independent implementation review verified source-check boundaries, actual plugin labels, manual dependency refusal, new-family registration and native acceptance limits. A fresh agent then navigated only the new entry points for two scenarios: a designer-led Button change in Mangrove, and a later selected native Button update. It correctly identified the source/helper/family map, manual implementation, exact plugin route, ownership/dependency refusal, canonical versus recovery/consumer files, and relevant evidence. No onboarding blocker was found. The dry-run performed no code or Figma operation and does not establish human novice native handoff acceptance.

The only executable-source change in this pass corrects a stale freshness diagnostic from `yarn build:figma-tokens` to `npm run build:kit`. It does not change generated packets or plugin runtimes. Prior expanded export and remote-install receipts remain historical evidence at their recorded revisions; this pass does not rerun or newly accept the expanded/native cohorts.

All six local maintenance/normal build, freshness and test commands passed after the diagnostic change, including retained normal DTO/runtime pins and the maintenance asset digest. Touched Markdown passed Prettier; local links, copy checks and `git diff --check` passed. No expanded export or native canvas update/publication was performed in this workflow-hardening pass.
