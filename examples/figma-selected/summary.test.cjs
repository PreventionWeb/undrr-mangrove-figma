const assert = require("node:assert/strict");
const { mgSelectedAcceptanceSummary: summarise } = require("./summary.js");
const {
  MG_TAG_ACCEPTED_SOURCE_SHA256: sourceSHA256,
} = require("./tag-contract.js");
const context = { sourceSHA256 };
function fixture() {
  const main = {
    id: "main",
    type: "FRAME",
    parentId: "page",
    childIds: [],
    markers: { shared: { mgKitId: "integration/tag/main" } },
  };
  const review = {
    id: "review",
    type: "FRAME",
    parentId: "page",
    childIds: [],
    markers: { shared: { mgKitId: "integration/tag/review" } },
  };
  const rows = [main, review];
  for (let i = 0; i < 98; i++) {
    const parent = i < 49 ? main : review;
    const row = { id: "leaf" + i, parentId: parent.id, x: i, childIds: [] };
    rows.push(row);
    parent.childIds.push(row.id);
  }
  const scope = {
    expectedPluginId: "mangrove-tokens-exploratory",
    observedPluginId: "mangrove-tokens-exploratory",
    observedUnavailable: false,
  };
  const before = {
    complete: true,
    errors: [],
    captureErrors: [],
    traversalRestored: true,
    target: { fileKey: "abcdefghijklmnopqrstuv", pageId: "page" },
    beforeScene: rows,
    pages: [{ id: "page" }],
    mainLinks: [],
    otherPageScenes: [{ pageId: "other", scene: [{ id: "other-row", x: 0 }] }],
    assets: {
      collections: [],
      variables: [{ id: "variable", value: 5 }],
      styles: [],
    },
    identity: {},
    selected: {},
    actualFonts: [],
    availableFonts: [],
    privatePluginScope: scope,
  };
  const tones = ["Default", "Secondary", "Outline", "Accent", "Subtle"];
  const brands = [
    "UNDRR",
    "DELTA Resilience",
    "IRP",
    "MCR2030",
    "PreventionWeb",
  ];
  return {
    kind: "Selected Tag rebuild",
    operation: "rebuild",
    complete: true,
    errors: [],
    journal: [{ kind: "set", id: "leaf0", field: "x" }],
    before,
    after: structuredClone(before),
    permanentCreatedNodeIds: [],
    traversalRestored: true,
    publication: false,
    privatePluginScope: scope,
    operationAccepted: false,
    nativeRenderingAcceptance: false,
    result: {
      createdNodeIds: [],
      errors: [],
      updatedNodeIds: ["leaf0"],
      masterFields: tones.map((tone) => ({ tone })),
      reviewCases: brands.flatMap((brand) =>
        tones.map((tone) => ({ brand, tone })),
      ),
      styles: {
        errors: [],
        createdStyleIds: [],
        updatedStyleIds: [],
        removedStyleIds: [],
        counts: {
          text: { created: 0, updated: 0, failed: 0 },
          effect: { created: 0, updated: 0, failed: 0 },
        },
      },
    },
  };
}
const good = fixture(),
  raw = JSON.stringify(good),
  passed = summarise(good, context);
assert.equal(passed.status, "recorded-checks-passed");
assert.equal(passed.counts.selectedNodes, 100);
assert.equal(passed.acceptance.independentReview, "pending");
assert.equal(passed.acceptance.nativeRendering, "not-established-by-summary");
assert.equal(passed.acceptance.humanHandoff, "pending");
assert.equal(passed.acceptance.changedSourceSupport, false);
assert.equal(
  JSON.stringify(good),
  raw,
  "Summary must not rewrite raw receipt flags",
);
assert.equal(
  summarise(good).status,
  "not-verified",
  "Missing source context is not green",
);
for (const mutate of [
  (r) => {
    r.after.beforeScene[2].x += 0.00001;
  },
  (r) => {
    r.after.beforeScene.reverse();
  },
  (r) => {
    r.after.assets.variables[0].value = 6;
  },
  (r) => {
    r.after.otherPageScenes[0].scene[0].x = 1;
  },
  (r) => {
    r.after.mainLinks.push({ instanceId: "linked", main: { key: "foreign" } });
  },
]) {
  const r = fixture();
  mutate(r);
  const s = summarise(r, context);
  assert.equal(
    s.status,
    "failed",
    "A true complete flag cannot hide field drift",
  );
  assert.equal(s.checks.recordedPreservation, false);
  assert.ok(s.differences.count > 0);
}
for (const mutate of [
  (r) => {
    r.journal.push({ kind: "set", id: "foreign", field: "name" });
  },
  (r) => {
    r.permanentCreatedNodeIds.push("new");
  },
  (r) => {
    r.result.createdNodeIds.push("contradictory");
  },
  (r) => {
    r.journal.push({ kind: "create", id: "leaf0" });
  },
  (r) => {
    r.journal.push({ kind: "create", id: "other-row" });
  },
  (r) => {
    r.before.beforeScene[1].markers.shared.mgKitId = "integration/tag/main";
  },
  (r) => {
    r.after.captureErrors.push("unsupported read");
  },
  (r) => {
    r.result.reviewCases.pop();
  },
  (r) => {
    r.result.styles.counts.text.updated = 1;
  },
  (r) => {
    r.privatePluginScope.observedUnavailable = true;
  },
  (r) => {
    r.before.beforeScene[0].childIds.push("missing");
  },
]) {
  const r = fixture();
  mutate(r);
  assert.notEqual(summarise(r, context).status, "recorded-checks-passed");
}
const large = fixture();
for (let i = 2; i < 32; i++) large.after.beforeScene[i].x++;
const bounded = summarise(large, context);
assert.equal(bounded.differences.count, 30);
assert.equal(bounded.differences.preview.length, 20);
assert.equal(bounded.fullReportRequiredForFailures, true);
const refused = summarise(
  { complete: false, errors: ["wrong target"] },
  context,
);
assert.equal(refused.status, "failed");
assert.deepEqual(refused.errors, ["wrong target"]);
assert.equal(summarise(null, context).status, "not-verified");
console.log(
  "PASS automatic recorded-check summary: full drift, ownership, scope, source, missing captures and bounded failure previews; raw receipts and human/native/publication gates untouched.",
);
