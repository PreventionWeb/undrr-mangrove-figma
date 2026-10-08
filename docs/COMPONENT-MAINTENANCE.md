# Occasional component maintenance

Use this procedure to update one existing source-maintained family or develop one new finite family. Mangrove owns the component implementation, tokens, styles and authored media. This repository owns the Figma extraction helpers, recipes and plugin. A Storybook story is a source reference, not an automatic Figma component conversion.

For variables and text/effect styles alone, use [variable/style maintenance](MAINTENANCE.md). For implementing a designer's Figma change in Mangrove, see [design to code](DESIGN-TO-CODE.md). Follow the [README setup](../README.md) and check the applicable [native release gates](RELEASE-STATUS.md) before publishing. Expanded/page experiments are preserved on the evidence branch and are outside this maintained checkout.

## Choose the source and adapter

Record the actual Mangrove and toolkit Git revisions, intended family and variants, brand modes, affected shared styles, and library/consumer checkpoints. Record the exact page containing the existing main set and its expected set/variant node IDs. Set `MANGROVE_SOURCE_ROOT` to the installed Mangrove checkout; do not copy its tokens or styles into this toolkit.

Button is a concrete normal-kit example:

| Responsibility                              | Location                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Component styles in Mangrove                | `stories/Components/Buttons/CtaButton/cta-button.scss`                                                             |
| Source extraction in this toolkit           | `scripts/figma-maintenance-component-assets.cjs`, including its `sources.button` mapping and source-pattern checks |
| Finite variants and anatomy in this toolkit | `scripts/figma-component-recipes.cjs`                                                                              |
| Existing recipe family identity             | `button`, displayed as `Mangrove/Button`                                                                           |
| Story association in this toolkit           | `scripts/figma-planned-inventory.cjs`, `FAMILY_STORIES.button`                                                     |

Change component behaviour and appearance in Mangrove first. Inspect the corresponding toolkit helper and recipe: some changes flow through token/source extraction, while structural changes need an adapter change. A source-pattern refusal means the adapter contract needs review. Do not bypass the refusal or replace the existing family to make the build succeed.

The default maintenance and normal exporters check required source files, token-engine exports and supported source shapes. These checks are not exhaustive Git-revision or byte-pin admission. The supported revision in `source-lock.json` is the reviewed compatibility policy; a different revision requires output comparison and review even if a build passes. The [preserved expanded workflow](EVIDENCE.md) has separate revision/hash admission contracts; its commands are unavailable in this checkout. Do not infer that its admission policy applies to default commands.

## Intentional output changes and test baselines

`npm run test:kit` remains the aggregate seed/extraction check. It starts with the historical whole-packet/runtime hashes and fixed 32-family/383-variant counts, so an intended appearance, runtime or family change can fail that extraction check before behavioural tests run. The historical fixture `examples/figma-plugin/dev/construction-compatibility.json` and its test describe the initial extraction, not a baseline to overwrite for each maintenance change.

Use the explicit routes:

- `npm run test:kit:extraction`: historical extraction parity and isolation/refusal checks. Run against the recorded compatible seed source and toolkit revisions; an intentional packet/runtime difference is not extraction parity.
- `npm run test:kit:behavior`: the existing builder, layout, flow, UI, export and font mock suites without the historical migration hash gate. Assertions still require review when the supported component contract changes; this is not a skip-all-validation route or native acceptance.

For a deliberate source/adapter update, first record the accepted baseline revisions and packet/runtime hashes. Build and freshness-check the candidate, compare the actual selected source/recipe/output differences, and identify unrelated differences or identity changes. Review and extend behavioural fixtures for the intended contract, including refusals and unchanged-family behaviour, then run `test:kit:behavior`. Preserve the historical extraction fixture and receipts unchanged. Add a separately named current compatibility fixture/check if accepting a new supported output baseline; record its source/tool revisions and reviewer decision before updating the supported source policy. Do not claim the candidate passed historical extraction merely because its behavioural checks pass. The existing aggregate command can continue to fail for that candidate; report the intentional extraction difference and maintenance evidence separately.

