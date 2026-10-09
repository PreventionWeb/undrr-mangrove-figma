#!/usr/bin/env node
/** Finite document-transform checks. No native renderer or source-export claim. */
"use strict";
const assert = require("node:assert/strict");
const {
  mapCardCtaIntegrationDocument,
  prepareCardCtaIntegration,
  EFFECT_ID,
} = require("../../../scripts/figma-card-cta-integration.cjs");
const modes = ["undrr", "delta", "irp", "mcr", "preventionweb"];
function document() {
  const values = (value) =>
    Object.fromEntries(modes.map((mode) => [mode, value]));
  const dimension = (name, value) => ({
    id: name,
    name,
    type: "FLOAT",
    values: values(value),
  });
  const families = ["default", "noimage", "nolink", "buttononly"].flatMap(
    (preset) =>
      [640, 390].map((width) => {
        const linked = ["default", "noimage"].includes(preset);
        const title = {
          type: "TEXT",
          id: "title",
          characters: "Title in large size",
          textProperty: "Title",
          layout: { width: linked ? "HUG" : "FILL", height: "HUG" },
        };
        const box = {
          type: "FRAME",
          id: "title-box",
          layout: {
            mode: "HORIZONTAL",
            width: "FILL",
            height: "HUG",
            gap: "spacing/0",
          },
          children: [
            title,
            ...(linked
              ? [
                  {
                    type: "FRAME",
                    id: "caret-slot",
                    layout: { width: "caret/slot" },
                  },
                ]
              : []),
          ],
        };
        const content = {
          type: "FRAME",
          id: "content",
          layout: { width: "FILL" },
          children: [box],
        };
        const hasImage = preset !== "noimage";
        return {
          id: `horizontal-book-card.${preset}.${width}`,
          tree: {
            type: "FRAME",
            effectStyle: "shadow.raised",
            effectSurface: { sourceEffectStyle: "shadow.raised" },
            layout: {
              mode: width === 640 ? "HORIZONTAL" : "VERTICAL",
              width,
              gap: "spacing/100",
            },
            bindings: {
              paddingLeft: "card/padding",
              paddingRight: "card/padding",
            },
            children: [
              ...(hasImage
                ? [{ id: "visual", layout: { width: "cover/width" } }]
                : []),
              content,
            ],
          },
        };
      }),
  );
  return {
    modes: modes.map((id) => ({ id })),
    variables: [
      dimension("spacing/0", 0),
      dimension("spacing/100", 10),
      dimension("spacing/150", 15),
      dimension("card/padding", { alias: "spacing/150" }),
      dimension("cover/width", 160),
      dimension("caret/slot", 13.8),
    ],
    styles: {
      text: [
        {
          id: "unchanged",
          values: values({ fontName: { family: "Roboto", style: "Bold" } }),
        },
      ],
      effect: [
        {
          id: "shadow.raised",
          name: "Mangrove/shadow/raised",
          description: "Original shared effect",
          values: values([{ effect: { spread: 1 } }]),
        },
      ],
    },
    components: {
      version: 1,
      families: [
        { id: "horizontal-book-card", variants: families },
        {
          id: "editorial-cta",
          variants: Array.from({ length: 23 }, (_, i) => ({
            id: `editorial-cta.${i}`,
            tree: { characters: "Original CTA", textProperty: "Label" },
          })),
        },
      ],
    },
  };
}
const original = document(),
  saved = structuredClone(original);
const { doc, mapping } = mapCardCtaIntegrationDocument(original);
assert.deepEqual(original, saved, "Mapping must not mutate its input");
assert.deepEqual(doc.variables, original.variables);
assert.deepEqual(doc.styles.text, original.styles.text);
assert.deepEqual(doc.styles.effect[0].values, original.styles.effect[0].values);
assert.deepEqual(
  doc.components.families[1],
  original.components.families[1],
  "All 23 existing CTA recipes stay unchanged",
);
assert.equal(doc.styles.effect[0].id, EFFECT_ID);
assert.equal(mapping.effect.remappedReferences, 16);
assert.equal(mapping.nativeExecutionReady, false);
assert.deepEqual(
  mapping.titleConstraints.map((row) => [row.variantId, row.maxWidth]).sort(),
  [
    ["horizontal-book-card.default.390", 346.2],
    ["horizontal-book-card.default.640", 426.2],
    ["horizontal-book-card.noimage.390", 346.2],
    ["horizontal-book-card.noimage.640", 596.2],
  ].sort(),
);
for (const variant of doc.components.families[0].variants) {
  const old = original.components.families[0].variants.find(
    (v) => v.id === variant.id,
  );
  const title = variant.tree.children.find((c) => c.id === "content")
    .children[0].children[0];
  const oldTitle = old.tree.children.find((c) => c.id === "content").children[0]
    .children[0];
  const copy = structuredClone(title);
  if (title.layout.width === "HUG") {
    assert(
      title.layout.maxWidth > 160 && title.layout.maxWidth < 874,
      "Observed short title fits and overflowing long title exceeds finite cap",
    );
    delete copy.layout.maxWidth;
  } else assert.equal(title.layout.maxWidth, undefined);
  assert.deepEqual(
    copy,
    oldTitle,
    "Only maxWidth may change on each linked title",
  );
}
for (const alter of [
  (d) => d.components.families[1].variants.pop(),
  (d) => (d.styles.effect[0].id = "unrelated.effect"),
  (d) => (d.variables.find((v) => v.name === "card/padding").values.mcr = 20),
  (d) =>
    (d.variables.find((v) => v.name === "card/padding").values.undrr = {
      alias: "card/padding",
    }),
  (d) => (d.modes[1].id = d.modes[0].id),
]) {
  const invalid = structuredClone(original);
  alter(invalid);
  assert.throws(() => mapCardCtaIntegrationDocument(invalid));
}
assert.throws(
  () => mapCardCtaIntegrationDocument(doc),
  /already constrained|Unexpected source effect/,
);
assert.throws(
  () => prepareCardCtaIntegration(JSON.stringify(original)),
  /packet hash differs/,
);
console.log(
  "ok finite Card CTA transform: four all-brand allocation caps, unchanged CTA23/variables/text/effect values, dedicated effect identity, preserved short-title contract and malformed/drift refusal. No native acceptance.",
);
