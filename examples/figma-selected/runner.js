/* Existing accepted Tag only. No publication or automatic recovery. */
async function mgSelectedTagRun(native, config, renderer, source, sourceHash) {
  const report = {
    kind: "Selected Tag rebuild",
    operation: "rebuild",
    complete: false,
    errors: [],
    journal: [],
    before: null,
    after: null,
    result: null,
    publication: false,
    operationAccepted: false,
    nativeRenderingAcceptance: false,
  };
  let prior, facade;
  const assert = mgTagAssert;
  function fence() {
    mgSelectedAssertPluginScope(native);
    assert(
      config.operation === "rebuild" &&
        native.currentPage.type === "PAGE" &&
        native.currentPage.id === config.target.pageId,
      "Wrong selected operation/page",
    );
    assert(
      native.fileKey === undefined
        ? config.freshAssociationConfirmed === true
        : native.fileKey === config.target.fileKey,
      "Wrong native file association",
    );
  }
  async function progress(stage) {
    config.onCaptureProgress?.({ stage });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  function checkpoint(phase) {
    try {
      config.onCheckpoint?.({
        kind: report.kind,
        phase,
        complete: false,
        errors: report.errors.slice(),
        journal: report.journal.slice(),
        result: report.result,
        publication: false,
      });
    } catch (error) {
      report.errors.push("Checkpoint delivery failed: " + String(error));
    }
  }
  try {
    report.privatePluginScope = mgSelectedPluginScope(native);
    mgSelectedAssertPluginScope(native);
    assert(
      config.operation === "rebuild",
      "Only existing accepted Tag rebuild is supported",
    );
    assert(
      sourceHash === MG_TAG_ACCEPTED_SOURCE_SHA256 &&
        config.sourceSHA256 === sourceHash &&
        config.baselineSourceSHA256 === sourceHash,
      "Source changed: foundation/recipe migration needs a separate release",
    );
    const baseline = config.baseline;
    assert(
      baseline?.complete &&
        baseline.traversalRestored &&
        baseline.errors.length === 0 &&
        baseline.captureErrors.length === 0 &&
        Array.isArray(baseline.otherPageScenes),
      "Complete full native baseline required",
    );
    await progress(
      "Verifying full baseline checksum; this can take time for large files",
    );
    assert(
      config.baselineSHA256 === mgTagRawSHA256(config.baselineRaw),
      "Uploaded baseline bytes changed",
    );
    assert(
      config.rootIds?.length === 2 && new Set(config.rootIds).size === 2,
      "Two existing selected roots required",
    );
    delete config.baselineRaw;
    await progress(
      "Checksum verified; checking recorded identities and foundations",
    );
    const family = mgTagSourceGuard(source),
      base = mgTagProjection(baseline);
    for (const row of [
      ...mgTagAllRows(baseline),
      ...base.assets.collections,
      ...base.assets.variables,
      ...base.assets.styles,
    ])
      for (const key of [
        "mgKitId",
        "mgId",
        "mgStyleId",
        "mgKitProperties",
        "mgMaintenancePolicy",
      ])
        mgTagIdentity(row, key);
    const owned = mgTagClosure(base.beforeScene, config.rootIds);
    assert(
      owned.size === 100 &&
        config.rootIds.every(
          (id) =>
            base.beforeScene.find((n) => n.id === id)?.parentId ===
            config.target.pageId,
        ),
      "Exact existing 100-node Tag anatomy required",
    );
    const roots = config.rootIds.map((id) =>
      base.beforeScene.find((n) => n.id === id),
    );
    assert(
      roots.every((n) => n.type === "FRAME") &&
        mgTagIdentity(roots[0], "mgKitId") === "integration/tag/main" &&
        mgTagIdentity(roots[1], "mgKitId") === "integration/tag/review",
      "Existing selected root identities differ",
    );
    const foundation = mgTagValidateVariables(
      source,
      base.assets,
      config,
      "repeat",
    );
    const styles = base.assets.styles.filter(
      (s) => mgTagIdentity(s, "mgStyleId") === "component.tag.label",
    );
    assert(
      styles.length === 1 && styles[0].type === "TEXT",
      "Existing unique Tag style required",
    );
    const expectedStyle = source.styles.text[0].values.undrr,
      actualStyle = styles[0];
    for (const key of [
      "fontSize",
      "lineHeight",
      "textDecoration",
      "textWrapStyle",
    ])
      assert(
        mgTagEqual(actualStyle[key], expectedStyle[key]),
        "Source Tag style changed " + key,
      );
    assert(
      actualStyle.fontName?.family === expectedStyle.fontName.family &&
        actualStyle.fontName?.style === expectedStyle.fontName.style,
      "Source Tag style font changed",
    );
    for (const spec of source.variables.filter((v) =>
      MG_TAG_HELPERS.includes(v.name),
    )) {
      const actual = foundation.existing.find((v) => v.name === spec.name);
      assert(
        actual.description === (spec.description || "") &&
          mgTagSetScopesEqual(actual.scopes, spec.scopes) &&
          mgTagEqual(actual.codeSyntax, spec.codeSyntax) &&
          actual.hiddenFromPublishing === spec.hiddenFromPublishing,
        "Existing source Tag helper metadata changed " + spec.name,
      );
    }

    const setPin = config.selectedSet;
    assert(
      config.setAnchors.length === 1 &&
        config.setAnchors[0].id === setPin.id &&
        config.setAnchors[0].key === setPin.key &&
        mgTagEqual(config.setAnchors[0].members, config.setMembers),
      "Selected target anchor differs",
    );
    const row = base.beforeScene.find((n) => n.id === setPin.id);
    assert(
      row?.type === "COMPONENT_SET" &&
        row.key === setPin.key &&
        row.parentId === roots[0].id &&
        mgTagIdentity(row, "mgKitId") === "family/tag",
      "Exact selected set differs",
    );
    assert(
      mgTagEqual(
        row.childIds,
        config.setMembers.map((n) => n.id),
      ) &&
        config.setMembers.length === 5 &&
        config.setMembers.every((pin) => {
          const n = base.beforeScene.find((n) => n.id === pin.id);
          return (
            n?.type === "COMPONENT" &&
            n.key === pin.key &&
            n.parentId === row.id
          );
        }),
      "Exact selected five member keys differ",
    );
    fence();
    prior = native.skipInvisibleInstanceChildren;
    native.skipInvisibleInstanceChildren = false;
    const capture = await mgSelectedCapture(native, config);
    report.before = capture.report;
    assert(
      report.before.complete &&
        mgTagEqual(mgTagProjection(report.before), base),
      "Fresh full native baseline changed",
    );
    facade = mgMutationFacade(native, owned, new Set(), report.journal, fence);
    const api = facade.api,
      main = await api.getNodeByIdAsync(roots[0].id),
      review = await api.getNodeByIdAsync(roots[1].id),
      set = await api.getNodeByIdAsync(setPin.id),
      collection = await api.variables.getVariableCollectionByIdAsync(
        foundation.collection.id,
      );
    fence();
    const beforeMasters = mgTagMasterFields(
      set,
      source,
      foundation.collection,
      native.mixed,
    );
    mgTagVerifyMasterBindings(
      beforeMasters,
      base.assets,
      source,
      foundation.collection,
    );
    assert(
      set.componentPropertyDefinitions[setPin.labelProperty]?.type === "TEXT" &&
        set.componentPropertyDefinitions[setPin.labelProperty].defaultValue ===
          "Organization",
      "Existing owning Label source default differs",
    );
    const classified = await mgTagClassifyReview(
      review,
      set.children,
      family,
      setPin.labelProperty,
      collection,
      "repeat",
      fence,
    );
    const aux = mgTagSnapshotAuxiliary(
      classified.defaults,
      capture.nodeRow,
      capture.readErrors,
    );
    mgTagBrandHeadingGuard(review, collection);
    report.result = await renderer(api, {
      preflightOwned(owners) {
        assert(
          owners.get("family/tag")?.id === setPin.id,
          "Shared builder selected ownership differs",
        );
      },
      mainParent: () => main,
      reviewParent: () => review,
      preserveSetLayout(n, f) {
        assert(
          n.id === setPin.id && f.id === "tag",
          "Unselected layout refused",
        );
        return true;
      },
      placeSelected(built) {
        assert(
          built.size === 1 && built.get("tag")?.set.id === setPin.id,
          "Only existing Tag may rebuild",
        );
        return { globalLayout: false };
      },
    });
    checkpoint("Shared selected builder returned");
    assert(
      !report.result.errors?.length,
      "Shared builder failed: " + JSON.stringify(report.result.errors),
    );
    // The generic source specimens use FILL. Restore the finite accepted SPAN policy.
    for (const item of classified.sources) {
      await mgTagLoadCaseFonts(
        api,
        item.instance,
        collection,
        collection.modes.find((m) => m.name === "UNDRR"),
        fence,
      );
      item.instance.layoutSizingHorizontal = "HUG";
      item.instance.layoutSizingVertical = "HUG";
      item.instance.layoutAlign = "INHERIT";
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    fence();
    const masters = mgTagMasterFields(
      set,
      source,
      foundation.collection,
      native.mixed,
    );
    const final = await mgTagClassifyReview(
      review,
      set.children,
      family,
      setPin.labelProperty,
      collection,
      "repeat",
      fence,
    );
    const cases = await mgTagMatrixCases(
      [...final.sources, ...final.brandCases].map((n) => n.instance),
      set.children,
      family,
      setPin.labelProperty,
      collection,
      fence,
    );
    assert(
      mgTagEqual(
        mgTagSnapshotAuxiliary(
          final.defaults,
          capture.nodeRow,
          capture.readErrors,
        ),
        aux,
      ),
      "Auxiliary default specimens changed",
    );
    report.result.masterFields = masters;
    report.result.reviewCases = cases;
    checkpoint("Selected review policy verified");
    report.after = (await mgSelectedCapture(native, config)).report;
    assert(report.after.complete, "After capture incomplete");
    mgTagVerifyReview(report.after, cases, source, foundation.collection);
    mgTagVerifyMasterBindings(
      masters,
      report.after.assets,
      source,
      foundation.collection,
    );
    assert(
      mgTagEqual(mgTagProjection(report.after), base),
      "Recorded scene/assets/links/pages changed",
    );
    report.permanentCreatedNodeIds = [...facade.created].filter((id) =>
      report.after.beforeScene.some((n) => n.id === id),
    );
    assert(
      report.permanentCreatedNodeIds.length === 0,
      "Permanent construction is unsupported by selected rebuild",
    );
    report.complete = true;
  } catch (error) {
    report.errors.push(String(error));
    checkpoint("Selected rebuild interrupted");
    if (report.before && !report.after)
      try {
        report.after = (await mgSelectedCapture(native, config)).report;
      } catch (e) {
        report.errors.push("After capture failed: " + String(e));
      }
  } finally {
    if (prior !== undefined) {
      try {
        native.skipInvisibleInstanceChildren = prior;
        report.traversalRestored =
          native.skipInvisibleInstanceChildren === prior;
      } catch (error) {
        report.errors.push("Traversal restoration failed: " + String(error));
        report.traversalRestored = false;
      }
    } else report.traversalRestored = true;
    if (!report.traversalRestored) report.complete = false;
  }
  return report;
}
if (typeof module !== "undefined") module.exports = { mgSelectedTagRun };
