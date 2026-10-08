#!/usr/bin/env node
/** Selected source profile. Separate from historical32 export and native execution. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { getMangroveRoot } = require("./mangrove-source.cjs");
const {
  buildHorizontalBookRecipes,
  SOURCE_HASHES,
} = require("./figma-horizontal-book-recipes.cjs");
const {
  mapCardCtaIntegrationDocument,
} = require("./figma-card-cta-integration.cjs");
const MEDIA_URL =
  "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg";
const MEDIA_SHA =
  "4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370";
function verifyCover(bytes) {
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== MEDIA_SHA)
    throw Error(
      "Official source cover hash differs; no fallback media accepted",
    );
  return bytes;
}
async function loadCover(cache, fetchMedia = false) {
  if (fs.existsSync(cache)) return verifyCover(fs.readFileSync(cache));
  if (!fetchMedia)
    throw Error(
      "Missing hash-checked source cover cache. Run with --fetch-media or set MANGROVE_CARD_CTA_MEDIA_CACHE.",
    );
  const response = await fetch(MEDIA_URL, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw Error("Official source cover fetch failed " + response.status);
  const bytes = verifyCover(Buffer.from(await response.arrayBuffer()));
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, bytes);
  return bytes;
}
function projectClosure(doc) {
  const varsByName = new Map(doc.variables.map((v) => [v.name, v])),
    wanted = new Set();
  function visit(value) {
    if (typeof value === "string" && varsByName.has(value)) {
      if (wanted.has(value)) return;
      wanted.add(value);
      visit(varsByName.get(value).values);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  }
  visit(doc.components);
  visit(doc.styles);
  return { ...doc, variables: doc.variables.filter((v) => wanted.has(v.name)) };
}
function buildCardCtaDocument({ root = getMangroveRoot(), cover }) {
  if (path.resolve(root) !== getMangroveRoot())
    throw Error("Selected profile root must match configured Mangrove source");
  verifyCover(cover);
  const foundations =
    require("./figma-maintenance-foundations.cjs").buildFigmaFoundations();
  const { collection, modes, variables, styles } = foundations;
  require("./figma-maintenance-component-assets.cjs").buildComponentAssets({
    root,
    modes,
    variables,
    styles,
  });
  require("./figma-maintenance-card-hero-assets.cjs").buildCardHeroAssets({
    root,
    modes,
    variables,
    styles,
  });
  const [cta] =
    require("./figma-editorial-cta-recipes.cjs").buildEditorialCtaRecipes({
      root,
      modes,
      variables,
      styles,
    });
  for (const variant of cta.variants) {
    function assign(n, parent) {
      n.id = parent ? parent + "/" + n.name : n.name;
      for (const child of n.children || []) assign(child, n.id);
    }
    assign(variant.tree, null);
  }
  const card = buildHorizontalBookRecipes({
    root,
    modes,
    variables,
    styles,
    cover,
  });
  const selectedIds = new Set([
    "component.card-content.title",
    "component.card-content.title-link",
    "component.card-content.body",
    "component.card-content.label",
    "component.editorial-cta.label",
    "component.editorial-cta.label-hover",
    "component.editorial-cta.label-focus",
    "component.editorial-cta.badge",
  ]);
  const raw = projectClosure({
    collection,
    modes,
    variables,
    styles: {
      text: styles.text.filter((s) => selectedIds.has(s.id)),
      effect: styles.effect.filter((s) => s.id === "shadow.raised"),
    },
    components: { version: 1, families: [card, cta] },
  });
  const mapped = mapCardCtaIntegrationDocument(raw).doc;
  return {
    ...mapped,
    $comment:
      "GENERATED finite source Card and Editorial CTA profile. Native execution, edited content, and publication require separate acceptance.",
    profile: {
      id: "card-cta-source-v1",
      reviewedSourceRevision: "1639293738232ade132b442ab0fe983dec3d65d5",
      sourceHashes: SOURCE_HASHES,
      media: { url: MEDIA_URL, sha256: MEDIA_SHA },
      historicalCatalogueMetadataIncluded: false,
      requiredRuntimeCapability: "source-effect-surface-v1",
      defaultKitRuntimeAdmission: false,
      nativeExecutionAccepted: false,
    },
  };
}
async function main(args) {
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 ? args[outputIndex + 1] : null;
  if (!output && !args.includes("--stdout"))
    throw Error(
      "Use --output path or --stdout. This does not alter normal kit artifacts.",
    );
  const cache =
    process.env.MANGROVE_CARD_CTA_MEDIA_CACHE ||
    path.resolve(
      __dirname,
      "../.cache/figma-card-cta/bali-publication-cover.jpg",
    );
  const cover = await loadCover(cache, args.includes("--fetch-media"));
  const doc = buildCardCtaDocument({ cover }),
    json = JSON.stringify(doc, null, 2) + "\n";
  if (args.includes("--check")) {
    if (
      !output ||
      !fs.existsSync(output) ||
      fs.readFileSync(output, "utf8") !== json
    )
      throw Error("Selected source profile output is missing or stale");
    return;
  }
  if (args.includes("--stdout")) process.stdout.write(json);
  else fs.writeFileSync(output, json);
}
module.exports = {
  buildCardCtaDocument,
  projectClosure,
  verifyCover,
  loadCover,
  MEDIA_URL,
  MEDIA_SHA,
};
if (require.main === module)
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
