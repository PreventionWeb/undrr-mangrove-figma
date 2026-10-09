/** Finite Tag source/alias contracts. No Figma or native acceptance. */
"use strict";
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict"),
  cp = require("node:child_process");
const {
  buildTagDocument,
  projectTagClosure,
} = require("../../../scripts/build-figma-tag.cjs");
const {
  buildTagRecipes,
  SOURCE_HASHES,
} = require("../../../scripts/figma-tag-recipes.cjs");
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
const doc = buildTagDocument(),
  projection = Object.fromEntries(
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
  "275924269e06c1e02f035bfa5c2e04e68699ccb16e16da95b3824f3522826ef8",
);
assert.equal(doc.variables.length, 29);
assert.equal(doc.styles.text.length, 1);
assert.equal(doc.styles.effect.length, 0);
assert(!doc.capabilities && !doc.plannedInventory && !doc.kitGuidance);
assert.equal(doc.selectedProfile.defaultKitRuntimeAdmission, false);
assert.equal(doc.selectedProfile.nativeExecutionAccepted, false);
const family = doc.components.families[0];
assert.equal(family.id, "tag");
assert.deepEqual(
  family.variants.map((v) => v.properties.Tone),
  ["Default", "Secondary", "Outline", "Accent", "Subtle"],
);
assert(
  family.variants.every(
    (v) =>
      v.tree.children[0].characters === "Organization" &&
      v.tree.children[0].textProperty === "Label" &&
      v.tree.children[0].stroke === null,
  ),
);
assert.equal(
  family.variants[3].tree.bindings.strokeLeftWeight,
  "tag/accent-edge-width",
);
assert(
  family.variants.every(
    (v) =>
      v.tree.layout.minWidth === "tag/min-width" &&
      v.tree.layout.minHeight === "tag/min-height" &&
      v.tree.layout.align === "CENTER",
  ),
);
assert.deepEqual(
  family.review.specimens.map((s) => s.properties.Label),
  ["Organization", "Metadata", "Subtle", "Featured", "Reference"],
);
assert.equal(doc.styles.text[0].typography.fontWeightRequested, 500);
assert.equal(doc.styles.text[0].typography.fontWeightBundled, 400);
const helpers = doc.variables.filter((v) => v.name.startsWith("tag/"));
assert.equal(helpers.length, 5);
assert.equal(helpers.filter((v) => v.type === "FLOAT").length, 4);
assert.equal(helpers.filter((v) => v.type === "COLOR").length, 1);
assert(
  helpers.every((v) => v.hiddenFromPublishing === false && v.codeSyntax.WEB),
);
const inputBefore = JSON.stringify(doc);
projectTagClosure(doc);
assert.equal(JSON.stringify(doc), inputBefore);
const corrupt = (change) => {
  const changed = structuredClone(doc);
  change(changed);
  assert.throws(() => projectTagClosure(changed));
};
corrupt((d) => d.variables.push(structuredClone(d.variables[0])));
corrupt(
  (d) => delete d.variables.find((v) => v.name === "color/tag").values.mcr,
);
corrupt(
  (d) =>
    (d.variables.find((v) => v.name === "color/tag").values.mcr = {
      alias: "missing",
    }),
);
corrupt(
  (d) =>
    (d.variables.find((v) => v.name === "color/tag").values.mcr = {
      alias: "font-family/ui",
    }),
);
corrupt(
  (d) =>
    (d.variables.find((v) => v.name === "color/tag").values.mcr = {
      alias: "color/tag",
    }),
);
corrupt(
  (d) => (d.variables.find((v) => v.name === "font-size/300").values.mcr = 0),
);
corrupt(
  (d) =>
    (d.variables.find((v) => v.name === "tag/transparent").values.mcr = {
      r: 0,
      g: 0,
      b: 0,
      a: 2,
    }),
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mangrove-tag-source-"));
try {
  for (const file of Object.keys(SOURCE_HASHES)) {
    const dst = path.join(temp, file);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(getMangroveRoot(), file), dst);
  }
  const args = {
    root: temp,
    modes: doc.modes,
    variables: structuredClone(doc.variables),
    styles: structuredClone(doc.styles),
  };
  assert.throws(
    () => buildTagRecipes({ ...args, modes: doc.modes.slice(1) }),
    /exact five/,
  );
  for (const file of Object.keys(SOURCE_HASHES)) {
    const target = path.join(temp, file),
      raw = fs.readFileSync(target);
    fs.appendFileSync(target, "\nchanged");
    assert.throws(() => buildTagRecipes(args), /source hash differs/);
    fs.writeFileSync(target, raw);
  }
  const cli = path.resolve(__dirname, "../../../scripts/build-figma-tag.cjs"),
    out = path.join(temp, "selected.json");
  cp.execFileSync(process.execPath, [cli, "--output", out]);
  cp.execFileSync(process.execPath, [cli, "--check", "--output", out]);
  fs.appendFileSync(out, " ");
  assert.throws(() =>
    cp.execFileSync(process.execPath, [cli, "--check", "--output", out], {
      stdio: "pipe",
    }),
  );
  assert.throws(() =>
    cp.execFileSync(process.execPath, [cli], { stdio: "pipe" }),
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log(
  "PASS preserved Tag5/29-role/1-style semantic hash, source7/mode/font inventory guards, alias/type/value/cycle/positive-review-size refusals, helpers/owning Label/review fields and explicit output freshness. Source only; native/visual/publication unclaimed.",
);
