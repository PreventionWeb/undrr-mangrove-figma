# Selected release register

[The versioned register](../releases/selected-releases.json) records dated, reviewed finite releases for static Tag, Horizontal Book Card and Editorial CTA. It gives designers direct master and genuine consumer links, canonical set/member IDs and keys, accepted scope, remaining limits and publication/consumer evidence pins. Read it alongside [release gates](RELEASE-STATUS.md) and [component maintenance](COMPONENT-MAINTENANCE.md).

These are observations made on the recorded date, not a live inventory of published Figma assets. A later file edit, source update or publication does not update this register automatically. The dated catalogue counts are source-entry observations and are not computed from the three selected records. Editorial CTA is separate from Text CTA; the existing Components/CTA grid entry describes Text CTA.

## Reviewable documentation notes

From the toolkit root:

```sh
node scripts/release-register.test.cjs
node scripts/build-release-notes.cjs > /tmp/mangrove-selected-release-notes.md
node scripts/build-release-notes.cjs --catalogue-plan > /tmp/mangrove-selected-release-catalogue-plan.json
```

The first output is a human-readable status overview. The optional JSON output proposes text notes only for the reviewed Tag and Horizontal Book Card catalogue cells and the Editorial CTA introduction. It validates the recorded canonical family keys and exact known TEXT IDs and refuses unknown or mismatched rows. It does not open Figma, write nodes or update documentation files. Inspect actual target types, text and ownership before applying a plan. Historical IDs and an archived approval are not sufficient authority to mutate a changed file.

Both commands use the same release metadata. Neither changes the normal 32-family/383-variant registry, generated source packet, native runtime, component masters, variables, styles or publication. Missing, partial, unsupported and unverified states remain explicit in the overview. The catalogue plan leaves those records unpatched rather than presenting them as published. Only `published-finite` records with all five accepted gates, reviewed native publication provenance and reviewed genuine remote consumer provenance can propose published notes. Hash validation checks metadata shape; it does not independently prove that an external report passed.

## Refresh ownership and evidence

The owner of a bounded release updates the register in the same reviewed change as the release documentation. Keep one consolidated acceptance report for that release. Record the actual date, supported source revision/profile checksum, exact canonical set/member identities, scope and limits, publication receipt and genuine consumer report. Receipts and full native reports remain in the durable evidence package rather than Git. Keep artifact names and checksums sufficient to locate them through the release documentation.

A source export or mock pass may establish source preparation only. Do not advance rehearsal, canonical, publication or consumer gates from those results. A failed or partial native operation stays failed or partial even when a later separately reviewed completion succeeds. Publication requires actual bounded publication evidence; a source packet or the presence of a local component is not publication proof. Genuine consumer evidence must confirm remote main keys and relevant edited-property, mode and preservation behavior.

For a future accepted family or moved catalogue cell, add its reviewed exact association to the generator's small target map and refusal tests. Do not guess a similarly named row or broaden the map to every source entry. Keep interaction, arbitrary edits, changed-style propagation and other untested cases in the limits. A future native runner may consume this register to prepare documentation notes after its own checks, but this register never grants native execution or publication admission.