New normal families also require reviewing the historical test's fixed count assumptions in that separate current-baseline check. A new hash or count is not enough to establish identity compatibility or native acceptance. Native rehearsal and publication gates below still apply to the affected assets.

## Prepare a selected-family rehearsal

Install source dependencies using Mangrove's own instructions and install this toolkit as described in the README. Run these commands in this repository after setting the explicit source path:

```sh
export MANGROVE_SOURCE_ROOT=/absolute/path/to/undrr-mangrove
npm run build:kit
npm run check:kit
npm run test:kit
```

These commands prepare and check the normal catalogue and runtime locally. They do not build all components in a Figma file. For changes to the shared maintenance implementation, also run `npm run build`, `npm run check` and `npm test`, as required by this repository's agent instructions. Keep generated JSON and bundles out of commits.

Preserve a native backup and rehearse in an unpublished copy. Record its original IDs, instance links, properties, text, geometry, bindings and modes for the selected family and affected users. A recovery copy has its own local library keys and does not reconnect existing remote consumers. It is useful for a native rehearsal, not proof of canonical publication or consumer uptake.

1. Open the recorded page containing the existing main component set. Ownership inspection and construction index `figma.currentPage`, not every page in the file. A family absent from this page can appear source-maintained with `setId: null`; that is not permission to recreate it. For an existing-family update, stop if the main is missing, on another page, or does not match the recorded IDs. Locate the original before proceeding.
2. In Figma desktop, import `examples/figma-plugin/manifest.json` as a development plugin. Its name is **Mangrove tokens (exploratory)**. This is the construction entry, distinct from the standalone maintenance manifest.
3. Load the generated `examples/figma-plugin/mangrove-variables.json` in **Import**. Loading JSON does not itself import assets. The construction plugin defaults to UNDRR when several brands are available; verify the intended brand.
4. Ensure the target file already has compatible Mangrove variables and the selected brand mode. The builder refuses missing foundations. If foundations need updating, handle that as a separately reviewed variable/style change using the maintenance procedure. A fresh rehearsal file needs an explicit foundation import before construction.
5. In the component selection, click **Clear**, then select only the intended family. Loading the normal packet preselects core families. Do not use **Use core set** or **Select all** for an occasional selected update.
6. Open **Component maintenance ownership** and choose **Inspect ownership**. Save its result before building. Check both the intended family and its dependencies against the recorded maintenance policy. For each existing family, require a non-null `setId` and matching recorded set/variant IDs on this page. Stop on missing or unexpected IDs; a default source policy alone does not prove that the correct main was found. If dependencies live on other pages, record the unsupported arrangement for review rather than creating replacements here. **Inspect ownership** reports only explicitly checked families, while build preflight expands dependencies. Read the selected recipe's dependency declarations, explicitly check those families for inspection, and save their reports. Then click **Clear** again and reselect only the intended build family before building.
7. Leave **Refresh review sizes, keeping edited content** off for an ordinary rebuild. Choose **Build selected components**, then **Save results**. Inspect errors and partial changes before retrying.

Selection bounds the requested families, not necessarily every affected asset. INSTANCE recipes bring in their family dependency closure. The build refuses a manually maintained family anywhere in that closure before component writes. It also imports required text and effect styles, whose changes can affect other users. Record and validate those shared users. Existing organization can trigger layout-aware checks; a selected build is not a promise that only one set's visible geometry is touched.

## Preserve designer edits and identity

Existing unmarked mains default to source maintenance. Before editing their mains manually, select the family and use **Mark manually maintained** with a recorded reason. This writes ownership metadata, not a snapshot or merge of designer edits. Builds refuse that family and families that require it. Bound appearance can still change through a separate variable/style update.

To hand a family back, reflect the edits in the source/recipe or preserve a backup for a reviewed handback. Check **I have reflected manual changes in the source recipe or saved a backup for a reviewed source handback.**, then choose **Return to source maintenance** and save the result. Handback changes policy only; a later source build is allowed to update the mains. A backup alone does not merge the manual changes into the recipe.

