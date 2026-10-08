/** Source profile tests, no Figma or native acceptance. */
"use strict";
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const {
  buildCardCtaDocument,
  verifyCover,
  loadCover,
  MEDIA_URL,
} = require("../../../scripts/build-figma-card-cta.cjs");
const {
  buildHorizontalBookRecipes,
  SOURCE_HASHES,
} = require("../../../scripts/figma-horizontal-book-recipes.cjs");
const { getMangroveRoot } = require("../../../scripts/mangrove-source.cjs");
const stable = (x) =>
  Array.isArray(x)
    ? x.map(stable)
    : x && typeof x === "object"
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map((k) => [k, stable(x[k])]),
        )
      : x;
(async () => {
  const cache =
    process.env.MANGROVE_CARD_CTA_MEDIA_CACHE ||
    path.resolve(
      __dirname,
      "../../../.cache/figma-card-cta/bali-publication-cover.jpg",
    );
  const cover = await loadCover(cache, false),
    doc = buildCardCtaDocument({ cover });
  const projection = Object.fromEntries(
    ["collection", "modes", "variables", "styles", "components"].map((k) => [
      k,
      doc[k],
    ]),
  );
  assert.equal(
    crypto
      .createHash("sha256")
      .update(JSON.stringify(stable(projection)))
      .digest("hex"),
    "beb63ed3b7186846921fdf21215c52277b8f681454083f84901c1f1a57f400db",
  );
  assert.deepEqual(
    doc.components.families.map((f) => [f.id, f.variants.length]),
    [
      ["horizontal-book-card", 8],
      ["editorial-cta", 23],
    ],
  );
  assert.equal(doc.variables.length, 70);
  assert.equal(doc.styles.text.length, 8);
  assert.equal(doc.styles.effect.length, 1);
  assert.equal(
    doc.styles.effect[0].id,
    "component.horizontal-book-card.inner-border",
  );
  assert(!doc.kitGuidance && !doc.plannedInventory);
  const variants = doc.components.families[0].variants;
  assert.equal(variants[5].tree.children[0].layout.height, 0);
  assert.equal(variants[5].tree.layout.gap, "spacing/100");
  for (const i of [4, 5, 7])
    assert.equal(variants[i].tree.children[1].children[3].layout.width, "FILL");
  assert.equal(
    variants
      .flatMap((v) => v.tree.children)
      .filter((n) => n.id === "content")
      .flatMap((n) => n.children)
      .filter((n) => n.id === "title-box")
      .flatMap((n) => n.children)
      .filter((n) => n.id === "title" && n.layout.maxWidth).length,
    4,
  );
  for (const v of variants)
    assert.equal(
      v.tree.effectSurface.sourceEffectStyle,
      doc.styles.effect[0].id,
    );
  for (const v of doc.variables)
    assert.deepEqual(
      Object.keys(v.values).sort(),
      doc.modes.map((m) => m.id).sort(),
    );
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), "mangrove-card-cta-source-"),
  );
  try {
    const root = getMangroveRoot();
    for (const file of Object.keys(SOURCE_HASHES)) {
      const dst = path.join(temp, file);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(root, file), dst);
    }
    const args = {
      root: temp,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
      cover,
    };
    assert.throws(
      () => buildHorizontalBookRecipes({ ...args, modes: doc.modes.slice(1) }),
      /five source modes/,
    );
    const file = Object.keys(SOURCE_HASHES)[0];
    fs.appendFileSync(path.join(temp, file), "\nchanged");
    assert.throws(() => buildHorizontalBookRecipes(args), /Guarded source/);
    assert.throws(
      () => verifyCover(Buffer.from("foreign image")),
      /hash differs/,
    );
    await assert.rejects(
      loadCover(path.join(temp, "absent.jpg"), false),
      /Missing hash-checked/,
    );
    const bad = path.join(temp, "foreign.jpg");
    fs.writeFileSync(bad, "wrong");
    await assert.rejects(loadCover(bad, true), /hash differs/);
    const oldFetch = global.fetch;
    let fetched = null;
    try {
      global.fetch = async (url) => {
        fetched = url;
        return { ok: true, arrayBuffer: async () => cover };
      };
      await loadCover(path.join(temp, "official.jpg"), true);
      assert.equal(fetched, MEDIA_URL);
      verifyCover(fs.readFileSync(path.join(temp, "official.jpg")));
    } finally {
      global.fetch = oldFetch;
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log(
    "PASS live source2/31 semantic pin equals reviewed3c15 payload; source70/all5modes/styles8/effect1, finite title/empty-track/FILL/effect corrections, source/mode/media refusals and explicit official hash-checked cache. No native execution or publication acceptance.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
