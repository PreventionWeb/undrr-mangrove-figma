# Occasional variable and style maintenance

This repository owns Figma maintenance. Mangrove owns the source token engine, token definitions, component code, styles and authored media. Component construction uses a separate entry point. Check [release status](RELEASE-STATUS.md) before treating a native operation as accepted.

## Prepare the source and plugin

Use the Node version described in the repository README. Install this toolkit with `npm ci`. Prepare the compatible Mangrove source checkout and its own dependencies, then set `MANGROVE_SOURCE_ROOT` to its absolute path. Keep generated source inputs in that checkout. The source revision and compatibility boundary are recorded in `source-lock.json`.

```sh
npm run build
npm run check
npm test
```

Import `examples/figma-plugin/maintenance/manifest.json` as a development plugin in Figma desktop. Build output is ignored by Git. The generated `examples/figma-plugin/mangrove-maintenance-tokens.json` contains 520 variable definitions, 102 text definitions and eight effects across five brands. These counts describe source definitions, not published or natively accepted assets.

## Inspect and update

1. Preserve a native backup and record the source/library and consumer checkpoint. Use an unpublished recovery copy for a rehearsal. Its new local library keys do not reconnect existing consumers; leave it unpublished.
2. Run **Mangrove maintenance (exploratory)**. Choose **Use bundled source** or load the reviewed generated JSON. Paste is available when the file picker fails. Loading data and inspecting it do not import assets.
3. Inspect the installed collection and styles. Existing text styles are selected; a new file starts with nine core type roles. Choose extra roles deliberately. Select all five brands in a five-mode library, or one brand in a one-mode file.
4. Choose **Update variables and styles** and **Save report**. Review errors, missing fonts, created/reused IDs and retained stale variables. If an import reports partial changes, inspect the actual file before retrying.
5. Finish the unpublished recovery-copy rehearsal without publication or consumer reconnection. A separate reviewed canonical-library operation is required for release. Compare the canonical source and an edited genuine linked consumer. Record geometry, text, properties, modes, instance links and published keys. Publish only the assets covered by the reviewed change. Figma can reselect pending drafts, so clear the broader **Changes** selection and select the intended assets on every publication.
6. Accept the update in the consumer and verify the recorded fields. For a rehearsal, restore the source values, publish the same bounded assets and verify the consumer restoration. Save the reports and complete operation evidence.

The importer retains source identities and never prunes. Renames follow source IDs; removals need an explicit migration because consumers may still use the assets. Fonts load before text style changes. Styles materialise non-bound properties from the first selected brand, with variable bindings for supported font family and size. Existing source guards preserve the supported representation limits.

## Component ownership

For a designer-led Storybook change, use [design-to-code handoff](DESIGN-TO-CODE.md). For a bounded source-to-Figma rebuild or new family, use [selected component maintenance](COMPONENT-MAINTENANCE.md). A token/style update does not require either construction workflow.

The standalone maintenance plugin has no component builder, layout migration or publication action. Bound component appearance can still change when variables/styles update.

The optional normal construction plugin has **Component maintenance ownership**. A family can stay source-maintained or be marked manually maintained with a recorded reason. The selected dependency closure refuses incompatible manual families. Returning a family to source maintenance changes its policy and permits a later rebuild; preserve or reflect manual edits before handback. Consumer overrides do not demonstrate preservation of arbitrary main-component edits.

## Verification boundaries

The maintenance build, freshness and focused tests verify local exporter/importer behaviour. Historical upstream Button and token-publication rehearsals remain scoped evidence. They do not establish native acceptance of this extracted build, changed text/effect publication, composite propagation, expanded components, page assembly or novice handoff. Use [release status](RELEASE-STATUS.md) for those gates and [split status](SPLIT-STATUS.md) for repository migration.

The historical maintenance procedure and native receipts remain available at the [preserved upstream checkpoint](https://github.com/unisdr/undrr-mangrove/blob/d5e790d3b0318730fdbd270279f340f35a2833ab/examples/figma-plugin/MAINTENANCE.md). Current setup uses this repository's npm commands, not the old spike's Figma build scripts.