Keep existing family, variant and anatomy IDs stable for an existing component. The runtime uses `mgKitId` ownership identities, while foundations use `mgId` and `mgStyleId`. Shared identities use the `orgundrrmangrove` namespace; conflicting shared/private identities and duplicate ownership are refusals within the inspected scope. Component ownership lookup is page-local; this is not a file-wide duplicate scan. Reusing these markers supports node reuse but is not native evidence that arbitrary main edits or every consumer override survive. Do not delete/recreate a canonical family, change its IDs, or duplicate its ownership markers as a shortcut. Type/topology changes and asset retirement need an explicit migration that preserves existing consumers and keys.

## Add a new family deliberately

A new Storybook story does not add a recipe automatically. For a normal-kit extension:

1. Author and review the Mangrove component, styles, stories and media. Define the finite states and properties this Figma family will represent, plus explicit unsupported behaviour.
2. Add or extend this toolkit's source extraction helper and source-backed recipe. Register the family in `scripts/figma-component-recipes.cjs`. Give it a new stable family identity, stable variant/anatomy IDs and explicit dependencies. Keep an existing family intact when an additive family is needed.
3. Update `scripts/figma-kit-guidance.cjs`. Its registry requires the complete known family set and refuses unknown, duplicate or missing families; adding a recipe alone will not pass normal export. Add purpose, supported scope and limitations without claiming native acceptance.
4. Review the story association and any explicit coverage declarations in `scripts/figma-planned-inventory.cjs`. JSX/TSX source references can be associated automatically in supported cases; SCSS/shared-source families may need a `FAMILY_STORIES` entry. An inventory row or mapped story proves neither a recipe nor native acceptance.
5. Review UI core/default presets and focused compatibility fixtures/tests where relevant. Do not add the family to the core preset just to expose it: loaded recipe families can be selected individually. Review intentional output changes rather than relabelling changed output as preserved extraction parity.
6. For a deliberately new family, choose its target page and confirm that the family has not already been created elsewhere in the file. A null `setId` is expected only for that explicitly new scope, not existing dependencies. Run the normal local checks, then rehearse only the new family and its dependency closure. Record new IDs and verify that unrelated existing family identities and links remain intact.

An expanded-only family requires a separate adapter/admission task. Consult the [evidence checkpoint](EVIDENCE.md) and restore only the reviewed dependency closure in a focused change; its commands are unavailable in this checkout. There is no automatic one-family expanded export command.

## Validate and release the bounded change

Local build, freshness checks and mock tests establish exporter/importer behaviour. They do not establish native rendering, persistence, arbitrary edited-main preservation, publication or consumer acceptance. Historical evidence and unchanged hashes do not accept a newly changed component.

In the native rehearsal, compare the changed source with the actual selected mains and genuine linked instances. Check fonts/glyphs, visual geometry, text and exposed properties, bindings, supported edited content/reflow, relevant brand modes, and affected shared style users. Repeat the bounded build and verify stable existing IDs/links and no unexpected permanent creations. Save full operation reports and relevant native observations/screenshots with source revisions and artifact checksums. Apply the release gates relevant to the changed scope; unrelated expanded/page work is not a prerequisite, and source/mock evidence cannot substitute for applicable native gates.

**Save results** downloads an operation report. Figma saving persists file edits. Neither action publishes the library. The plugin has no publication action.

After the rehearsal and applicable review, perform the bounded canonical-library update with the same reviewed inputs and record its actual keys and links. Publish only the intended changed assets and required dependencies through Figma's publication UI. Clear the broader **Changes** selection each time, because Figma can reselect pending drafts. Accept the update in a genuine linked consumer and verify recorded overrides, properties, text, geometry, modes and links. For a publication rehearsal, restore source values, republish the same bounded assets and verify consumer restoration. A new family must demonstrate genuine consumer linkage after publication; a local recovery-copy instance does not satisfy this check.

## Current Card and Editorial CTA integration

