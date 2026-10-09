"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const { buildTagDocument } = require("../../scripts/build-figma-tag.cjs");
const { prepareConfig } = require("../../scripts/build-figma-selected.cjs");
const source = buildTagDocument(),
  hash = (s) => crypto.createHash("sha256").update(s).digest("hex"),
  copy = (x) => JSON.parse(JSON.stringify(x));
const marker = (id) => ({ private: {}, shared: { mgKitId: id } });
function fixture() {
  const modes = source.modes.map((m) => ({ modeId: m.id, name: m.name })),
    collection = {
      id: "collection",
      key: "c".repeat(40),
      name: source.collection,
      modes,
    };
  const ids = new Map(source.variables.map((v, i) => [v.name, "variable" + i]));
  const variables = source.variables.map((v) => ({
    id: ids.get(v.name),
    name: v.name,
    resolvedType: v.type,
    variableCollectionId: collection.id,
    remote: false,
    markers: { private: {}, shared: { mgId: v.id } },
    description: v.description || "",
    scopes: v.scopes,
    hiddenFromPublishing: v.hiddenFromPublishing,
    codeSyntax: v.codeSyntax,
    valuesByMode: Object.fromEntries(
      Object.entries(v.values).map(([mode, value]) => [
        mode,
        value?.alias
          ? { type: "VARIABLE_ALIAS", id: ids.get(value.alias) }
          : value,
      ]),
    ),
  }));
  const styles = [
    {
      id: "style",
      type: "TEXT",
      markers: { private: {}, shared: { mgStyleId: "component.tag.label" } },
      ...source.styles.text[0].values.undrr,
    },
  ];
  const rows = [
    {
      id: "page",
      type: "PAGE",
      parentId: null,
      childIds: ["main", "review"],
      markers: marker(""),
    },
    {
      id: "main",
      type: "FRAME",
      parentId: "page",
      childIds: ["set"],
      markers: marker("integration/tag/main"),
    },
    {
      id: "review",
      type: "FRAME",
      parentId: "page",
      childIds: [],
      markers: marker("integration/tag/review"),
    },
    {
      id: "set",
      type: "COMPONENT_SET",
      key: "s".repeat(40),
      parentId: "main",
      childIds: [],
      markers: {
        private: {},
        shared: {
          mgKitId: "family/tag",
          mgKitProperties: JSON.stringify({ Label: "Label#1" }),
        },
      },
      componentPropertyDefinitions: {
        "Label#1": { type: "TEXT", defaultValue: "Organization" },
      },
    },
  ];
  for (let i = 0; i < 5; i++) {
    const n = {
      id: "member" + i,
      type: "COMPONENT",
      key: String(i + 1).repeat(40),
      parentId: "set",
      childIds: [],
      markers: marker(
        "family/tag/variant/" + source.components.families[0].variants[i].id,
      ),
    };
    rows[3].childIds.push(n.id);
    rows.push(n);
  }
  for (let i = 0; i < 92; i++) {
    const n = {
      id: "owned" + i,
      type: "FRAME",
      parentId: "review",
      childIds: [],
      markers: marker("integration/tag/model/" + i),
      x: i,
    };
    rows[2].childIds.push(n.id);
    rows.push(n);
  }
  const baseline = {
    complete: true,
    traversalRestored: true,
    errors: [],
    captureErrors: [],
    beforeScene: rows,
    assets: { collections: [collection], variables, styles },
    pages: [{ id: "page" }],
    otherPageScenes: [
      {
        pageId: "other",
        scene: [
          { id: "other", type: "PAGE", markers: marker(""), childIds: [] },
        ],
        mainLinks: [],
      },
    ],
    mainLinks: [],
  };
  const raw = JSON.stringify(baseline),
    sourceRaw = JSON.stringify(source, null, 2) + "\n",
    config = prepareConfig(raw, sourceRaw, "a".repeat(22));
  config.baselineRaw = raw;
  config.baseline = baseline;
  config.freshAssociationConfirmed = true;
  return { baseline, config, sourceHash: hash(sourceRaw) };
}
async function run(kind) {
  const f = fixture(),
    context = {
      setTimeout,
      console,
      module: { exports: {} },
      rendererCalls: 0,
    };
  for (const file of ["tag-contract.js", "raw-sha256.js", "runner.js"])
    vm.runInNewContext(
      fs.readFileSync(__dirname + "/" + file, "utf8"),
      context,
    );
  // Native geometry/font validation has its own real-producer tests. This model isolates orchestration and the full preservation comparison.
  context.mgTagMasterFields = () => [];
  context.mgTagVerifyMasterBindings = () => {};
  context.mgTagVerifyReview = () => {};
  context.mgTagSnapshotAuxiliary = () => [];
  context.mgTagLoadCaseFonts = async () => {};
  context.mgTagBrandHeadingGuard = () => [];
  context.mgTagMatrixCases = async () => [];
  context.mgTagClassifyReview = async () => ({
    defaults: [],
    sources: [],
    brandCases: [],
  });
  const set = {
      id: "set",
      children: [],
      componentPropertyDefinitions: {
        "Label#1": { type: "TEXT", defaultValue: "Organization" },
      },
    },
    native = {
      pluginId:
        kind === "wrong-plugin"
          ? "unrelated-plugin"
          : "mangrove-tokens-exploratory",
      fileKey: kind === "wrong-file" ? "b".repeat(22) : undefined,
      currentPage: { id: "page", type: "PAGE" },
      skipInvisibleInstanceChildren: true,
      variables: {
        getVariableCollectionByIdAsync: async () =>
          f.baseline.assets.collections[0],
      },
      getNodeByIdAsync: async (id) => (id === "set" ? set : { id }),
    };
  context.mgMutationFacade = () => ({
    api: native,
    created: new Set(kind === "permanent" ? ["owned0"] : []),
  });
  let captures = 0;
  context.mgSelectedCapture = async () => {
    captures++;
    const r = copy(f.baseline);
    if (kind === "fresh-drift") r.beforeScene[10].x = 999;
    if (captures > 1 && kind === "scene-drift") r.beforeScene[10].x = 999;
    if (captures > 1 && kind === "asset-drift")
      r.assets.variables[0].description = "changed";
    if (captures > 1 && kind === "other-page-drift")
      r.otherPageScenes[0].scene[0].name = "changed";
    return { report: r, nodeRow: () => ({}), readErrors: () => [] };
  };
  if (kind === "source-change") f.config.baselineSourceSHA256 = "0".repeat(64);
  if (kind === "first") f.config.operation = "first";
  if (kind === "bytes-change") f.config.baselineRaw += " ";
  if (kind === "foreign-member") f.config.setMembers[0].key = "x".repeat(40);
  const stages = [];
  f.config.onCaptureProgress = (p) => stages.push(p.stage);
  const realSHA = context.mgTagRawSHA256;
  context.mgTagRawSHA256 = (raw) => {
    assert(
      stages.at(-1).startsWith("Verifying full baseline checksum"),
      "Checksum ran before its progress stage",
    );
    return realSHA(raw);
  };
  const result = await context.mgSelectedTagRun(
    native,
    f.config,
    async () => {
      context.rendererCalls++;
      return { errors: [] };
    },
    source,
    f.sourceHash,
  );
  assert.equal(
    native.skipInvisibleInstanceChildren,
    true,
    "Traversal flag not restored",
  );
  if (kind === "success") {
    assert.equal(result.complete, true, JSON.stringify(result.errors));
    assert.equal(context.rendererCalls, 1);
    assert.equal(result.operationAccepted, false);
    assert.equal(result.publication, false);
  } else {
    assert.equal(result.complete, false, kind + " incorrectly passed");
    assert(result.errors.length > 0);
    if (
      [
        "wrong-plugin",
        "wrong-file",
        "source-change",
        "first",
        "bytes-change",
        "foreign-member",
        "fresh-drift",
      ].includes(kind)
    )
      assert.equal(context.rendererCalls, 0, kind + " reached renderer");
  }
}
module.exports = { fixture };
if (require.main === module)
  (async () => {
    for (const kind of [
      "success",
      "wrong-plugin",
      "wrong-file",
      "source-change",
      "first",
      "bytes-change",
      "foreign-member",
      "fresh-drift",
      "scene-drift",
      "asset-drift",
      "other-page-drift",
      "permanent",
    ])
      await run(kind);
    console.log(
      "PASS full-runner orchestration: one successful modeled rebuild; prewrite target/source/input/member/drift refusals; scene/asset/other-page drift and permanent creation fail; traversal flag restored. Mock orchestration only.",
    );
  })().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
