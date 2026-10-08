"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  os = require("node:os"),
  vm = require("node:vm");
const { buildConnector } = require("../../scripts/build-figma-connector.cjs");
const { buildTagDocument } = require("../../scripts/build-figma-tag.cjs");
const { prepareConfig } = require("../../scripts/build-figma-selected.cjs");
const {
  rangeEnvironment,
} = require("../figma-plugin/dev/mock-rich-text-integration.cjs");
const { mgMutationFacade } = require("./mutation-facade.js");
const source = buildTagDocument();
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
(async () => {
  const originalPath = path.join(
    __dirname,
    "../../scripts/.selected-default-parity.cjs",
  );
  try {
    fs.writeFileSync(
      originalPath,
      require("node:child_process").execFileSync(
        "git",
        ["show", "HEAD:scripts/build-figma-connector.cjs"],
        { cwd: path.join(__dirname, "../..") },
      ),
    );
    const before = await require(originalPath).buildConnector({
      doc: source,
      familyIds: ["tag"],
    });
    const after = await buildConnector({ doc: source, familyIds: ["tag"] });
    assert.equal(after.code, before.code, "Normal compiler output changed");
  } finally {
    fs.rmSync(originalPath, { force: true });
  }
  await assert.rejects(
    () =>
      buildConnector({
        doc: source,
        familyIds: ["button"],
        selectedNative: true,
      }),
    /complete existing Tag/,
  );
  const {
    mgSelectedPluginScope,
    mgSelectedAssertPluginScope,
  } = require("./tag-contract.js");
  assert.equal(
    mgSelectedAssertPluginScope({ pluginId: "mangrove-tokens-exploratory" })
      .observedUnavailable,
    false,
  );
  assert.throws(
    () => mgSelectedAssertPluginScope({ pluginId: "wrong-private-scope" }),
    /Wrong private plugin namespace/,
  );
  assert.deepEqual(mgSelectedPluginScope({}), {
    expectedPluginId: "mangrove-tokens-exploratory",
    observedPluginId: null,
    observedUnavailable: true,
  });
  const scopeContext = { module: { exports: {} }, setTimeout, console };
  for (const file of ["tag-contract.js", "native-capture.js"])
    vm.runInNewContext(
      fs.readFileSync(path.join(__dirname, file), "utf8"),
      scopeContext,
    );
  let unexpectedReads = 0;
  const wrongNamespace = {
    pluginId: "unrelated-plugin",
    get currentPage() {
      unexpectedReads++;
      throw Error("Scene read before namespace guard");
    },
  };
  const refusedCapture = await scopeContext.mgSelectedCapture(wrongNamespace, {
    target: { pageId: "page", fileKey: "file" },
    association: {},
    setMembers: [],
  });
  assert.equal(refusedCapture.report.complete, false);
  assert.match(
    refusedCapture.report.errors[0],
    /Wrong private plugin namespace/,
  );
  assert.equal(refusedCapture.report.privatePluginId, "unrelated-plugin");
  assert.equal(unexpectedReads, 0, "Wrong namespace read scene metadata");
  const changedPacket = JSON.parse(JSON.stringify(source));
  changedPacket.components.families[0].variants[0].tree.layout.itemSpacing = 37;
  const changedRaw = JSON.stringify(changedPacket, null, 2) + "\n";
  assert.throws(
    () => prepareConfig("{}", changedRaw, "a".repeat(22)),
    /Changed Tag packet/,
  );
  const refusedOutput = path.join(
    os.tmpdir(),
    "mangrove-selected-source-refusal-" + process.pid,
  );
  await assert.rejects(
    () =>
      require("../../scripts/build-figma-selected.cjs").buildSelected(
        changedRaw,
        refusedOutput,
      ),
    /Changed Tag packet/,
  );
  assert.equal(
    fs.existsSync(refusedOutput),
    false,
    "Changed packet emitted a runnable artifact",
  );
  const compiled = await buildConnector({
    doc: source,
    familyIds: ["tag"],
    selectedNative: true,
  });
  const env = await rangeEnvironment(source, { sharedOnly: false });
  env.state.modeLimit = 5;
  const available = env.figma.listAvailableFontsAsync;
  env.figma.listAvailableFontsAsync = async () => [
    ...(await available()),
    { fontName: { family: "Roboto", style: "Regular" } },
    { fontName: { family: "Roboto Condensed", style: "Regular" } },
  ];
  env.state.fonts.push({ fontName: { family: "Roboto", style: "Regular" } });
  const imported = await env.call(
    "importVariables",
    source,
    source.modes.map((m) => m.id),
    false,
    ["component.tag.label"],
    false,
  );
  assert.deepEqual(Array.from(imported.errors), []);
  const roots = [env.figma.createFrame(), env.figma.createFrame()];
  roots[0].layoutMode = "NONE";
  roots[1].layoutMode = "VERTICAL";
  roots[1].resize(800, 100);
  const localStyles = JSON.stringify(
    env.state.styles.map((s) => [s.id, s.fontName, s.fontSize, s.lineHeight]),
  );
  await env.runCode(
    "globalThis.mgCompiledSelected=async function(figma,integration){" +
      compiled.code +
      "}",
  );
  const hooks = {
    preflightOwned() {},
    mainParent: () => roots[0],
    reviewParent: () => roots[1],
    preserveSetLayout: () => true,
    placeSelected: (built) => ({
      selected: [...built.keys()],
      globalLayout: false,
    }),
  };
  const first = await env.call("mgCompiledSelected", env.figma, hooks);
  assert.deepEqual(Array.from(first.errors), [], JSON.stringify(first.errors));
  assert.equal(first.families.length, 1);
  assert.equal(first.families[0].variantIds.length, 5);
  assert.equal(
    JSON.stringify(
      env.state.styles.map((s) => [s.id, s.fontName, s.fontSize, s.lineHeight]),
    ),
    localStyles,
    "Existing style was rewritten",
  );
  const set = env.state.nodes.get(first.families[0].setId);
  const all = [];
  function walk(n) {
    all.push(n);
    for (const c of n.children || []) walk(c);
  }
  roots.forEach(walk);
  assert.equal(
    all.filter((n) => n.type === "INSTANCE").length,
    10,
    "Shared producer must retain five default plus five source specimens",
  );
  assert(
    all
      .filter((n) => n.type === "INSTANCE")
      .every((n) =>
        n
          .getSharedPluginData("orgundrrmangrove", "mgKitId")
          .startsWith("integration/card-cta/review/tag/specimen/"),
      ),
  );
  const scope = new Set(all.map((n) => n.id)),
    journal = [];
  const facade = mgMutationFacade(
    env.figma,
    scope,
    new Set(),
    journal,
    () => {},
  );
  const selectedMain = await facade.api.getNodeByIdAsync(roots[0].id),
    selectedReview = await facade.api.getNodeByIdAsync(roots[1].id);
  const repeat = await env.call("mgCompiledSelected", facade.api, {
    ...hooks,
    mainParent: () => selectedMain,
    reviewParent: () => selectedReview,
  });
  assert.deepEqual(
    Array.from(repeat.errors),
    [],
    JSON.stringify(repeat.errors),
  );
  assert.equal(repeat.createdNodeIds.length, 0);
  assert.equal(
    JSON.stringify(
      env.state.styles.map((s) => [s.id, s.fontName, s.fontSize, s.lineHeight]),
    ),
    localStyles,
  );
  const foreign = env.figma.createFrame(),
    foreignHandle = await facade.api.getNodeByIdAsync(foreign.id);
  assert.throws(() => (foreignHandle.name = "no"), /outside selected scope/);
  const frozen = Object.freeze({
    id: "data",
    face: Object.freeze({ family: "Roboto", style: "Regular" }),
  });
  env.figma.getFrozen = () => frozen;
  assert.deepEqual(facade.api.getFrozen().face, {
    family: "Roboto",
    style: "Regular",
  });
  const broken = {
    id: "new-instance",
    get children() {
      throw Error("descendant getter failure");
    },
  };
  const native = {
    currentPage: {},
    getSource: () => ({ id: "main", createInstance: () => broken }),
  };
  const failedJournal = [];
  const guarded = mgMutationFacade(
    native,
    new Set(["main"]),
    new Set(),
    failedJournal,
    () => {},
  );
  assert.throws(
    () => guarded.api.getSource().createInstance(),
    /descendant getter/,
  );
  assert(
    failedJournal.some((n) => n.kind === "create" && n.id === "new-instance"),
    "Native created root lost before descendant failure",
  );
  const captureSource = fs.readFileSync(
    path.join(__dirname, "native-capture.js"),
    "utf8",
  );
  const start = captureSource.indexOf("  function nodeRow(n) {"),
    end = captureSource.indexOf("  async function scene", start);
  assert(start > 0 && end > start);
  const captureContext = {
    NODE_FIELDS: [],
    TEXT_FIELDS: [],
    markers: () => ({}),
    read: (o, fields) =>
      Object.fromEntries(fields.filter((k) => k in o).map((k) => [k, o[k]])),
  };
  vm.runInNewContext(
    captureSource.slice(start, end) + ";globalThis.captureRow=nodeRow;",
    captureContext,
  );
  const variant = {
    id: "native-variant",
    type: "COMPONENT",
    parent: { id: "set", type: "COMPONENT_SET" },
    get componentPropertyDefinitions() {
      throw Error("Native variant property getter is unsupported");
    },
  };
  assert.equal(captureContext.captureRow(variant).type, "COMPONENT");
  const standalone = {
    id: "standalone",
    type: "COMPONENT",
    parent: { id: "page", type: "PAGE" },
    componentPropertyDefinitions: { Label: { type: "TEXT" } },
  };
  assert.deepEqual(
    captureContext.captureRow(standalone).componentPropertyDefinitions,
    standalone.componentPropertyDefinitions,
  );
  const dir = path.join(__dirname, "../figma-selected");
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".js")))
    new vm.Script(fs.readFileSync(path.join(dir, f), "utf8"));
  console.log(
    "PASS selected compiler reuse, default byte parity, Tag5/initial10 identity, read-only styles, zero-create producer repeat, foreign mutation refusal, frozen data and immediate failure journal. Mock only; maintained native acceptance pending.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