The bounded integration in progress adds eight `horizontal-book-card` variants and updates the existing 23 `editorial-cta` variants in place. The existing `card-horizontal` and text `cta` families stay intact. This is a selected adapter task, not an expansion of the default 32-family exporter.

`scripts/figma-card-cta-integration.cjs` prepares a finite candidate from the exact reviewed corrected source packet. It applies four linked-title width limits derived from the five brand allocations and gives the Book Card inset border its own effect-style identity. The dedicated style avoids changing the canonical `shadow.raised` style and its unrelated users. Existing Editorial CTA recipes, variables and text styles remain unchanged in the packet transform.

Run `npm run test:kit:card-cta` for the focused transform checks. To prepare or check an output, supply the reviewed packet explicitly:

```sh
node scripts/figma-card-cta-integration.cjs reviewed-source-packet.json candidate-output.json
node scripts/figma-card-cta-integration.cjs --check reviewed-source-packet.json candidate-output.json
```

The accepted input SHA256 is `5f677a0d3fdd25427afc1c1037ebf93333982388289242f60e9e3fae16913f1f`; the mapped output SHA256 is `3c15aa849e281ee2e42f73a99c435efad728a0546783ec2c51e0fee17f238de0`. The packet belongs to the preserved Card/CTA evidence workflow. It is not embedded in this checkout. This transform command does not extract new recipes, build components, admit a native update or publish assets. Use the separate selected source profile below to regenerate recipes.

As of 8 October 2026, the four title limits passed finite cloud owning-instance edit and restoration checks and 11 genuine native short/long/short trials in the unpublished Card rehearsal. Independent review accepted 16 actual native PNGs for the finite four-variant UNDRR/MCR and mobile Default five-brand matrix. A separate fresh native reader verified all 215 returned temporary IDs absent and the full recorded rehearsal scene/assets unchanged. Multiline caret centering and fractional allocation remain disclosed seed approximations; this is not full-catalogue pixel equivalence. Canonical-copy integration, repeat-build identity/geometry, scoped canonical publication and genuine consumer uptake remain pending. A fresh native canonical backup and a separate unpublished canonical-copy rehearsal were created; the main kit has not been changed by this integration attempt.

### Regenerate the selected source profile

The maintained `scripts/figma-horizontal-book-recipes.cjs` and `scripts/build-figma-card-cta.cjs` now extract only Horizontal Book Card eight variants and Editorial CTA 23 variants from the supported source checkout. The profile includes their transitive 70 variables, eight text styles and one dedicated effect. It reuses maintained asset helpers and excludes historical full-catalogue metadata and the expanded registry. Seven component/story/style input hashes and the official source image hash guard the finite source contract.

Set `MANGROVE_SOURCE_ROOT` to the installed supported checkout, then run:

```sh
npm run build:kit:card-cta -- --fetch-media --output /tmp/mangrove-card-cta-source.json
npm run build:kit:card-cta -- --check --output /tmp/mangrove-card-cta-source.json
npm run test:kit:card-cta:source
```

The first command downloads the authored UNDRR story image only when its cache is missing and verifies SHA256 `4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370`. Later runs use the checked cache. Set `MANGROVE_CARD_CTA_MEDIA_CACHE` to choose another cache path; a mismatched image is refused, with no substitute. Output is explicit and does not overwrite the normal kit packet or runtime.

The initial selected profile SHA256 is `699346318e4e8c7187a92b38cb9d03faa7caa21f6a45352e5ed3f39dd8a7b6f3`. Its collection, modes, variables, styles and every component recipe field exactly match the reviewed mapped packet above. Its full hash differs because it contains honest selected-profile provenance instead of unrelated historical catalogue metadata. Source/mode/media refusal tests and unchanged default 32-family extraction checks pass.

**This profile exports recipes only.** Its required `source-effect-surface-v1` capability is not present in the default maintained construction runtime. Do not load it into that runtime and infer support. A separately reviewed selected native adapter and the affected release gates are still required. Neither this exporter nor its tests publish library assets. Deliberate source changes require reviewing input guards, output differences and the current native admission baseline.
