# Designer pilot: PreventionWeb resources

Use the [pilot page](https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=68-432) in the consumer file. It has editable [desktop](https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=68-433) and [phone](https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=68-434) resources compositions on a separate page, with published Book Card, static Tag and Editorial CTA instances. The existing validation stages remain on Page 1.

This pilot checks whether a designer can use the seed kit comfortably. It is a resource listing, not an accepted news template or interactive search/filter implementation. Copy and repeated cover images are illustrative. Card content widths use the published 640 and 390 presets; frame widths also include the bound PreventionWeb padding. Resizing the frame does not switch a card breakpoint.

## Prompt to share

> Please try the Mangrove Figma kit by duplicating the desktop and phone frames on the linked pilot page. Keep instances linked to the library. Edit a card title and its topic Label, replace one cover image, add another resource and try another brand mode. Check whether the controls are easy to find and whether your content fits. Record confusing controls, missing components and layout defects with the exact node link and what you expected. Propose improvements in your copy; use the design-change workflow for anything we should reproduce in Storybook.

Allow about 30 minutes. Start without the plugin: Assets, component properties, image fills and variable modes should be enough. Refer to the [file guide](FIGMA-FILES.md) and [design-to-code handoff](DESIGN-TO-CODE.md) when needed.

## Tasks and observations

| Task                                     | What to record                                                                      | Outcome              |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | -------------------- |
| Find and duplicate the right frame       | Could you distinguish the pilot from masters and historical validation?             | Human review pending |
| Edit short and long Titles and Labels    | Which properties were discoverable; did the content reflow clearly?                 | Human review pending |
| Replace a cover and add a linked card    | Could you find the image fill and preserve component links?                         | Human review pending |
| Change the wrapper to another brand mode | Did you find Apply variable mode and understand explicit modes on children?         | Human review pending |
| Use the desktop and phone presets        | Was the breakpoint distinction understandable?                                      | Human review pending |
| Request one Storybook change             | Can a developer identify the exact component, story, brand and intended difference? | Human review pending |

Pilot children inherit the wrapper's brand mode. Select the desktop or phone wrapper and use Apply variable mode. A bounded PreventionWeb to UNDRR to PreventionWeb trial passed for both wrappers, checking the inherited mode and resolved title colour. The separate historical validation specimens retain their explicit per-case modes.

For each finding record task, node link, expected result, observed result and severity (blocks work, causes confusion, or polish). Separate missing component anatomy from a missing browser behaviour. Keep the pilot report here or in a linked PR comment; do not count an agent walkthrough as a human acceptance result.

## Prepared checkpoint

Prepared 8 October 2026. Both cloud-rendered views were visually inspected after the heading and padding adjustments. All 18 instance links, including nested CTAs, resolved to genuine remote published masters. Native checkpoints `Designer resources pilot prepared 2026-10-08` and `Designer pilot theme inheritance verified 2026-10-08` were saved. Both scope descriptions appeared in Version history; the final pilot also has a checksummed local backup in the handoff folder. Publication of the canonical library was not changed for this pilot.

Human designer usability, independent design approval, browser equivalence, responsive behaviour, broader brands and arbitrary edits remain pending. The existing finite Card/CTA and Tag release receipts retain their original dates and scopes; this page does not expand them.

## Next decisions

Prioritise the smallest change that removes a repeated designer blocker. Fix orientation/property issues before adding new families. Introduce a news-specific card or page anatomy only when the pilot identifies an actual need. In parallel, finish the selected native maintenance runner so occasional supported changes use one reproducible entry and report.
