# Designer changes to Mangrove Storybook

Use this runbook when a designer changes selected Figma components or screens and asks a developer or coding agent to reproduce those changes in Mangrove. The normal handoff is a bounded, manual code change, sometimes including a new component. Full kit reconstruction is uncommon and is not a prerequisite.

Start with the [design change request template](templates/DESIGN-CHANGE-REQUEST.md), or the [small handoff example](DESIGN-HANDOFF-EXAMPLE.md) for a proportionate record. Keep the request, comparison decisions and completion record in the issue or PR so another contributor can continue without reconstructing the conversation.

## Authority and ownership

The approved Figma selection describes the requested design intent. It does not automatically replace every existing component, state, theme or behaviour. Mangrove owns the implementation, token definitions, styles and authored media that Storybook and consumers use. Implement the accepted change there rather than editing generated CSS or creating another editable token set in this toolkit.

This repository owns Figma adapters, plugins, recipe translation and their tests. There is no automatic reverse sync from designer edits into Mangrove. A Figma screenshot is not an executable specification for semantics, keyboard interaction, responsiveness or all component states. Resolve those details against the existing component contract and record decisions when the request changes that contract.

Use these current upstream guides:

- [AI coding agent guidelines](https://github.com/unisdr/undrr-mangrove/blob/main/docs/AI-CODING-AGENTS.md): cross-file impact, manifests, Storybook and browser verification.
- [Review checklist](https://github.com/unisdr/undrr-mangrove/blob/main/docs/REVIEW-CHECKLIST.md): component, accessibility, token, evidence and compatibility requirements.
- [Component guide](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COMPONENT-GUIDE.md): new-component files and distribution registration.
- [Testing guide](https://github.com/unisdr/undrr-mangrove/blob/main/docs/TESTING.md): relevant test and visual-check procedures.

Read the target Mangrove checkout's agent instructions before editing. If older component-guide advice conflicts with the current review checklist or AI guidelines, use the current checklist and guidelines. In particular, global stacking uses runtime `--mg-z-index-*` properties, and added or changed component markup/classes require the relevant AI manifest updates. Do not treat the component guide's older Sass z-index examples or its “optional” manifest heading as an exemption.

## 1. Bound the request

Record exact Figma file and node links, the approved checkpoint/date and the designer responsible for the intended change. Name the selected components, variants and states. Include before/after references and the intended difference, not just a link to a large file.

Specify affected brands/modes, viewport or container sizes, copy, assets, fonts and responsive behaviour. Say whether this changes an existing component or introduces one. Identify what is outside the request, such as unrelated screens, library publication or a whole-kit rebuild.

If intent or required input is missing, identify the specific gap before implementing the dependent part. Continue independent investigation of the existing component and its stories. Do not infer that every visible difference in the Figma file is approved work.

## 2. Locate and capture the baseline

Record the Mangrove checkout and Git revision, current Storybook links or story IDs, and the relevant JSX, SCSS, token and MDX files. Search for an existing component or composition before introducing a new public component. Check its props, documented behaviour, themes and consumer constraints.

Capture the current browser result before editing. Match the requested copy, asset, viewport/container, theme, locale and interaction state. A page composition and a reusable component may need different changes; state which owns the problem.

Record toolkit revision and `source-lock.json` compatibility only if recipes, export or plugin behaviour are part of the work. A manual Mangrove change does not require installing or running this toolkit.

## 3. Triage differences

Create a short table in the request or PR:

| Item                  | Approved Figma target | Current browser result | Decision and owner                                    | Acceptance evidence            |
| --------------------- | --------------------- | ---------------------- | ----------------------------------------------------- | ------------------------------ |
| Named component/state | Requested difference  | Observed baseline      | Implement, align inputs, document constraint or defer | Story and comparison to review |

Use these decisions consistently:

| Difference                                                                    | Next step                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Approved design change                                                        | Implement in Mangrove and review the selected stories.                                                              |
| Unmatched copy, asset, font, viewport, theme or state                         | Align comparison inputs before deciding whether there is an implementation defect.                                  |
| Semantics, accessibility, reflow or a browser/Figma representation constraint | Record the constraint and agree the intended behaviour; do not silently remove existing support to match one image. |
| Toolkit recipe differs from accepted source behaviour                         | Record a toolkit-owned recipe follow-up or include a separately reviewed recipe change.                             |
| Unknown intent or unrelated drift                                             | Ask for the missing decision or record separate work; keep the implementation bounded.                              |

For shared tokens or defaults, explain why the change belongs at that scope and identify other components or brands it can affect. A Figma value may map to an existing token; a screenshot alone does not justify a new global value.

## 4. Implement in Mangrove

Make the selected JSX, SCSS, token and story changes in the Mangrove repository. Reuse existing props, components and tokens where they express the requested result. Preserve documented behaviour and consumer compatibility unless the request explicitly changes them and the reviewer accepts the migration impact.

Read the upstream review checklist before committing component changes. Update the component MDX changelog and affected examples/manifests in the same change. For a new component, use the component guide for file layout and register the intended distribution channels; an export in `src/index.js` alone does not publish an npm/CDN component. Add Drupal hydration only when that integration is required.

Keep the code PR focused on the selected design change. Toolkit recipes and compatibility records belong here, not as a restored bulk Figma spike in Mangrove. The [migration boundary](MIGRATION.md) keeps the upstream integration thin.

## 5. Decide recipe and Figma maintenance impact

Every handoff records one recipe disposition:

- **No recipe change needed:** identify why the change is outside the exported family, is already represented, or does not change its supported contract.
- **Toolkit follow-up required:** name the affected family and recipe/asset helpers, describe the discrepancy and link the follow-up. The code handoff may be accepted separately if that limitation is explicit.
- **Toolkit change included:** review the affected recipe, source reads, guards and compatibility evidence separately from the Mangrove browser result.

Do not report a source guard failure as permission to overwrite a pin. If the accepted Mangrove change makes the toolkit's supported source revision incompatible, record that fact and review the new source boundary and output differences before updating compatibility records. Source packet parity does not prove that the resulting native Figma component is accepted.

If a main Figma component has manual edits, record its maintenance ownership and any future rebuild risk. Preserve or reflect those edits before handing it back to source maintenance. See [component maintenance](COMPONENT-MAINTENANCE.md) and the existing [maintenance ownership guidance](MAINTENANCE.md#component-ownership).

Choose an optional toolkit workflow only when separately needed:

- [Variable/style maintenance](MAINTENANCE.md) for source-backed foundation updates.
- [Normal kit construction](../README.md#normal-kit-construction) for the bounded construction entry.
- [Expanded recipe export](EXPANDED-WORKFLOW.md) for its separately admitted source/reference cohort.

None of these exports designer edits back into Mangrove. Figma rebuilding or publication is not an implicit part of a manual Storybook request.

## 6. Verify the bounded result

Use the target Mangrove checkout's setup and testing instructions. Run checks appropriate to the implementation and complete its required review checks. Verify the changed stories in a real browser, particularly for SCSS changes: jsdom tests do not load external styles and cannot establish the visual result.

Keep before/after comparisons at matching inputs. Include representative viewport sizes and the changed interaction/validation states. Check affected brands, keyboard/touch interaction, zoom/reflow, RTL, text expansion, forced colours and reduced motion where applicable. Record checks that do not apply and why, rather than claiming the whole catalogue was validated.

Retain reviewable evidence with the code revision, story ID/URL, theme/mode, locale, viewport/container, copy/assets, state and capture method. Store bulk captures outside Git and link them from the request or PR. Keep small necessary fixtures distinct from review evidence. Record unresolved visual differences rather than treating green tests as designer approval.

If the work also modifies toolkit implementation, follow its applicable build/check/test instructions and compatibility requirements. [Release status](RELEASE-STATUS.md) remains the boundary for native rendering, fonts, edited reflow, publication and consumer acceptance. A successful build, mock test or packet export does not satisfy those separate gates.

## 7. Complete the handoff

Provide the code PR, changed Storybook links, comparison evidence, checks performed, accepted discrepancy decisions and recipe disposition. Name any remaining follow-ups and their owners.

The designer reviews the selected visual result and agreed differences. The code reviewer reviews implementation, behaviour, accessibility and compatibility. Record those outcomes in the request or PR. Mark the bounded code handoff complete only when its agreed acceptance criteria are met or its remaining differences are explicitly accepted.

If Figma construction, publication or consumer uptake was separately requested, report its outcome separately under the applicable toolkit workflow. Code acceptance does not establish native library acceptance, and a library update does not establish code acceptance.
