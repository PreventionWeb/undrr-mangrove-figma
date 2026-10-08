# UNDRR Mangrove Figma

Occasional Figma maintenance tooling for [Mangrove](https://github.com/unisdr/undrr-mangrove). Mangrove owns executable components, tokens, styles and media; this repository owns Figma adapters, plugins and their tests.

The maintained toolkit contains variable/style maintenance and an optional bounded construction entry with 32 families and 383 variants. Expanded recipes and page patterns are preserved separately on the [evidence branch](docs/EVIDENCE.md). Export counts and source/mock checks do not establish native Figma acceptance.

The canonical kit now includes published finite [Book Card/Editorial CTA and static Tag releases](docs/RELEASE-STATUS.md), with genuine consumer validation in their recorded scopes. Their selected source exporters are maintained; the selected native adapters remain evidence tools until the shared native runner is implemented. The default catalogue remains 32 families and 383 variants.

## Start with the requested change

This is a seed kit with occasional maintenance. A designer can change Figma and ask a developer to implement the selected result manually in Mangrove. Code remains the executable source; an approved Figma checkpoint supplies design intent. There is no automatic reverse synchronisation.

| Request                                                 | Start here                                                                                                       | Tooling needed                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Designer changed a component or proposed a new one      | [Design-to-code handoff](docs/DESIGN-TO-CODE.md) and [request template](docs/templates/DESIGN-CHANGE-REQUEST.md) | Implement and review in Mangrove Storybook; no Figma rebuild required                      |
| Update source-backed variables or styles                | [Maintenance runbook](docs/MAINTENANCE.md)                                                                       | `npm run build`, `npm run check`, `npm test`; maintenance plugin                           |
| Bring an existing supported component change into Figma | [Selected component maintenance](docs/COMPONENT-MAINTENANCE.md)                                                  | `npm run build:kit`, `npm run check:kit`, `npm run test:kit`; explicitly selected families |
| Introduce a new Figma family                            | [Adapter extension checklist](docs/COMPONENT-MAINTENANCE.md)                                                     | A finite reviewed recipe and native rehearsal; stories alone do not generate a family      |
| Prepare the selected static Tag source profile          | [Selected Tag profile](docs/COMPONENT-MAINTENANCE.md#selected-tag-source-profile)                                | `npm run build:kit:tag -- --output /tmp/mangrove-tag-source.json`; source preparation only |
| Explore expanded families or page patterns              | [Evidence checkpoint](docs/EVIDENCE.md)                                                                          | Separate experimental branch and its documented setup                                      |

Use [Figma file orientation](docs/FIGMA-FILES.md) to distinguish the canonical kit, consumer, rehearsal and artifacts. New agents should read `AGENTS.md`, this table and the applicable runbook. Record repository revisions, exact nodes/story IDs, scope and ownership in the request template.

## Setup and source compatibility

Use Node.js 22.18 or later within the 22 series, or Node.js 24.11 or later. Prepare an installed Mangrove checkout at supported revision `1639293738232ade132b442ab0fe983dec3d65d5`, recorded in [source-lock.json](source-lock.json). That source checkout owns its dependencies and generated CSS; follow its installation instructions.

```sh
npm ci
export MANGROVE_SOURCE_ROOT=/absolute/path/to/compatible/undrr-mangrove
npm run build
npm run check
npm test
```

[Mangrove PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) merged into main as `5deafc2869a6a293c4019f42703f4f44c24f75ed`. It supplies token-engine exports and the shared Storybook overview. Current main still lacks the control-token foundations required by this toolkit. **Both maintenance and construction require the historical supported checkout above.** Establishing current-main compatibility is an explicit next gate; do not copy missing source styles here or invent defaults to pass a build.

Default commands check required files, token-engine exports and selected source representations, not exhaustive Git revision/hash equality. A different source revision requires reviewed output comparisons and a recorded compatibility decision even when a build passes. Do not bypass guards or replace baseline hashes simply to admit a candidate.

## Variable/style maintenance

After building, import `examples/figma-plugin/maintenance/manifest.json` as a development plugin in Figma desktop. Use generated `examples/figma-plugin/mangrove-maintenance-tokens.json`. Generated packets and bundles are ignored by Git.

The supported seed exporter produces 520 variables, 102 text definitions and eight effects across five brands. Follow the [maintenance runbook](docs/MAINTENANCE.md) for inspection, saved reports, recovery rehearsal and bounded publication/consumer checks.

## Bounded component construction

```sh
npm run build:kit
npm run check:kit
npm run test:kit
```

Import `examples/figma-plugin/manifest.json` and use generated `examples/figma-plugin/mangrove-variables.json`. Select only intended families. Construction and component ownership safeguards are described in [component maintenance](docs/COMPONENT-MAINTENANCE.md). The normal catalogue is 32 families and 383 variants, with original extraction hashes retained.

For intentional future output changes, distinguish `test:kit:extraction` historical parity from `test:kit:behavior` behavioural checks as described in the runbook. Neither replaces relevant native checks.

## Validation and contribution

See [current validation](docs/VALIDATION.md), [acceptance status](docs/SPLIT-STATUS.md), [native release gates](docs/RELEASE-STATUS.md), [ownership/source boundaries](docs/MIGRATION.md) and [historical evidence](docs/EVIDENCE.md). This toolkit is not a claim that every source family is imported, accepted or published in Figma.

Pull requests merge by squash. Use Conventional Commit subjects. `npm ci` installs the checked-in commit-message hook; if lifecycle scripts are disabled, run `npm run hooks:install`. Run `npm run test:hooks` when changing commit policy. Attribution is optional and never inferred or injected; review the actual squash message before merging.

Licensed under Apache-2.0; extracted source retains upstream provenance.
