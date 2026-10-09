/* Native-only baseline cache. UI never supplies or receives the session baseline. */
function mgSelectedCreateSession(
  native,
  source,
  sourceHash,
  renderer,
  dependencies = {},
) {
  const capture = dependencies.capture || mgSelectedCapture,
    run = dependencies.run || mgSelectedTagRun,
    derive = dependencies.derive || mgSelectedDeriveTargetConfig,
    checksum = dependencies.checksum || mgTagRawSHA256;
  let cache = null,
    generation = 0,
    busy = false;
  const assert = mgTagAssert;
  function invalidate() {
    generation++;
    cache = null;
  }
  function freeze(value, seen = new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    for (const child of Object.values(value)) freeze(child, seen);
    return Object.freeze(value);
  }
  function fence(config) {
    mgSelectedAssertPluginScope(native);
    assert(
      native.currentPage.type === "PAGE" &&
        native.currentPage.id === config.target.pageId,
      "Session target page changed",
    );
    assert(
      native.fileKey === undefined
        ? config.freshAssociationConfirmed === true
        : native.fileKey === config.target.fileKey,
      "Session native file association changed",
    );
  }
  function target(config) {
    return {
      target: config.target,
      association: config.association,
      selectedSet: config.selectedSet,
      setMembers: config.setMembers,
      setAnchors: config.setAnchors,
      rootIds: config.rootIds,
      sourceSHA256: config.sourceSHA256,
    };
  }
  async function prepare(input, callbacks = {}) {
    assert(!busy, "Selected session is busy");
    busy = true;
    invalidate();
    const started = generation;
    let snapshot = null;
    try {
      const config = JSON.parse(JSON.stringify(input));
      assert(
        sourceHash === MG_TAG_ACCEPTED_SOURCE_SHA256 &&
          config.sourceSHA256 === sourceHash &&
          config.baselineSourceSHA256 === sourceHash,
        "Session source differs from accepted static packet",
      );
      assert(
        callbacks.freshAssociationConfirmed === true,
        "Fresh target association required",
      );
      config.freshAssociationConfirmed = true;
      config.onCaptureProgress = callbacks.onProgress;
      fence(config);
      snapshot = (await capture(native, config)).report;
      assert(started === generation, "Session invalidated during capture");
      fence(config);
      snapshot.sourceSHA256 = sourceHash;
      assert(
        snapshot.complete &&
          snapshot.traversalRestored &&
          !snapshot.errors.length &&
          !snapshot.captureErrors.length,
        "Session full capture incomplete",
      );
      callbacks.onProgress?.({
        stage: "Preparing native session checksum and target summary",
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const raw = JSON.stringify(snapshot),
        baselineHash = checksum(raw),
        fresh = derive(snapshot, source, config.target.fileKey, {
          sourceSHA256: sourceHash,
          baselineSHA256: baselineHash,
        });
      assert(
        mgTagEqual(target(config), target(fresh)),
        "Captured target differs from requested target",
      );
      assert(started === generation, "Session invalidated during preparation");
      fence(config);
      const id = "tag-session-" + generation + "-" + Date.now();
      cache = { id, baseline: freeze(snapshot), raw, config: freeze(fresh) };
      return {
        sessionId: id,
        target: JSON.parse(JSON.stringify(fresh.target)),
        selectedSet: JSON.parse(JSON.stringify(fresh.selectedSet)),
        collection: JSON.parse(JSON.stringify(fresh.association)),
        sourceSHA256: sourceHash,
        baselineSHA256: baselineHash,
        sceneNodes: snapshot.beforeScene.length,
        links: snapshot.mainLinks.length,
        otherPages: snapshot.otherPageScenes.map((p) => ({
          pageId: p.pageId,
          nodes: p.scene.length,
          links: p.mainLinks.length,
        })),
        variables: snapshot.assets.variables.length,
        styles: snapshot.assets.styles.length,
        preservationChecked: false,
      };
    } catch (error) {
      invalidate();
      if (snapshot) error.selectedSnapshot = snapshot;
      throw error;
    } finally {
      busy = false;
    }
  }
  async function rebuild(request, callbacks = {}) {
    assert(!busy, "Selected session is busy");
    busy = true;
    const selected = cache;
    invalidate();
    try {
      assert(
        selected && request.sessionId === selected.id,
        "Missing or stale native session; capture again",
      );
      assert(
        !("baselineRaw" in request) &&
          !("baseline" in request) &&
          !("config" in request) &&
          !("configRaw" in request),
        "Session baseline/config override refused",
      );
      assert(
        request.rebuildApproved === true &&
          request.freshAssociationConfirmed === true,
        "Explicit one-time session rebuild approval required",
      );
      const config = {
        ...selected.config,
        baseline: selected.baseline,
        baselineRaw: selected.raw,
        freshAssociationConfirmed: true,
        onCaptureProgress: callbacks.onProgress,
        onCheckpoint: callbacks.onCheckpoint,
      };
      fence(config);
      const report = await run(native, config, renderer, source, sourceHash);
      return {
        report,
        context: {
          sourceSHA256: sourceHash,
          baselineSHA256: selected.config.baselineSHA256,
          target: selected.config.target,
        },
      };
    } finally {
      busy = false;
    }
  }
  return { prepare, rebuild, invalidate };
}
if (typeof module !== "undefined") module.exports = { mgSelectedCreateSession };
