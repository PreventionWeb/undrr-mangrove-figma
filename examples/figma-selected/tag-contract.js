// Accepted static Tag profile. Changing this pin requires a separate source/native release.
const MG_TAG_ACCEPTED_SOURCE_SHA256 =
  "81bca4b741fb6288beaa2388916389e9bde8ed26be23e06f95ceb193508b3ad6";
const MG_SELECTED_PRIVATE_PLUGIN_ID = "mangrove-tokens-exploratory";
function mgSelectedPluginScope(api) {
  const observed = api.pluginId;
  return {
    expectedPluginId: MG_SELECTED_PRIVATE_PLUGIN_ID,
    observedPluginId: observed === undefined ? null : observed,
    observedUnavailable: observed === undefined,
  };
}
function mgSelectedAssertPluginScope(api) {
  const scope = mgSelectedPluginScope(api);
  mgTagAssert(
    scope.observedUnavailable ||
      scope.observedPluginId === scope.expectedPluginId,
    "Wrong private plugin namespace: " + String(scope.observedPluginId),
  );
  return scope;
}
const MG_TAG_TONES = ["Default", "Secondary", "Outline", "Accent", "Subtle"];
const MG_TAG_HELPERS = [
  "tag/min-height",
  "tag/min-width",
  "tag/border-width",
  "tag/accent-edge-width",
  "tag/transparent",
];
const MG_TAG_BRANDS = [
  "UNDRR",
  "DELTA Resilience",
  "IRP",
  "MCR2030",
  "PreventionWeb",
];
function mgTagStable(v) {
  if (Array.isArray(v)) return v.map(mgTagStable);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, mgTagStable(v[k])]),
    );
  return v;
}
function mgTagEqual(a, b) {
  return JSON.stringify(mgTagStable(a)) === JSON.stringify(mgTagStable(b));
}
function mgTagIdentity(o, k) {
  const a = o.markers?.shared?.[k] || "",
    b = o.markers?.private?.[k] || "";
  if (a && b && a !== b)
    throw Error("Conflicting source identity " + o.id + "/" + k);
  return a || b;
}
function mgTagProjection(r) {
  return {
    beforeScene: r.beforeScene,
    assets: r.assets,
    mainLinks: r.mainLinks,
    pages: r.pages,
    otherPageScenes: r.otherPageScenes,
  };
}
function mgTagAssert(ok, message) {
  if (!ok) throw Error(message);
}
function mgTagAllRows(r) {
  return [...r.beforeScene, ...r.otherPageScenes.flatMap((p) => p.scene)];
}
function mgTagValueEqual(actual, expected) {
  if (typeof actual === "number" && typeof expected === "number")
    return actual === expected || actual === Math.fround(expected);
  if (
    actual &&
    expected &&
    typeof actual === "object" &&
    typeof expected === "object"
  ) {
    const keys = Object.keys(expected);
    return (
      keys.length === Object.keys(actual).length &&
      keys.every((k) => mgTagValueEqual(actual[k], expected[k]))
    );
  }
  return actual === expected;
}
function mgTagSourceGuard(source) {
  const f = source.components?.families;
  mgTagAssert(
    f?.length === 1 && f[0].id === "tag" && f[0].variants.length === 5,
    "Exact Tag5 source family required",
  );
  mgTagAssert(
    mgTagEqual(
      f[0].variants.map((v) => v.properties.Tone),
      MG_TAG_TONES,
    ),
    "Exact Tag tone order required",
  );
  mgTagAssert(
    source.variables?.length === 29 &&
      source.styles?.text?.length === 1 &&
      source.styles.text[0].id === "component.tag.label" &&
      source.styles.effect.length === 0,
    "Exact29-variable/one-TEXT/no-effect Tag profile required",
  );
  mgTagAssert(
    mgTagEqual(
      source.modes.map((m) => m.name),
      MG_TAG_BRANDS,
    ),
    "Exact five source brands required",
  );
  const visit = (n) => {
    mgTagAssert(
      ["FRAME", "TEXT", "RECTANGLE"].includes(n.type),
      "Unsupported Tag recipe node " + n.type,
    );
    for (const child of n.children || []) visit(child);
  };
  for (const v of f[0].variants) visit(v.tree);
  return f[0];
}
function mgTagValidateVariables(source, assets, plan, operation) {
  const collection = assets.collections.find(
    (c) => c.id === plan.association.collectionId,
  );
  mgTagAssert(
    collection?.key === plan.association.collectionKey,
    "Exact target collection required",
  );
  mgTagAssert(
    mgTagEqual(
      collection.modes.map((m) => m.name),
      MG_TAG_BRANDS,
    ),
    "Exact canonical collection modes required",
  );
  const byId = new Map(assets.variables.map((v) => [v.id, v]));
  const missing = [],
    existing = [];
  for (const spec of source.variables) {
    const matches = assets.variables.filter(
      (v) =>
        v.variableCollectionId === collection.id &&
        (v.name === spec.name || mgTagIdentity(v, "mgId") === spec.id),
    );
    mgTagAssert(matches.length <= 1, "Ambiguous source role " + spec.name);
    if (!matches.length) {
      missing.push(spec);
      continue;
    }
    const actual = matches[0];
    mgTagAssert(
      actual.name === spec.name &&
        actual.resolvedType === spec.type &&
        mgTagIdentity(actual, "mgId") === spec.id,
      "Exact existing source role identity/type required " + spec.name,
    );
    for (const mode of source.modes) {
      const nativeMode = collection.modes.find((m) => m.name === mode.name);
      const value = spec.values[mode.id],
        nativeValue = actual.valuesByMode[nativeMode.modeId];
      if (value && typeof value === "object" && "alias" in value) {
        const target = byId.get(nativeValue?.id);
        const sourceTarget = source.variables.find(
          (v) => v.name === value.alias,
        );
        mgTagAssert(
          nativeValue?.type === "VARIABLE_ALIAS" &&
            target?.name === value.alias &&
            target.variableCollectionId === collection.id &&
            target.resolvedType === spec.type &&
            target.remote === false &&
            sourceTarget &&
            mgTagIdentity(target, "mgId") === sourceTarget.id,
          "Exact existing source alias topology differs " + spec.name,
        );
      } else
        mgTagAssert(
          mgTagValueEqual(nativeValue, value),
          "Existing source value differs " + spec.name + "/" + mode.name,
        );
    }
    existing.push(actual);
  }
  if (operation === "first")
    mgTagAssert(
      mgTagEqual(
        missing.map((v) => v.name).sort(),
        MG_TAG_HELPERS.slice().sort(),
      ) && existing.length === 24,
      "First Tag import requires only five new helper roles and24 existing",
    );
  else
    mgTagAssert(
      missing.length === 0 && existing.length === 29,
      "Repeat Tag29 foundations must already exist",
    );
  for (const v of missing) {
    mgTagAssert(
      (v.name === "tag/transparent"
        ? v.type === "COLOR"
        : v.type === "FLOAT") &&
        v.hiddenFromPublishing === false &&
        Object.keys(v.codeSyntax || {}).length === 1 &&
        typeof v.codeSyntax.WEB === "string",
      "Finite Tag helper metadata differs",
    );
    mgTagAssert(
      v.scopes.length === new Set(v.scopes).size && v.scopes.length > 0,
      "Unique source helper scopes required",
    );
    for (const value of Object.values(v.values))
      mgTagAssert(
        v.type === "FLOAT"
          ? Number.isFinite(value)
          : value &&
              Object.keys(value).sort().join(",") === "a,b,g,r" &&
              Object.values(value).every(Number.isFinite),
        "Literal new helper value required",
      );
  }
  return { collection, missing, existing };
}
function mgTagSetScopesEqual(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    new Set(a).size === a.length &&
    new Set(b).size === b.length &&
    a.every((k) => b.includes(k))
  );
}
function mgTagClosure(rows, roots) {
  const map = new Map(rows.map((n) => [n.id, n])),
    seen = new Set();
  function visit(id) {
    mgTagAssert(!seen.has(id), "Owned closure cycle");
    seen.add(id);
    const row = map.get(id);
    mgTagAssert(row, "Owned closure row missing");
    for (const child of row.childIds || []) {
      mgTagAssert(
        map.get(child)?.parentId === id,
        "Owned closure reciprocal parent differs",
      );
      visit(child);
    }
  }
  for (const root of roots) visit(root);
  return seen;
}
function mgTagVerifyReview(after, cases, source, collection) {
  mgTagAssert(
    cases.length === 25 &&
      new Set(cases.map((c) => c.brand + "/" + c.tone)).size === 25,
    "Exact25 tone-brand cases required",
  );
  const rows = new Map(after.beforeScene.map((n) => [n.id, n]));
  const variables = after.assets.variables;
  const byId = new Map(variables.map((v) => [v.id, v]));
  function resolve(alias, mode, seen = new Set()) {
    mgTagAssert(
      alias?.type === "VARIABLE_ALIAS" && !seen.has(alias.id),
      "Actual Tag variable alias invalid/cyclic",
    );
    seen.add(alias.id);
    const variable = byId.get(alias.id);
    mgTagAssert(variable, "Actual Tag bound variable missing");
    const value = variable.valuesByMode[mode];
    return value?.type === "VARIABLE_ALIAS"
      ? resolve(value, mode, seen)
      : value;
  }
  for (const c of cases) {
    const mode = collection.modes.find((m) => m.name === c.brand);
    const root = rows.get(c.instanceId);
    mgTagAssert(
      root?.type === "INSTANCE" &&
        root.explicitVariableModes[collection.id] === mode.modeId,
      "Actual review explicit mode differs",
    );
    const closure = mgTagClosure(after.beforeScene, [root.id]);
    const labels = [];
    for (const id of closure) {
      const n = rows.get(id);
      if (collection.id in (n.resolvedVariableModes || {}))
        mgTagAssert(
          n.resolvedVariableModes[collection.id] === mode.modeId,
          "Actual review descendant mode differs",
        );
      if (n.type === "TEXT") {
        mgTagAssert(
          n.hasMissingFont === false,
          "Actual review label missing font",
        );
        for (const segment of n.segments || []) {
          const alias = segment.boundVariables?.fontFamily;
          if (alias)
            mgTagAssert(
              segment.fontName.family === resolve(alias, mode.modeId),
              "Actual review font-family binding differs",
            );
        }
        if (n.componentPropertyReferences?.characters === c.labelProperty) {
          labels.push(n);
          mgTagAssert(
            n.characters === c.expectedLabel &&
              n.fontName.family === "Roboto Condensed" &&
              n.fontName.style === "Regular" &&
              n.fontSize === 14 &&
              n.lineHeight.unit === "PERCENT" &&
              n.lineHeight.value === 150,
            "Actual Tag Label source text/typography differs",
          );
        }
      }
      for (const field of ["fills", "strokes"])
        if (Array.isArray(n[field]))
          for (const paint of n[field]) {
            const alias = paint.boundVariables?.color;
            if (alias) {
              const expected = resolve(alias, mode.modeId);
              mgTagAssert(
                ["r", "g", "b"].every((k) =>
                  mgTagValueEqual(paint.color[k], expected[k]),
                ) && mgTagValueEqual(paint.opacity, expected.a),
                "Actual Tag " + field + " source color/effective alpha differs",
              );
            }
          }
      for (const [field, alias] of Object.entries(n.boundVariables || {})) {
        if (Array.isArray(alias)) continue;
        if (typeof n[field] === "number")
          mgTagAssert(
            mgTagValueEqual(n[field], resolve(alias, mode.modeId)),
            "Actual Tag numeric binding differs " + field,
          );
      }
    }
    mgTagAssert(
      labels.length === 1 &&
        root.componentProperties[c.labelProperty].value === c.expectedLabel,
      "Actual owning Label must reach one linked text",
    );
    const main = after.mainLinks.find((l) => l.instanceId === root.id)?.main;
    mgTagAssert(
      main?.key === c.mainKey && main.remote === false,
      "Actual local review main link differs",
    );
  }
}
function mgTagResolveSource(source, name, modeId, seen = new Set()) {
  mgTagAssert(!seen.has(name), "Source role cycle");
  seen.add(name);
  const v = source.variables.find((v) => v.name === name);
  mgTagAssert(v, "Source role missing " + name);
  const value = v.values[modeId];
  return value && typeof value === "object" && "alias" in value
    ? mgTagResolveSource(source, value.alias, modeId, seen)
    : value;
}
function mgTagMasterCopy(v, mixed) {
  if (typeof v === "symbol") {
    mgTagAssert(v === mixed, "Unexpected native master symbol");
    return { $mixed: true };
  }
  if (v === undefined) return { $undefined: true };
  if (Array.isArray(v)) return v.map((x) => mgTagMasterCopy(x, mixed));
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, mgTagMasterCopy(x, mixed)]),
    );
  return v;
}
function mgTagMasterFields(set, source, collection, mixed) {
  const fields = [
    "name",
    "x",
    "y",
    "width",
    "height",
    "minWidth",
    "minHeight",
    "layoutMode",
    "layoutSizingHorizontal",
    "layoutSizingVertical",
    "primaryAxisSizingMode",
    "counterAxisSizingMode",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "cornerRadius",
    "strokeWeight",
    "strokeTopWeight",
    "strokeRightWeight",
    "strokeBottomWeight",
    "strokeLeftWeight",
    "clipsContent",
    "fills",
    "strokes",
    "boundVariables",
    "resolvedVariableModes",
  ];
  const rows = [];
  const mode = source.modes.find((m) => m.name === "UNDRR").id;
  for (const main of set.children) {
    const spec = source.components.families[0].variants.find(
      (v) => v.properties.Tone === main.variantProperties.Tone,
    );
    mgTagAssert(spec, "Exact master tone missing");
    const row = {
      id: main.id,
      key: main.key,
      tone: main.variantProperties.Tone,
    };
    mgTagAssert(
      main.resolvedVariableModes[collection.id] ===
        collection.modes.find((m) => m.name === "UNDRR").modeId,
      "Actual new master canonical UNDRR mode differs",
    );
    for (const key of fields) row[key] = mgTagMasterCopy(main[key], mixed);
    mgTagAssert(
      row.layoutMode === "HORIZONTAL" &&
        row.layoutSizingHorizontal === "HUG" &&
        row.layoutSizingVertical === "HUG" &&
        row.primaryAxisSizingMode === "AUTO" &&
        row.counterAxisSizingMode === "AUTO" &&
        row.clipsContent === false,
      "Actual Tag master source intrinsic HUG layout differs",
    );
    mgTagAssert(
      row.minWidth === 24 &&
        row.minHeight === 28 &&
        row.width >= 24 &&
        row.height === 28,
      "Actual static source Tag dimensions differ",
    );
    for (const [field, role] of Object.entries(spec.tree.bindings)) {
      const expected = mgTagResolveSource(source, role, mode);
      if (field === "strokeWeight" && row.tone === "Accent")
        mgTagAssert(
          mgTagEqual(row[field], { $mixed: true }),
          "Actual Accent aggregate strokeWeight must retain native mixed",
        );
      else
        mgTagAssert(
          mgTagValueEqual(row[field], expected),
          "Actual Tag master bound field differs " + field,
        );
    }
    for (const edge of [
      "strokeTopWeight",
      "strokeRightWeight",
      "strokeBottomWeight",
      "strokeLeftWeight",
    ])
      mgTagAssert(
        row[edge] ===
          (row.tone === "Accent" && edge === "strokeLeftWeight" ? 4 : 1),
        "Actual source Accent4/other edge1 differs",
      );
    for (const [field, role] of [
      ["fills", spec.tree.fill],
      ["strokes", spec.tree.stroke],
    ]) {
      if (role === null) {
        mgTagAssert(
          row[field].length === 0,
          "Source empty master paint differs",
        );
        continue;
      }
      const expected = mgTagResolveSource(source, role, mode);
      mgTagAssert(
        row[field].length === 1,
        "Exact one source master paint required",
      );
      const paint = row[field][0];
      mgTagAssert(
        paint.type === "SOLID" &&
          paint.visible === true &&
          ["r", "g", "b"].every((k) =>
            mgTagValueEqual(paint.color[k], expected[k]),
          ) &&
          mgTagValueEqual(paint.opacity, expected.a),
        "Actual source master paint RGB/effective alpha differs",
      );
    }
    mgTagAssert(
      main.children.length === 1 && main.children[0].type === "TEXT",
      "Exact source Tag label-only anatomy required",
    );
    const text = main.children[0];
    row.label = {
      id: text.id,
      name: text.name,
      characters: text.characters,
      textDecoration: text.textDecoration,
      textWrapStyle: text.textWrapStyle,
      fontName: text.fontName,
      fontSize: text.fontSize,
      lineHeight: text.lineHeight,
      componentPropertyReferences: text.componentPropertyReferences,
      hasMissingFont: text.hasMissingFont,
      width: text.width,
      height: text.height,
    };
    mgTagAssert(
      text.characters === spec.tree.children[0].characters &&
        text.textDecoration === "NONE" &&
        text.textWrapStyle === "AUTO" &&
        text.fontName.family === "Roboto Condensed" &&
        text.fontName.style === "Regular" &&
        text.fontSize === 14 &&
        text.lineHeight.unit === "PERCENT" &&
        text.lineHeight.value === 150 &&
        text.hasMissingFont === false,
      "Actual source master label NONE/AUTO/font differs",
    );
    rows.push(row);
  }
  return rows;
}

