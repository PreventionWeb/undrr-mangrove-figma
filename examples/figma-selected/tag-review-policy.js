/* Offline review-policy draft. Caller supplies reviewed full native node-row capture. */
function mgTagPolicyIdentity(n) {
  const a = n.getPluginData("mgKitId"),
    b = n.getSharedPluginData("orgundrrmangrove", "mgKitId");
  mgTagAssert(!a || !b || a === b, "Conflicting selected review identity");
  return b || a;
}
function mgTagPolicyNodes(root) {
  const out = [];
  function walk(n) {
    out.push(n);
    for (const c of n.children || []) walk(c);
  }
  walk(root);
  return out;
}
function mgTagSnapshotAuxiliary(items, nodeRow, readErrors) {
  const rows = items.flatMap((item) =>
    mgTagPolicyNodes(item.instance.parent).map((n) =>
      JSON.parse(JSON.stringify(nodeRow(n))),
    ),
  );
  mgTagAssert(
    readErrors().length === 0 &&
      !JSON.stringify(rows).includes('\"$readError\"'),
    "Auxiliary full native row read failed",
  );
  return rows;
}
async function mgTagClassifyReview(
  review,
  members,
  family,
  labelKey,
  collection,
  operation,
  fence,
) {
  const instances = mgTagPolicyNodes(review).filter(
      (n) => n.type === "INSTANCE",
    ),
    expected = new Map(),
    defaults = [],
    sources = [],
    brandCases = [];
  for (const v of family.variants)
    expected.set(
      "integration/card-cta/review/tag/specimen/" + v.id + "/instance",
      {
        kind: "defaults",
        tone: v.properties.Tone,
        label: "Organization",
        name: v.name,
        recipe: v,
      },
    );
  for (const s of family.review.specimens)
    expected.set(
      "integration/card-cta/review/tag/specimen/" + s.id + "/instance",
      {
        kind: "sources",
        tone: s.variant.Tone,
        label: s.properties.Label,
        name: s.name,
        recipe: family.variants.find(
          (v) => v.properties.Tone === s.variant.Tone,
        ),
      },
    );
  if (operation === "repeat")
    for (const mode of collection.modes.filter((m) => m.name !== "UNDRR"))
      for (const v of family.variants) {
        const s = family.review.specimens.find(
          (s) => s.variant.Tone === v.properties.Tone,
        );
        expected.set(
          "integration/tag/review-case/" + mode.name + "/" + v.properties.Tone,
          {
            kind: "brandCases",
            tone: v.properties.Tone,
            label: s.properties.Label,
            name: "Tag " + v.properties.Tone + " / " + mode.name,
            brand: mode.name,
            recipe: v,
          },
        );
      }
  mgTagAssert(
    instances.length === expected.size,
    "Exact initial10/repeat30 review instances required",
  );
  for (const n of instances) {
    fence();
    const marker = mgTagPolicyIdentity(n),
      spec = expected.get(marker);
    mgTagAssert(spec, "Unexpected/duplicate selected review marker " + marker);
    const main = await n.getMainComponentAsync();
    fence();
    const owner = members.find((m) => m.variantProperties.Tone === spec.tone);
    mgTagAssert(
      main &&
        /^[a-f0-9]{40}$/.test(main.key) &&
        main.id === owner?.id &&
        main.key === owner.key,
      "Selected review main ID/key differs",
    );
    mgTagAssert(
      n.name === spec.name &&
        n.componentProperties[labelKey]?.type === "TEXT" &&
        n.componentProperties[labelKey].value === spec.label,
      "Selected review name/owning Label differs",
    );
    const labels = mgTagPolicyNodes(n).filter(
      (t) =>
        t.type === "TEXT" &&
        t.componentPropertyReferences?.characters === labelKey,
    );
    mgTagAssert(
      labels.length === 1 &&
        labels[0].characters === spec.label &&
        labels[0].hasMissingFont !== true,
      "Selected review linked Label/font differs",
    );
    if (spec.kind === "defaults" || spec.kind === "sources") {
      mgTagAssert(
        mgTagPolicyIdentity(n.parent) === marker.replace("/instance", "") &&
          n.parent.name === spec.name &&
          n.parent.layoutMode === "VERTICAL",
        "Selected source/default wrapper differs",
      );
    } else
      mgTagAssert(
        n.parent.id === review.id,
        "Brand case must be direct owned review child",
      );
    if (spec.kind === "defaults")
      mgTagAssert(
        n.layoutSizingHorizontal === "HUG" && n.layoutSizingVertical === "HUG",
        "Auxiliary default HUG differs",
      );
    const item = { instance: n, ...spec };
    ({ defaults, sources, brandCases })[spec.kind].push(item);
    expected.delete(marker);
  }
  mgTagAssert(expected.size === 0, "Missing selected review markers");
  return { defaults, sources, brandCases, all: instances };
}
async function mgTagMatrixCases(
  cases,
  members,
  family,
  labelKey,
  collection,
  fence,
) {
  const result = [],
    pairs = new Set();
  for (const n of cases) {
    const main = await n.getMainComponentAsync();
    fence();
    const member = members.find(
      (m) => m.id === main?.id && m.key === main?.key,
    );
    mgTagAssert(member, "Matrix genuine main differs");
    const tone = member.variantProperties.Tone,
      mode = collection.modes.find(
        (m) => m.modeId === n.explicitVariableModes[collection.id],
      );
    mgTagAssert(mode, "Matrix explicit brand absent");
    const pair = mode.name + "|" + tone;
    mgTagAssert(!pairs.has(pair), "Duplicate matrix pair");
    pairs.add(pair);
    const specimen = family.review.specimens.find(
      (s) => s.variant.Tone === tone,
    );
    mgTagAssert(
      n.layoutSizingHorizontal === "HUG" &&
        n.layoutSizingVertical === "HUG" &&
        n.layoutAlign === "INHERIT" &&
        n.componentProperties[labelKey].value === specimen.properties.Label,
      "Finite matrix HUG/Label differs",
    );
    for (const child of mgTagPolicyNodes(n)) {
      mgTagAssert(
        !child.resolvedVariableModes ||
          !(collection.id in child.resolvedVariableModes) ||
          child.resolvedVariableModes[collection.id] === mode.modeId,
        "Matrix descendant mode differs",
      );
      if (child.type === "TEXT")
        mgTagAssert(child.hasMissingFont !== true, "Matrix missing font");
    }
    result.push({
      instanceId: n.id,
      brand: mode.name,
      tone,
      labelProperty: labelKey,
      expectedLabel: specimen.properties.Label,
      mainKey: member.key,
    });
  }
  mgTagAssert(
    result.length === 25 && pairs.size === 25,
    "Exact25 unique source matrix required",
  );
  return result;
}
async function mgTagLoadCaseFonts(api, node, collection, mode, fence) {
  mgTagAssert(mode, "Exact UNDRR/brand mode required");
  const available = await api.listAvailableFontsAsync();
  fence();
  async function variable(id, seen = new Set()) {
    mgTagAssert(!seen.has(id), "Font alias cycle");
    seen.add(id);
    const v = await api.variables.getVariableByIdAsync(id);
    fence();
    mgTagAssert(
      v &&
        v.resolvedType === "STRING" &&
        v.variableCollectionId === collection.id,
      "Actual selected font variable differs",
    );
    const value = v.valuesByMode[mode.modeId];
    if (value?.type === "VARIABLE_ALIAS") return variable(value.id, seen);
    mgTagAssert(
      typeof value === "string" && value,
      "Actual font terminal missing",
    );
    return value;
  }
  function aliases(x, out = []) {
    if (Array.isArray(x)) for (const y of x) aliases(y, out);
    else if (x && typeof x === "object") {
      if (x.type === "VARIABLE_ALIAS") out.push(x.id);
      else for (const y of Object.values(x)) aliases(y, out);
    }
    return out;
  }
  for (const text of mgTagPolicyNodes(node).filter((n) => n.type === "TEXT"))
    for (const s of text.getStyledTextSegments([
      "fontName",
      "boundVariables",
    ])) {
      const faces = [s.fontName];
      for (const id of aliases(s.boundVariables?.fontFamily))
        faces.push({ ...s.fontName, family: await variable(id) });
      for (const f of faces) {
        mgTagAssert(
          available.some(
            (a) =>
              a.fontName.family === f.family && a.fontName.style === f.style,
          ),
          "Actual selected font face unavailable",
        );
        await api.loadFontAsync(f);
        fence();
      }
    }
}
if (typeof module !== "undefined")
  module.exports = {
    mgTagClassifyReview,
    mgTagMatrixCases,
    mgTagSnapshotAuxiliary,
    mgTagLoadCaseFonts,
  };
function mgTagBrandHeadingGuard(review, collection) {
  const expected = collection.modes
      .filter((m) => m.name !== "UNDRR")
      .map((m) => m.name),
    headings = review.children.filter((n) =>
      mgTagPolicyIdentity(n).startsWith("integration/tag/brand-heading/"),
    );
  mgTagAssert(
    headings.length === 4,
    "Exactlyfour existing brand headings required",
  );
  for (const [i, brand] of expected.entries()) {
    const n = headings[i];
    mgTagAssert(
      n.type === "TEXT" &&
        n.name === "Tag / " + brand &&
        n.characters === brand &&
        mgTagPolicyIdentity(n) === "integration/tag/brand-heading/" + brand &&
        n.layoutSizingHorizontal === "FILL" &&
        n.layoutSizingVertical === "HUG",
      "Exact caption-derived brand heading differs",
    );
  }
  return headings;
}
if (typeof module !== "undefined")
  module.exports.mgTagBrandHeadingGuard = mgTagBrandHeadingGuard;
