/* Summarise recorded checks. This is not publication or human acceptance. */
function mgSelectedAcceptanceSummary(report, context = {}) {
  const contract =
    typeof mgTagEqual === "function"
      ? {
          mgTagEqual,
          mgTagProjection,
          mgTagClosure,
          mgTagIdentity,
          MG_TAG_ACCEPTED_SOURCE_SHA256,
          MG_SELECTED_PRIVATE_PLUGIN_ID,
        }
      : require("./tag-contract.js");
  const { mgTagEqual: equal, mgTagProjection: projection } = contract;
  const before = report?.before,
    after = report?.after,
    result = report?.result;
  const empty = (value) => Array.isArray(value) && value.length === 0;
  const captured = (r) =>
    !!r &&
    r.complete === true &&
    r.traversalRestored === true &&
    empty(r.errors) &&
    empty(r.captureErrors) &&
    Array.isArray(r.beforeScene) &&
    Array.isArray(r.otherPageScenes) &&
    Array.isArray(r.pages) &&
    Array.isArray(r.mainLinks) &&
    ["collections", "variables", "styles"].every((k) =>
      Array.isArray(r.assets?.[k]),
    );
  const full = captured(before) && captured(after);
  const scope = report?.privatePluginScope || before?.privatePluginScope;
  let identityConflict = false;
  const roots = (before?.beforeScene || []).filter((n) => {
    try {
      return ["integration/tag/main", "integration/tag/review"].includes(
        contract.mgTagIdentity(n, "mgKitId"),
      );
    } catch (_error) {
      identityConflict = true;
      return false;
    }
  });
  let owned = new Set();
  try {
    owned = contract.mgTagClosure(
      before?.beforeScene || [],
      roots.map((n) => n.id),
    );
  } catch (_error) {
    identityConflict = true;
  }
  const journal = Array.isArray(report?.journal) ? report.journal : [];
  const temporary = new Set(
    journal
      .filter((j) => ["create", "create-descendant"].includes(j.kind))
      .map((j) => j.id),
  );
  const allIds = (capture) =>
    new Set(
      [
        ...(capture?.beforeScene || []),
        ...(capture?.otherPageScenes || []).flatMap((p) => p.scene || []),
        ...(capture?.assets?.collections || []),
        ...(capture?.assets?.variables || []),
        ...(capture?.assets?.styles || []),
      ].map((row) => row.id),
    );
  const priorIds = temporary.size ? allIds(before) : new Set(),
    finalIds = temporary.size ? allIds(after) : new Set();
  const createsConsistent = [...temporary].every(
    (id) => id && !priorIds.has(id) && !finalIds.has(id),
  );
  const foreign = journal.filter(
    (j) =>
      !j.id ||
      !["set", "call", "create", "create-descendant"].includes(j.kind) ||
      (!owned.has(j.id) && !temporary.has(j.id)),
  );
  const masters = result?.masterFields || [],
    cases = result?.reviewCases || [];
  const tones = ["Default", "Secondary", "Outline", "Accent", "Subtle"],
    brands = ["UNDRR", "DELTA Resilience", "IRP", "MCR2030", "PreventionWeb"];
  const coverage = new Set(cases.map((c) => c.brand + "/" + c.tone));
  const checks = {
    operationComplete:
      report?.kind === "Selected Tag rebuild" &&
      report.operation === "rebuild" &&
      report.complete === true &&
      empty(report.errors) &&
      empty(result?.errors),
    fullCaptures: full,
    recordedPreservation: full && equal(projection(before), projection(after)),
    recordedIdentityAndFonts:
      full &&
      ["identity", "selected", "actualFonts", "availableFonts"].every(
        (key) => before[key] !== undefined && equal(before[key], after[key]),
      ),
    namespace:
      scope?.expectedPluginId === contract.MG_SELECTED_PRIVATE_PLUGIN_ID &&
      scope.observedPluginId === scope.expectedPluginId &&
      scope.observedUnavailable === false &&
      equal(scope, before?.privatePluginScope) &&
      equal(scope, after?.privatePluginScope),
    selectedOwnership:
      !identityConflict &&
      roots.length === 2 &&
      new Set(roots.map((n) => contract.mgTagIdentity(n, "mgKitId"))).size ===
        2 &&
      roots.every(
        (n) => n.type === "FRAME" && n.parentId === before?.target?.pageId,
      ) &&
      owned.size === 100 &&
      Array.isArray(report?.journal) &&
      foreign.length === 0 &&
      (result?.updatedNodeIds || []).every((id) => owned.has(id)),
    sourcePinned:
      context.sourceSHA256 === contract.MG_TAG_ACCEPTED_SOURCE_SHA256,
    noPermanentConstruction:
      empty(report?.permanentCreatedNodeIds) &&
      empty(result?.createdNodeIds) &&
      createsConsistent,
    stylesUnchanged:
      !!result?.styles &&
      empty(result.styles.errors) &&
      ["createdStyleIds", "updatedStyleIds", "removedStyleIds"].every((k) =>
        empty(result.styles[k]),
      ) &&
      ["text", "effect"].every((kind) =>
        ["created", "updated", "failed"].every(
          (key) => result.styles.counts?.[kind]?.[key] === 0,
        ),
      ),
    finiteCaseCoverage:
      masters.length === 5 &&
      new Set(masters.map((m) => m.tone)).size === 5 &&
      tones.every((tone) => masters.some((m) => m.tone === tone)) &&
      cases.length === 25 &&
      coverage.size === 25 &&
      brands.every((brand) =>
        tones.every((tone) => coverage.has(brand + "/" + tone)),
      ),
    traversalRestored: report?.traversalRestored === true,
    noPublication: report?.publication === false,
  };
  const differences = [];
  let differenceCount = 0;
  function compareRows(category, a, b, key = "id") {
    const left = new Map((a || []).map((n) => [n[key], n])),
      right = new Map((b || []).map((n) => [n[key], n]));
    for (const id of new Set([...left.keys(), ...right.keys()])) {
      const x = left.get(id),
        y = right.get(id);
      if (equal(x, y)) continue;
      differenceCount++;
      if (differences.length < 20)
        differences.push({
          category,
          id: id || null,
          change: !x ? "added" : !y ? "removed" : "changed",
          fields:
            x && y
              ? [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(
                  (k) => !equal(x[k], y[k]),
                )
              : [],
        });
    }
    if (
      !equal(
        (a || []).map((n) => n[key]),
        (b || []).map((n) => n[key]),
      )
    ) {
      differenceCount++;
      if (differences.length < 20)
        differences.push({
          category,
          id: null,
          change: "order-or-membership-changed",
          fields: [],
        });
    }
  }
  // Avoid a second full comparison on successful operations.
  if (full && !checks.recordedPreservation) {
    compareRows("scene", before.beforeScene, after.beforeScene);
    for (const k of ["collections", "variables", "styles"])
      compareRows(k, before.assets[k], after.assets[k]);
    compareRows("links", before.mainLinks, after.mainLinks, "instanceId");
    compareRows("pages", before.pages, after.pages);
    compareRows(
      "otherPages",
      before.otherPageScenes,
      after.otherPageScenes,
      "pageId",
    );
  }
  const passed = Object.values(checks).every((v) => v === true);
  return {
    kind: "Selected Tag recorded-check summary",
    version: 1,
    status: passed
      ? "recorded-checks-passed"
      : report?.complete === false || (full && !checks.recordedPreservation)
        ? "failed"
        : "not-verified",
    target: before?.target || context.target || null,
    sourceSHA256: context.sourceSHA256 || null,
    baselineSHA256: context.baselineSHA256 || null,
    privatePluginScope: scope || null,
    checks,
    failedChecks: Object.keys(checks).filter((k) => !checks[k]),
    counts: {
      sceneNodes: before?.beforeScene?.length || 0,
      selectedNodes: owned.size,
      journalEntries: journal.length,
      updatedNodes: new Set(result?.updatedNodeIds || []).size,
      permanentCreatedNodes: report?.permanentCreatedNodeIds?.length ?? null,
      masters: masters.length,
      brandToneCases: cases.length,
    },
    differences: { count: differenceCount, preview: differences, limit: 20 },
    foreignJournalEntries: foreign.slice(0, 20),
    errors: (report?.errors || []).slice(0, 20),
    acceptance: {
      recordedChecks: passed,
      independentReview: "pending",
      nativeRendering: "not-established-by-summary",
      humanHandoff: "pending",
      publication: "not-performed",
      changedSourceSupport: false,
    },
    fullReportRequiredForFailures: true,
  };
}

if (typeof module !== "undefined")
  module.exports = { mgSelectedAcceptanceSummary };
