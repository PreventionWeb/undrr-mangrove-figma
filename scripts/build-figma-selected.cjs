#!/usr/bin/env node
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { buildConnector } = require("./build-figma-connector.cjs");
const {
  MG_TAG_ACCEPTED_SOURCE_SHA256,
  MG_SELECTED_PRIVATE_PLUGIN_ID,
  mgTagSourceGuard,
  mgTagIdentity,
  mgTagClosure,
} = require("../examples/figma-selected/tag-contract.js");
const ROOT = path.resolve(__dirname, ".."),
  DIR = path.join(ROOT, "examples/figma-selected");
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
function prepareConfig(baselineRaw, sourceRaw, fileKey) {
  const baseline = JSON.parse(baselineRaw),
    source = JSON.parse(sourceRaw);
  mgTagSourceGuard(source);
  if (hash(sourceRaw) !== MG_TAG_ACCEPTED_SOURCE_SHA256)
    throw Error("Changed Tag packet requires a separate source/native release");
  if (
    !/^[A-Za-z0-9]{22}$/.test(fileKey) ||
    !baseline.complete ||
    baseline.errors.length ||
    baseline.captureErrors.length ||
    !baseline.traversalRestored ||
    !Array.isArray(baseline.otherPageScenes)
  )
    throw Error("Exact file key and complete full native baseline required");
  if (
    baseline.sourceSHA256 &&
    baseline.sourceSHA256 !== MG_TAG_ACCEPTED_SOURCE_SHA256
  )
    throw Error("Prior baseline source differs");
  const rows = baseline.beforeScene;
  const unique = (items, label) => {
    if (items.length !== 1) throw Error("Unique " + label + " required");
    return items[0];
  };
  const set = unique(
    rows.filter(
      (n) =>
        n.type === "COMPONENT_SET" &&
        mgTagIdentity(n, "mgKitId") === "family/tag",
    ),
    "existing Tag set",
  );
  const main = unique(
      rows.filter(
        (n) => mgTagIdentity(n, "mgKitId") === "integration/tag/main",
      ),
      "selected master root",
    ),
    review = unique(
      rows.filter(
        (n) => mgTagIdentity(n, "mgKitId") === "integration/tag/review",
      ),
      "selected review root",
    );
  const page = unique(
    rows.filter((n) => n.type === "PAGE"),
    "current page",
  );
  if (
    main.parentId !== page.id ||
    review.parentId !== page.id ||
    set.parentId !== main.id ||
    mgTagClosure(rows, [main.id, review.id]).size !== 100
  )
    throw Error("Existing selected Tag100 anatomy required");
  const collection = unique(
    baseline.assets.collections.filter((c) => c.name === source.collection),
    "source collection",
  );
  const members = set.childIds.map((id) => {
    const n = rows.find((n) => n.id === id);
    if (!n || n.type !== "COMPONENT" || !n.key)
      throw Error("Native member key required");
    return { id: n.id, key: n.key, type: n.type };
  });
  const definitions = set.componentPropertyDefinitions;
  const label = JSON.parse(mgTagIdentity(set, "mgKitProperties")).Label;
  if (members.length !== 5 || definitions[label]?.type !== "TEXT")
    throw Error("Existing owning Label and five members required");
  return {
    version: 1,
    operation: "rebuild",
    sourceSHA256: hash(sourceRaw),
    baselineSourceSHA256:
      baseline.sourceSHA256 || MG_TAG_ACCEPTED_SOURCE_SHA256,
    baselineSHA256: hash(baselineRaw),
    target: { fileKey, pageId: page.id },
    association: { collectionId: collection.id, collectionKey: collection.key },
    selectedSet: { id: set.id, key: set.key, labelProperty: label },
    setMembers: members,
    setAnchors: [{ id: set.id, key: set.key, members }],
    rootIds: [main.id, review.id],
  };
}
async function buildSelected(sourceRaw, out) {
  const source = JSON.parse(sourceRaw);
  mgTagSourceGuard(source);
  if (hash(sourceRaw) !== MG_TAG_ACCEPTED_SOURCE_SHA256)
    throw Error("Changed Tag packet requires a separate source/native release");
  const compiled = await buildConnector({
    doc: source,
    operation: "build",
    familyIds: ["tag"],
    brandId: "undrr",
    selectedNative: true,
  });
  const modules = [
    "raw-sha256.js",
    "tag-contract.js",
    "tag-review-policy.js",
    "mutation-facade.js",
    "native-capture.js",
    "runner.js",
  ];
  const body = modules
    .map((f) => fs.readFileSync(path.join(DIR, f), "utf8"))
    .join("\n;\n");
  const code =
    body +
    "\nasync function mgSelectedRenderer(figma,integration){" +
    compiled.code +
    "}\n" +
    "const MG_SELECTED_SOURCE=" +
    JSON.stringify(source) +
    ";\nconst MG_SELECTED_SOURCE_SHA=" +
    JSON.stringify(hash(sourceRaw)) +
    ";\n" +
    fs.readFileSync(path.join(DIR, "entry.js"), "utf8");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "code.js"), code);
  fs.copyFileSync(path.join(DIR, "ui.html"), path.join(out, "ui.html"));
  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify(
      {
        name: "Mangrove selected Tag rebuild",
        id: MG_SELECTED_PRIVATE_PLUGIN_ID,
        api: "1.0.0",
        main: "code.js",
        ui: "ui.html",
        editorType: ["figma"],
        documentAccess: "dynamic-page",
        networkAccess: { allowedDomains: ["none"] },
      },
      null,
      2,
    ) + "\n",
  );
  const receipt = {
    operation: "Existing accepted Tag unchanged-source rebuild only",
    sourceSHA256: hash(sourceRaw),
    compilerSHA256: hash(fs.readFileSync(__filename)),
    sharedBuilderSHA256: hash(
      fs.readFileSync(path.join(ROOT, "examples/figma-plugin/kit-builder.js")),
    ),
    rendererSHA256: hash(compiled.code),
    codeSHA256: hash(code),
    bytes: Buffer.byteLength(code),
    nativeExecutionAccepted: false,
    publication: false,
  };
  fs.writeFileSync(
    path.join(out, "build-info.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  return receipt;
}
function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || !argv[i + 1])
      throw Error(
        "Expected --source path --out path [--baseline path --file-key key]",
      );
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}
if (require.main === module)
  (async () => {
    const a = args(process.argv.slice(2));
    if (!a.source || !a.out)
      throw Error("Explicit selected source packet and output required");
    const raw = fs.readFileSync(a.source, "utf8");
    if (a.baseline) {
      const config = prepareConfig(
        fs.readFileSync(a.baseline, "utf8"),
        raw,
        a["file-key"],
      );
      fs.writeFileSync(a.out, JSON.stringify(config, null, 2) + "\n");
      console.log("Prepared existing Tag target configuration " + a.out);
    } else
      console.log(
        JSON.stringify(await buildSelected(raw, path.resolve(a.out))),
      );
  })().catch((e) => {
    console.error(String(e));
    process.exitCode = 1;
  });
module.exports = { buildSelected, prepareConfig };
