# UNDRR Mangrove Figma

Source-backed Figma maintenance tooling for [Mangrove](https://github.com/unisdr/undrr-mangrove).

This repository owns the extracted variable/style maintenance implementation from [draft PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319), pinned in [source-lock.json](source-lock.json). It includes the exporter, importer, maintenance interface and focused mock tests. The normal construction entry is now migrated separately from maintenance; its source catalogue contains 32 families and 383 finite variants. The expanded 139-family/2,269-variant recipe source is now extracted and has complete packet parity. Its reviewed preparation/export commands are available; public reference retrieval has passed and the optional 19-test supporting cohort is available. This extraction does not establish new native Figma acceptance or publication.

## Setup

Use Node.js 22.18 or later within the 22 series, or Node.js 24.11 or later. Prepare an installed Mangrove source checkout at supported revision `1639293738232ade132b442ab0fe983dec3d65d5`, recorded separately from initial extraction provenance in `source-lock.json`. That checkout owns its token engine and source dependencies; follow its installation instructions. You can keep it beside this repository.

```sh
npm ci
export MANGROVE_SOURCE_ROOT=/absolute/path/to/undrr-mangrove
npm run build
npm run check
npm test
```

The source path is explicit: this project does not copy or maintain a second set of Mangrove tokens or component styles. Existing source guards report incompatible inputs. The pin records the supported source checkpoint; selecting another revision requires output comparison and review.

## Figma maintenance plugin

After building, import `examples/figma-plugin/maintenance/manifest.json` as a development plugin in the Figma desktop app. Use the generated `examples/figma-plugin/mangrove-maintenance-tokens.json` for variables/styles maintenance. Generated data and runtime bundles are ignored by Git.

The exporter currently produces 520 variables, 102 text definitions and eight effects across five brands. These are source-definition counts, not a claim that every asset has native rendering or publication acceptance. Mock tests verify exporter and importer behaviour; they do not verify native Figma rendering or consumer updates.

See [the maintenance runbook](docs/MAINTENANCE.md) for inspection, saved reports, component ownership and bounded publication/consumer checks.

## Normal kit construction

The optional construction entry prepares the original bounded kit from the same explicit Mangrove source checkout:

```sh
npm run build:kit
npm run check:kit
npm run test:kit
```

Import `examples/figma-plugin/manifest.json` as a development plugin and use generated `examples/figma-plugin/mangrove-variables.json` for this entry. Construction is separate from occasional variable/style maintenance and retains the [native release gates](docs/RELEASE-STATUS.md). The expanded recipe cohort includes page patterns and remains an optional workflow. See [the expanded workflow](docs/EXPANDED-WORKFLOW.md) for explicit preparation/export commands. Public reference delivery has passed. Fresh remote setup at the supported thin-source revision `1639293738232ade132b442ab0fe983dec3d65d5` and toolkit executable checkpoint `e39d58f2e5d87698a6ea4e96d8fe9ad53a09c3a0` passed all six maintenance/normal commands with exact retained outputs. The final expanded export passed independent whole-packet comparison with only the actual source revision changed, and all 19 optional supporting tests passed with unchanged inputs.

See [optional supporting tests](docs/SUPPORTING-TESTS.md) for the separately prepared, finite 19-test cohort.

The normal JSON and runtime match their preserved upstream bytes; this establishes extraction compatibility, not native rendering, edits or publication. Compiler/parser dependencies are installed locally in this toolkit. Mangrove supplies its own token engine, source components, styles and media; the build does not read upstream Figma tooling.

## Ownership and migration

- Mangrove owns components, source tokens, styles and the token engine.
- This repository owns Figma export/import adapters, plugin code and relevant tests.
- Small necessary fixtures can live in Git. Bulk evidence belongs in immutable release assets with checksums and source revisions.

See [local validation](docs/VALIDATION.md), [the migration plan](docs/MIGRATION.md), [current split status](docs/SPLIT-STATUS.md), [evidence index](evidence/index.json) and [upstream parking point](https://github.com/unisdr/undrr-mangrove/blob/a4bb46dafb7134a230e9c79fd26cd7306d2a6203/examples/figma-plugin/holistic/PARKING-POINT-2026-10-07.md). The full upstream spike is preserved as an immutable historical checkpoint; the pushed Mangrove branch now contains the four-path source integration. The agreed destination is this repository for the bulk of that spike and occasional Figma updates, with a much thinner Mangrove PR for links, source contracts and necessary integration. Migration changes are reviewed in a PR against `main`; [current native release gates](docs/RELEASE-STATUS.md) remain separate.

Licensed under Apache-2.0; extracted source retains its upstream provenance.

## Contribution commits

Pull requests merge by squash only. Use a Conventional Commit subject, for example `fix(importer): preserve style identities`. The squash title defaults to the PR title and its message includes the constituent commit messages.

`npm install` / `npm ci` install the checked-in `commit-msg` hook through the `prepare` script. If lifecycle scripts are disabled, run `npm run hooks:install` manually. The hook validates the subject while allowing human and AI attribution lines unchanged, including `Co-authored-by: Claude …`, `Co-authored-by: Codex …`, `AI-Contributed-by: …`, generated-by lines and session references. Attribution is optional and is never inferred or injected. Run `npm run test:hooks` to check this policy.

Local hooks do not run when GitHub creates a squash commit; review the final squash message to retain the desired contribution lines.
