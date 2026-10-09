/** Finite selected-profile transform. This does not export recipes from Mangrove or admit a native build. */
"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
const SOURCE_SHA =
  "5f677a0d3fdd25427afc1c1037ebf93333982388289242f60e9e3fae16913f1f";
const EFFECT_ID = "component.horizontal-book-card.inner-border";
const EFFECT_NAME = "Mangrove/component/horizontal-book-card/inner-border";
const FAMILY_IDS = ["horizontal-book-card", "editorial-cta"];
function mapCardCtaIntegrationDocument(input) {
  const doc = structuredClone(input);
  if (
    doc.components?.version !== 1 ||
    doc.components.families.length !== 2 ||
    doc.components.families.some((f) => !FAMILY_IDS.includes(f.id))
  )
    throw Error("Unexpected source families");
  if (
    doc.components.families.find((f) => f.id === "horizontal-book-card")
      ?.variants.length !== 8 ||
    doc.components.families.find((f) => f.id === "editorial-cta")?.variants
      .length !== 23
  )
    throw Error("Expected exact eight Book Card and 23 Editorial CTA variants");
  if (doc.modes?.length !== 5 || new Set(doc.modes.map((m) => m.id)).size !== 5)
    throw Error("Expected five distinct source modes");
  const effect = doc.styles.effect;
  if (effect.length !== 1 || effect[0].id !== "shadow.raised")
    throw Error("Unexpected source effect");
  effect[0].id = EFFECT_ID;
  effect[0].name = EFFECT_NAME;
  effect[0].description =
    "Book Card source inset border. Dedicated component style preserves canonical shadow.raised unchanged.";
  let remapped = 0;
  function walk(tree) {
    if (tree.effectStyle === "shadow.raised") {
      tree.effectStyle = EFFECT_ID;
      remapped++;
    }
    if (tree.effectSurface?.sourceEffectStyle === "shadow.raised") {
      tree.effectSurface.sourceEffectStyle = EFFECT_ID;
      remapped++;
    }
    for (const child of tree.children || []) walk(child);
  }
  for (const f of doc.components.families)
    for (const v of f.variants) walk(v.tree);
  if (remapped !== 16)
    throw Error("Expected exactly eight root and eight surface references");
  const variablesByName = new Map(doc.variables.map((v) => [v.name, v]));
  function number(value, mode, seen = new Set()) {
    if (typeof value === "number") return value;
    if (typeof value !== "string" || seen.has(value))
      throw Error("Invalid or cyclic source dimension");
    seen.add(value);
    const variable = variablesByName.get(value);
    if (!variable || variable.type !== "FLOAT")
      throw Error("Missing FLOAT dimension " + value);
    const v = variable.values[mode];
    return number(v && typeof v === "object" ? v.alias : v, mode, seen);
  }
  const titleConstraints = [];
  for (const variant of doc.components.families.find(
    (f) => f.id === "horizontal-book-card",
  ).variants) {
    const root = variant.tree,
      content = root.children.find((c) => c.id === "content"),
      box = content.children.find((c) => c.id === "title-box"),
      title = box.children.find((c) => c.id === "title"),
      caret = box.children.find((c) => c.id === "caret-slot");
    if (!caret) {
      if (title.layout.width !== "FILL")
        throw Error("Unexpected unlinked title layout");
      continue;
    }
    if (title.layout.maxWidth !== undefined)
      throw Error(
        "Source linked title already constrained; review a new mapping",
      );
    if (
      title.layout.width !== "HUG" ||
      title.layout.height !== "HUG" ||
      box.layout.mode !== "HORIZONTAL"
    )
      throw Error("Unexpected linked title structure");
    const widths = doc.modes.map((mode) => {
      let available =
        number(root.layout.width, mode.id) -
        number(root.bindings.paddingLeft, mode.id) -
        number(root.bindings.paddingRight, mode.id);
      if (root.layout.mode === "HORIZONTAL") {
        const peers = root.children.filter((c) => c !== content);
        for (const peer of peers)
          available -= number(peer.layout.width, mode.id);
        available -= number(root.layout.gap, mode.id) * peers.length;
      }
      available -=
        number(caret.layout.width, mode.id) + number(box.layout.gap, mode.id);
      return Number(available.toFixed(4));
    });
    if (widths.some((v) => !Number.isFinite(v) || v <= 0 || v !== widths[0]))
      throw Error("Finite title allocation varies across brands");
    title.layout.maxWidth = widths[0];
    titleConstraints.push({
      variantId: variant.id,
      maxWidth: widths[0],
      modeWidths: widths,
      preserve: "HUG/HUG and all source styles/characters/caret geometry",
    });
  }
  if (titleConstraints.length !== 4)
    throw Error("Expected exactly four linked title constraints");
  return {
    doc,
    mapping: {
      sourceSHA256: SOURCE_SHA,
      effect: {
        from: "shadow.raised",
        to: EFFECT_ID,
        name: EFFECT_NAME,
        remappedReferences: remapped,
      },
      titleConstraints,
      titleProbe: {
        sha256:
          "daab7a4b1b4776da365a225af52f6bf3eb5ffd5fd7b0e45762e9e1cae28e9b7d",
        sourceMultilineCaretAcceptance: false,
        fractionalGeometryAcceptance: false,
      },
      familyMode: "add-book-card-update-editorial-cta-in-place",
      preservedCanonicalFamilyIds: ["card-horizontal", "cta"],
      candidateOnly: true,
      nativeExecutionReady: false,
    },
  };
}
const CANDIDATE_SHA =
  "3c15aa849e281ee2e42f73a99c435efad728a0546783ec2c51e0fee17f238de0";
function packetSHA(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
function prepareCardCtaIntegration(raw) {
  if (typeof raw !== "string" || packetSHA(raw) !== SOURCE_SHA)
    throw Error("Exact reviewed corrected source packet hash differs");
  const mapped = mapCardCtaIntegrationDocument(JSON.parse(raw));
  const output = JSON.stringify(mapped.doc, null, 2) + "\n";
  if (packetSHA(output) !== CANDIDATE_SHA)
    throw Error("Mapped candidate differs from reviewed output");
  return {
    ...mapped,
    output,
    sourceSHA256: SOURCE_SHA,
    candidateSHA256: CANDIDATE_SHA,
  };
}
if (require.main === module) {
  const args = process.argv.slice(2),
    check = args[0] === "--check";
  if (check) args.shift();
  const [sourcePath, destinationPath] = args;
  if (!sourcePath || !destinationPath || args.length !== 2)
    throw Error(
      "Usage: node scripts/figma-card-cta-integration.cjs [--check] reviewed-source-packet.json candidate-output.json",
    );
  if (
    require("node:path").resolve(sourcePath) ===
    require("node:path").resolve(destinationPath)
  )
    throw Error("Source packet must not be overwritten");
  const prepared = prepareCardCtaIntegration(
    fs.readFileSync(sourcePath, "utf8"),
  );
  if (check) {
    if (fs.readFileSync(destinationPath, "utf8") !== prepared.output)
      throw Error("Candidate output is stale");
    console.log(
      "Reviewed finite Card CTA transform output matches. No native acceptance.",
    );
  } else {
    fs.writeFileSync(destinationPath, prepared.output);
    console.log(
      "Wrote reviewed finite Card CTA candidate. This is a packet transform, not a source exporter or native integration.",
    );
  }
}
module.exports = {
  mapCardCtaIntegrationDocument,
  prepareCardCtaIntegration,
  packetSHA,
  SOURCE_SHA,
  CANDIDATE_SHA,
  EFFECT_ID,
  FAMILY_IDS,
};