function mgTagVerifyMasterBindings(masterFields, assets, source, collection) {
  const variables = new Map(assets.variables.map((v) => [v.id, v]));
  for (const row of masterFields) {
    const spec = source.components.families[0].variants.find(
      (v) => v.properties.Tone === row.tone,
    );
    const bindings = {
      minWidth: spec.tree.layout.minWidth,
      minHeight: spec.tree.layout.minHeight,
    };
    for (const [field, role] of Object.entries(spec.tree.bindings)) {
      const fields =
        field === "strokeWeight"
          ? [
              "strokeTopWeight",
              "strokeRightWeight",
              "strokeBottomWeight",
              "strokeLeftWeight",
            ]
          : field === "cornerRadius"
            ? [
                "topLeftRadius",
                "topRightRadius",
                "bottomLeftRadius",
                "bottomRightRadius",
              ]
            : [field];
      for (const name of fields) bindings[name] = role;
    }
    for (const [field, role] of Object.entries(bindings)) {
      const alias = row.boundVariables[field],
        actual = variables.get(alias?.id),
        expected = source.variables.find((v) => v.name === role);
      mgTagAssert(
        alias?.type === "VARIABLE_ALIAS" &&
          actual?.variableCollectionId === collection.id &&
          actual.name === role &&
          actual.resolvedType === expected.type &&
          actual.remote === false &&
          mgTagIdentity(actual, "mgId") === expected.id,
        "Actual native expanded master binding differs " +
          row.tone +
          "/" +
          field,
      );
    }
  }
}

if (typeof module !== "undefined")
  module.exports = {
    MG_TAG_ACCEPTED_SOURCE_SHA256,
    MG_SELECTED_PRIVATE_PLUGIN_ID,
    mgSelectedPluginScope,
    mgSelectedAssertPluginScope,
    mgTagProjection,
    mgTagEqual,
    mgTagIdentity,
    mgTagClosure,
    mgTagSourceGuard,
    mgTagValidateVariables,
    mgTagMasterFields,
    mgTagVerifyReview,
    mgTagVerifyMasterBindings,
  };
