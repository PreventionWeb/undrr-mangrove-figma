# Initial extraction validation

Validated locally on 7 October 2026 with Node.js 24.18.0.

- Clean `npm ci --ignore-scripts` passed using this repository's lockfile and dependencies.
- `npm run build` and `npm run check` passed with explicit `MANGROVE_SOURCE_ROOT`.
- `npm test` passed: complete five-brand alias closure, isolated generation/freshness, source mutation and refusal guards, repeat importer identity, single-brand switching, controller refusal/concurrency and actual interface routing tests.
- The generated maintenance JSON is byte-for-byte identical to the original maintenance implementation at upstream `a4bb46dafb7134a230e9c79fd26cd7306d2a6203` for the same source inputs.
- Canonical asset-record JSON SHA256: `7bc8ab098383dc5ac6c008d46e5a15f1ef440c66cc028d44203fe554f271a04c`.
- Dependency audit reported zero vulnerabilities at the time of validation.

Twenty-eight extracted files retain their exact upstream bytes. Four have source-boundary/test adaptations documented in `docs/MIGRATION.md`; an additional adapter resolves the explicit source checkout. Source tokens and component styles were not copied into tracked files.

The validation source fixture was exported from local Git objects at the exact upstream revision, with the token engine, tokens, stories and original reduced implementation. Its YAML dependency was resolved from this repository's clean install. This verifies extraction compatibility without inheriting the large Mangrove dependency installation. It does not verify a fresh remote source download, the full upstream installation, native Figma rendering, publication or consumer acceptance. No bulk `holistic/assets` evidence was needed.
