async function mgSelectedCapture(figma, plan) {
  function sha256(bytes) {
    if (!(bytes instanceof Uint8Array))
      throw Error("SHA256 requires Uint8Array");
    const K = [],
      initial = [];
    for (let p = 2; K.length < 64; p++) {
      let prime = true;
      for (let d = 2; d * d <= p; d++)
        if (p % d === 0) {
          prime = false;
          break;
        }
      if (!prime) continue;
      if (initial.length < 8)
        initial.push(((Math.sqrt(p) % 1) * 4294967296) >>> 0);
      K.push(((Math.cbrt(p) % 1) * 4294967296) >>> 0);
    }
    const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
    padded.set(bytes);
    padded[bytes.length] = 128;
    const bits = bytes.length * 8,
      view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296), false);
    view.setUint32(padded.length - 4, bits >>> 0, false);
    const h = initial.slice(),
      w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(offset + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const x = w[t - 15],
          y = w[t - 2],
          s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3),
          s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, z] = h;
      for (let t = 0; t < 64; t++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25),
          ch = (e & f) ^ (~e & g),
          t1 = (z + s1 + ch + K[t] + w[t]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22),
          maj = (a & b) ^ (a & c) ^ (b & c),
          t2 = (s0 + maj) >>> 0;
        z = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
      }
      const v = [a, b, c, d, e, f, g, z];
      for (let t = 0; t < 8; t++) h[t] = (h[t] + v[t]) >>> 0;
    }
    return h.map((v) => v.toString(16).padStart(8, "0")).join("");
  }
  const TARGET = plan.target;
  const EXPECTED_SELECTED_MEMBERS = plan.setMembers;
  const NS = "orgundrrmangrove";
  const MARKERS = [
    "mgKitId",
    "mgId",
    "mgStyleId",
    "mgKitProperties",
    "mgMaintenancePolicy",
  ];
  const NODE_FIELDS = [
    "name",
    "visible",
    "opacity",
    "locked",
    "rotation",
    "x",
    "y",
    "width",
    "height",
    "relativeTransform",
    "absoluteTransform",
    "absoluteBoundingBox",
    "absoluteRenderBounds",
    "layoutMode",
    "layoutSizingHorizontal",
    "layoutSizingVertical",
    "primaryAxisSizingMode",
    "counterAxisSizingMode",
    "layoutGrow",
    "layoutAlign",
    "layoutPositioning",
    "constraints",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "itemSpacing",
    "counterAxisSpacing",
    "layoutWrap",
    "primaryAxisAlignItems",
    "counterAxisAlignItems",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "paddingBottom",
    "clipsContent",
    "fills",
    "strokes",
    "strokeWeight",
    "strokeAlign",
    "strokesIncludedInLayout",
    "cornerRadius",
    "topLeftRadius",
    "topRightRadius",
    "bottomLeftRadius",
    "bottomRightRadius",
    "effects",
    "effectStyleId",
    "fillStyleId",
    "strokeStyleId",
    "boundVariables",
    "explicitVariableModes",
    "resolvedVariableModes",
    "componentPropertyReferences",
    "blendMode",
    "isMask",
    "maskType",
    "exportSettings",
    "reactions",
  ];
  const TEXT_FIELDS = [
    "characters",
    "fontName",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "textDecoration",
    "textDecorationOffset",
    "textDecorationThickness",
    "textStyleId",
    "textCase",
    "textAlignHorizontal",
    "textAlignVertical",
    "textAutoResize",
    "textTruncation",
    "maxLines",
    "paragraphSpacing",
    "paragraphIndent",
    "listSpacing",
    "hasMissingFont",
    "textWrapStyle",
    "hyperlink",
  ];
  const SEGMENT_FIELDS = [
    "fontName",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "textDecoration",
    "textStyleId",
    "textCase",
    "fills",
    "hyperlink",
    "boundVariables",
  ];
  const STYLE_FIELDS = [
    "id",
    "key",
    "type",
    "name",
    "description",
    "remote",
    "fontName",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "textDecoration",
    "textDecorationOffset",
    "textDecorationThickness",
    "textWrapStyle",
    "textCase",
    "paragraphSpacing",
    "paragraphIndent",
    "listSpacing",
    "boundVariables",
    "effects",
    "paints",
    "layoutGrids",
  ];
  let mgCanonicalR4Report,
    mgCanonicalR4Busy = false,
    associationConfirmed = plan.freshAssociationConfirmed === true;
  const ASSOCIATION = plan.association;
  function descendants() {
    const out = [];
    function walk(n) {
      out.push(n);
      if ("children" in n) for (const c of n.children) walk(c);
    }
    walk(figma.currentPage);
    return out;
  }
  function normalize(v) {
    if (v === figma.mixed) return { $mixed: true };
    if (typeof v === "symbol") throw Error("Unexpected symbol");
    if (v === undefined) return { $undefined: true };
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(normalize);
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
    return out;
  }
  function err(context, e) {
    mgCanonicalR4Report.captureErrors.push({ context, error: String(e) });
  }
  function read(o, fields) {
    const out = {};
    for (const k of fields) {
      try {
        if (k in o) out[k] = normalize(o[k]);
      } catch (e) {
        err((o.id || o.name || "object") + "." + k, e);
        out[k] = { $readError: String(e) };
      }
    }
    return out;
  }
  function markers(o) {
    const out = { private: {}, shared: {}, privateKeys: [], sharedKeys: [] };
    try {
      out.privateKeys = o.getPluginDataKeys().slice().sort();
      out.sharedKeys = o.getSharedPluginDataKeys(NS).slice().sort();
    } catch (e) {
      err((o.id || "asset") + ".markerKeys", e);
    }
    const keys = Array.from(
      new Set([...MARKERS, ...out.privateKeys, ...out.sharedKeys]),
    ).sort();
    for (const k of keys) {
      try {
        out.private[k] = o.getPluginData(k);
        out.shared[k] = o.getSharedPluginData(NS, k);
      } catch (e) {
        err((o.id || "asset") + ".marker." + k, e);
      }
    }
    return out;
  }
  function utf8(s) {
    const a = [];
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
        const n = s.charCodeAt(i + 1);
        if (n >= 0xdc00 && n <= 0xdfff) {
          c = 0x10000 + ((c - 0xd800) << 10) + (n - 0xdc00);
          i++;
        } else c = 0xfffd;
      } else if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
      if (c < 128) a.push(c);
      else if (c < 2048) a.push(192 | (c >> 6), 128 | (c & 63));
      else if (c < 65536)
        a.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
      else
        a.push(
          240 | (c >> 18),
          128 | ((c >> 12) & 63),
          128 | ((c >> 6) & 63),
          128 | (c & 63),
        );
    }
    return new Uint8Array(a);
  }
  // Bounded SHA256 serializer. Byte stream equals JSON.stringify(normalize(value)).
  function mgStreamingDigest(value, mixed) {
    const K = [],
      h = [];
    for (let p = 2; K.length < 64; p++) {
      let prime = true;
      for (let d = 2; d * d <= p; d++)
        if (p % d === 0) {
          prime = false;
          break;
        }
      if (prime) {
        if (h.length < 8) h.push(((Math.sqrt(p) % 1) * 4294967296) >>> 0);
        K.push(((Math.cbrt(p) % 1) * 4294967296) >>> 0);
      }
    }
    const block = new Uint8Array(64),
      w = new Uint32Array(64);
    let used = 0,
      total = 0;
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    function transform() {
      for (let t = 0; t < 16; t++)
        w[t] =
          ((block[t * 4] << 24) |
            (block[t * 4 + 1] << 16) |
            (block[t * 4 + 2] << 8) |
            block[t * 4 + 3]) >>>
          0;
      for (let t = 16; t < 64; t++) {
        const x = w[t - 15],
          y = w[t - 2];
        w[t] =
          (w[t - 16] +
            (rr(x, 7) ^ rr(x, 18) ^ (x >>> 3)) +
            w[t - 7] +
            (rr(y, 17) ^ rr(y, 19) ^ (y >>> 10))) >>>
          0;
      }
      let [a, b, c, d, e, f, g, z] = h;
      for (let t = 0; t < 64; t++) {
        const q =
            (z +
              (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) +
              ((e & f) ^ (~e & g)) +
              K[t] +
              w[t]) >>>
            0,
          u =
            ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) +
              ((a & b) ^ (a & c) ^ (b & c))) >>>
            0;
        z = g;
        g = f;
        f = e;
        e = (d + q) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (q + u) >>> 0;
      }
      const v = [a, b, c, d, e, f, g, z];
      for (let t = 0; t < 8; t++) h[t] = (h[t] + v[t]) >>> 0;
    }
    function byte(n) {
      block[used++] = n;
      if (used === 64) {
        transform();
        used = 0;
      }
      total++;
    }
    function text(s) {
      for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
          const n = s.charCodeAt(i + 1);
          if (n >= 0xdc00 && n <= 0xdfff) {
            c = 0x10000 + ((c - 0xd800) << 10) + (n - 0xdc00);
            i++;
          } else c = 0xfffd;
        } else if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
        if (c < 128) byte(c);
        else if (c < 2048) {
          byte(192 | (c >> 6));
          byte(128 | (c & 63));
        } else if (c < 65536) {
          byte(224 | (c >> 12));
          byte(128 | ((c >> 6) & 63));
          byte(128 | (c & 63));
        } else {
          byte(240 | (c >> 18));
          byte(128 | ((c >> 12) & 63));
          byte(128 | ((c >> 6) & 63));
          byte(128 | (c & 63));
        }
      }
    }
    function visit(v) {
      if (v === mixed) {
        text('{"$mixed":true}');
        return;
      }
      if (typeof v === "symbol") throw Error("Unexpected symbol");
      if (v === undefined) {
        text('{"$undefined":true}');
        return;
      }
      if (v === null || typeof v !== "object") {
        const s = JSON.stringify(v);
        if (s === undefined) throw Error("Nonserializable primitive");
        text(s);
        return;
      }
      if (Array.isArray(v)) {
        text("[");
        for (let i = 0; i < v.length; i++) {
          if (i) text(",");
          if (Object.prototype.hasOwnProperty.call(v, i)) visit(v[i]);
          else text("null");
        }
        text("]");
        return;
      }
      text("{");
      const isIndex = (k) =>
        /^(0|[1-9][0-9]*)$/.test(k) &&
        Number(k) < 4294967295 &&
        String(Number(k)) === k;
      const keys = Object.keys(v).sort((a, b) =>
        isIndex(a) && isIndex(b)
          ? Number(a) - Number(b)
          : isIndex(a)
            ? -1
            : isIndex(b)
              ? 1
              : a < b
                ? -1
                : a > b
                  ? 1
                  : 0,
      );
      for (let i = 0; i < keys.length; i++) {
        if (i) text(",");
        text(JSON.stringify(keys[i]));
        text(":");
        visit(v[keys[i]]);
      }
      text("}");
    }
    visit(value);
    const bits = total * 8;
    byte(128);
    while (used !== 56) byte(0);
    const high = Math.floor(bits / 4294967296),
      low = bits >>> 0;
    for (let i = 3; i >= 0; i--) byte((high >>> (i * 8)) & 255);
    for (let i = 3; i >= 0; i--) byte((low >>> (i * 8)) & 255);
    return h.map((x) => x.toString(16).padStart(8, "0")).join("");
  }

  function digest(o) {
    return mgStreamingDigest(o, figma.mixed);
  }
  function mgCanonicalR4Stage(stage, details) {
    if (typeof plan.onCaptureProgress === "function")
      try {
        plan.onCaptureProgress({
          stage,
          elapsedMs: Date.now() - mgCanonicalR4Started,
          ...details,
        });
      } catch (e) {
        console.error("Capture progress callback failed", String(e));
      }
  }
  let mgCanonicalR4Started = 0,
    mgCanonicalR4Stop = false,
    mgCanonicalR4CloseAfterStop = false;
  async function mgCanonicalR4Yield() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fence();
    if (mgCanonicalR4Stop)
      throw Error("Read-only capture stopped at a safe yield");
  }
  function fence() {
    mgSelectedAssertPluginScope(figma);
    if (
      figma.currentPage.id !== TARGET.pageId ||
      figma.currentPage.type !== "PAGE"
    )
      throw Error("Wrong current page");
    if (figma.fileKey !== undefined && figma.fileKey !== TARGET.fileKey)
      throw Error("Wrong fileKey: " + String(figma.fileKey));
    if (figma.fileKey === undefined && !associationConfirmed)
      throw Error(
        "Native fileKey unavailable; fresh association checkbox required",
      );
  }
  async function mgCanonicalR4ExactTargetGuard(phase) {
    fence();
    const pins = plan.setAnchors;
    if (!Array.isArray(pins) || !pins.length)
      throw Error("Exact set anchors required");
    const result = [];
    for (const pin of pins) {
      const n = await figma.getNodeByIdAsync(pin.id);
      fence();
      let owner = n;
      while (owner && owner.type !== "PAGE") owner = owner.parent;
      if (
        !n ||
        n.type !== "COMPONENT_SET" ||
        n.key !== pin.key ||
        owner?.id !== TARGET.pageId
      )
        throw Error("Exact set key/page differs " + pin.id);
      if (
        pin.members &&
        JSON.stringify(
          n.children.map((c) => ({ id: c.id, key: c.key, type: c.type })),
        ) !== JSON.stringify(pin.members)
      )
        throw Error("Exact member keys/order differ");
      result.push({ id: n.id, key: n.key });
    }
    return { phase, sets: result };
  }

  function nodeRow(n) {
    const r = {
      id: n.id,
      type: n.type,
      parentId: n.parent ? n.parent.id : null,
      markers: markers(n),
      ...read(n, NODE_FIELDS),
    };
    if ("children" in n) r.childIds = n.children.map((x) => x.id);
    if (n.type === "TEXT") {
      Object.assign(r, read(n, TEXT_FIELDS));
      try {
        r.segments = normalize(n.getStyledTextSegments(SEGMENT_FIELDS));
      } catch (e) {
        err(n.id + ".segments", e);
      }
    }
    if (n.type === "COMPONENT" || n.type === "COMPONENT_SET") {
      Object.assign(
        r,
        read(n, ["key", "remote", "description", "variantProperties"]),
      );
    }
    if (
      n.type === "COMPONENT_SET" ||
      (n.type === "COMPONENT" &&
        (!n.parent || n.parent.type !== "COMPONENT_SET"))
    )
      Object.assign(r, read(n, ["componentPropertyDefinitions"]));
    if (n.type === "INSTANCE")
      Object.assign(
        r,
        read(n, ["componentProperties", "variantProperties", "overrides"]),
      );
    if (n.type === "VECTOR")
      Object.assign(r, read(n, ["vectorPaths", "vectorNetwork"]));
    return r;
  }
  async function scene(phase, root = figma.currentPage) {
    const rows = [],
      stack = [root],
      seenHeavy = new Set();
    mgCanonicalR4Stage((phase || "scene") + ": node field capture begins");
    await mgCanonicalR4Yield();
    while (stack.length) {
      const n = stack.pop();
      if (n.type === "TEXT" || n.type === "INSTANCE") {
        if (!seenHeavy.has(n.type)) {
          seenHeavy.add(n.type);
          mgCanonicalR4Stage(
            (phase || "scene") + ": before first " + n.type + " field capture",
            { nodeId: n.id, nodes: rows.length },
          );
          await mgCanonicalR4Yield();
        }
      }
      rows.push(nodeRow(n));
      if ("children" in n) {
        const children = n.children;
        for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
      }
      if (rows.length % 50 === 0) {
        mgCanonicalR4Stage((phase || "scene") + ": node capture progress", {
          nodes: rows.length,
        });
        await mgCanonicalR4Yield();
      }
    }
    mgCanonicalR4Stage((phase || "scene") + ": node field capture finished", {
      nodes: rows.length,
    });
    await mgCanonicalR4Yield();
    return rows;
  }
  async function awaited(label, fn) {
    fence();
    const main = label.startsWith("main ");
    const emit =
      !main ||
      mgCanonicalR4Report.awaits.filter((x) => x.startsWith("main ")).length %
        50 ===
        0;
    if (emit) mgCanonicalR4Stage("await begins: " + label);
    await mgCanonicalR4Yield();
    const value = await fn();
    fence();
    if (mgCanonicalR4Stop)
      throw Error("Read-only capture stopped after await " + label);
    mgCanonicalR4Report.awaits.push(label);
    if (emit) mgCanonicalR4Stage("await returned: " + label);
    return value;
  }

  async function assets() {
    const collections = await awaited("collections", () =>
      figma.variables.getLocalVariableCollectionsAsync(),
    );
    if (
      !collections.some(
        (c) =>
          c.id === ASSOCIATION.collectionId &&
          c.key === ASSOCIATION.collectionKey,
      )
    )
      throw Error("Association collection-key guard differs");
    const variables = await awaited("variables", () =>
      figma.variables.getLocalVariablesAsync(),
    );
    const text = await awaited("text styles", () =>
      figma.getLocalTextStylesAsync(),
    );
    const effect = await awaited("effect styles", () =>
      figma.getLocalEffectStylesAsync(),
    );
    const paint = await awaited("paint styles", () =>
      figma.getLocalPaintStylesAsync(),
    );
    const grid = await awaited("grid styles", () =>
      figma.getLocalGridStylesAsync(),
    );
    return {
      collections: collections.map((o) => ({
        ...read(o, [
          "id",
          "key",
          "name",
          "remote",
          "hiddenFromPublishing",
          "modes",
          "defaultModeId",
          "variableIds",
        ]),
        markers: markers(o),
      })),
      variables: variables.map((o) => ({
        ...read(o, [
          "id",
          "key",
          "name",
          "description",
          "remote",
          "resolvedType",
          "variableCollectionId",
          "valuesByMode",
          "scopes",
          "hiddenFromPublishing",
          "codeSyntax",
        ]),
        markers: markers(o),
      })),
      styles: [...text, ...effect, ...paint, ...grid].map((o) => ({
        ...read(o, STYLE_FIELDS),
        markers: markers(o),
      })),
    };
  }
  function identityChecks(rows) {
    const duplicates = [],
      conflicts = [],
      owners = {};
    for (const r of rows) {
      for (const k of MARKERS) {
        const a = r.markers.private[k],
          b = r.markers.shared[k];
        if (a && b && a !== b)
          conflicts.push({ id: r.id, key: k, private: a, shared: b });
        if (["mgId", "mgKitId", "mgStyleId"].includes(k)) {
          const v = a || b;
          if (v) {
            const key = k + "|" + v;
            (owners[key] || (owners[key] = [])).push(r.id);
          }
        }
      }
      const a =
        r.markers.private.mgMaintenancePolicy ||
        r.markers.shared.mgMaintenancePolicy;
      if (a) {
        try {
          const p = JSON.parse(a);
          if (
            p.version !== 1 ||
            !["source", "manual"].includes(p.owner) ||
            typeof p.reason !== "string" ||
            Object.keys(p).sort().join(",") !== "owner,reason,version" ||
            (p.owner === "manual" ? !p.reason.trim() : p.reason !== "")
          )
            throw Error("Invalid ownership shape");
        } catch (e) {
          conflicts.push({
            id: r.id,
            key: "mgMaintenancePolicy",
            error: String(e),
            raw: a,
          });
        }
      }
    }
    for (const [key, ids] of Object.entries(owners))
      if (ids.length > 1) duplicates.push({ key, ids });
    return {
      duplicates,
      conflicts,
      scope:
        "Current page scene plus local collections/variables/styles. Private data belongs to the executing plugin ID reported in privatePluginScope; other private namespaces cannot be inspected.",
    };
  }
  async function mgCanonicalNativeCaptureR4() {
    mgCanonicalR4Report = {
      kind: "Mangrove selected native observational snapshot",
      target: TARGET,
      readonly: true,
      complete: false,
      stabilityChecked: false,
      operationAccepted: false,
      createdNodeIds: [],
      mutatedNodeIds: [],
      fontLoads: [],
      captureErrors: [],
      errors: [],
      awaits: [],
      observedAt: new Date().toISOString(),
      privatePluginId: mgSelectedPluginScope(figma).observedPluginId,
      privatePluginScope: mgSelectedPluginScope(figma),
      scope:
        "Full recorded current and other-page scenes, local foundations, instance links, rich text segments and plugin identities. No scene/style/font mutations or publication.",
    };
    let prior,
      changed = false;
    try {
      mgCanonicalR4Stage("Capture entered, before first fence");
      fence();
      mgCanonicalR4Report.initialExactTarget =
        await mgCanonicalR4ExactTargetGuard("initial");
      mgCanonicalR4Report.targetAssociation = {
        nativeFileKey: figma.fileKey === undefined ? null : figma.fileKey,
        nativeFileKeyUnavailable: figma.fileKey === undefined,
        freshAssociationConfirmed: associationConfirmed,
        externalReceipt: ASSOCIATION,
      };
      prior = figma.skipInvisibleInstanceChildren;
      figma.skipInvisibleInstanceChildren = false;
      changed = true;
      const before = await scene("before");
      mgCanonicalR4Stage("Before-scene SHA256 begins", {
        nodes: before.length,
      });
      await mgCanonicalR4Yield();
      const beforeHash = digest(before);
      mgCanonicalR4Stage("Before-scene SHA256 finished");
      mgCanonicalR4Report.beforeScene = before;
      mgCanonicalR4Report.beforeSceneSHA256 = beforeHash;
      mgCanonicalR4Report.pages = figma.root.children.map((p) => ({
        id: p.id,
        type: p.type,
        name: p.name,
        current: p.id === TARGET.pageId,
      }));
      mgCanonicalR4Report.assets = await assets();
      mgCanonicalR4Stage("Before-assets SHA256 begins");
      await mgCanonicalR4Yield();
      const assetHash = digest(mgCanonicalR4Report.assets);
      mgCanonicalR4Stage("Before-assets SHA256 finished");
      mgCanonicalR4Report.assetSHA256 = assetHash;
      mgCanonicalR4Report.mainLinks = [];
      mgCanonicalR4Stage("Instance indexed inventory begins");
      await mgCanonicalR4Yield();
      const instanceInventory = figma.currentPage.findAllWithCriteria({
        types: ["INSTANCE"],
      });
      mgCanonicalR4Stage("Instance indexed inventory finished", {
        instances: instanceInventory.length,
      });
      for (const n of instanceInventory) {
        const main = await awaited("main " + n.id, () =>
          n.getMainComponentAsync(),
        );
        mgCanonicalR4Report.mainLinks.push({
          instanceId: n.id,
          main: main
            ? read(main, ["id", "key", "name", "type", "remote"])
            : null,
        });
      }
      mgCanonicalR4Stage("All main links finished", {
        links: mgCanonicalR4Report.mainLinks.length,
      });
      const set = await awaited("selected set set", () =>
        figma.getNodeByIdAsync(plan.selectedSet.id),
      );
      if (
        !set ||
        set.type !== "COMPONENT_SET" ||
        set.key !== plan.selectedSet.key ||
        set.parent === null
      )
        throw Error("selected set set identity differs");
      if (
        JSON.stringify(
          set.children.map((n) => ({
            id: n.id,
            key: n.type === "COMPONENT" ? n.key : null,
            type: n.type,
          })),
        ) !== JSON.stringify(EXPECTED_SELECTED_MEMBERS)
      )
        throw Error(
          "Selected component members differ from recorded IDs/keys/order",
        );
      const pageAncestor = (() => {
        let n = set;
        while (n && n.type !== "PAGE") n = n.parent;
        return n;
      })();
      if (!pageAncestor || pageAncestor.id !== TARGET.pageId)
        throw Error("selected set set is on another page");
      const defs = read(set, [
        "componentPropertyDefinitions",
      ]).componentPropertyDefinitions;
      if (
        !defs ||
        !defs[plan.selectedSet.labelProperty] ||
        defs[plan.selectedSet.labelProperty].type !== "TEXT"
      )
        throw Error("Canonical Label property differs");
      mgCanonicalR4Stage("selected set detailed descendant selection begins");
      const beforeById = new Map(before.map((x) => [x.id, x]));
      mgCanonicalR4Report.selected = {
        set: nodeRow(set),
        variants: set.children.map((n) => ({
          id: n.id,
          key: n.type === "COMPONENT" ? n.key : null,
          type: n.type,
        })),
        descendants: before.filter((n) => {
          let row = n;
          while (row) {
            if (row.id === plan.selectedSet.id) return true;
            row = beforeById.get(row.parentId);
          }
          return false;
        }),
      };
      mgCanonicalR4Stage("selected set detailed selection finished", {
        nodes: mgCanonicalR4Report.selected.descendants.length,
      });
      mgCanonicalR4Report.availableFonts = normalize(
        await awaited("available fonts", () => figma.listAvailableFontsAsync()),
      );
      mgCanonicalR4Report.actualFonts = Array.from(
        new Map(
          before
            .filter((n) => n.type === "TEXT")
            .flatMap((n) => (n.segments || []).map((s) => s.fontName))
            .filter(Boolean)
            .map((f) => [JSON.stringify(f), f]),
        ).values(),
      );
      mgCanonicalR4Report.shadowRaisedStyles =
        mgCanonicalR4Report.assets.styles.filter(
          (s) =>
            s.type === "EFFECT" &&
            (s.name === "Mangrove/shadow/raised" ||
              (s.markers.private.mgStyleId || s.markers.shared.mgStyleId) ===
                "shadow.raised"),
        );
      const shadowIds = new Set(
        mgCanonicalR4Report.shadowRaisedStyles.map((s) => s.id),
      );
      mgCanonicalR4Report.shadowRaisedUsers = before.filter((n) =>
        shadowIds.has(n.effectStyleId),
      );
      mgCanonicalR4Report.identity = identityChecks([
        ...before,
        ...mgCanonicalR4Report.assets.collections,
        ...mgCanonicalR4Report.assets.variables,
        ...mgCanonicalR4Report.assets.styles,
      ]);
      mgCanonicalR4Report.otherPageScenes = [];
      for (const metadata of mgCanonicalR4Report.pages) {
        if (metadata.current) continue;
        const other = await awaited("other page " + metadata.id, () =>
          figma.getNodeByIdAsync(metadata.id),
        );
        if (!other || other.type !== "PAGE")
          throw Error("Recorded other page missing " + metadata.id);
        const rows = await scene("other page " + metadata.id, other);
        const links = [];
        for (const row of rows.filter((n) => n.type === "INSTANCE")) {
          const instance = await awaited("other-page instance " + row.id, () =>
            figma.getNodeByIdAsync(row.id),
          );
          if (!instance || instance.type !== "INSTANCE")
            throw Error("Other-page instance missing");
          const main = await awaited("other-page main " + row.id, () =>
            instance.getMainComponentAsync(),
          );
          links.push({
            instanceId: row.id,
            main: main
              ? read(main, ["id", "key", "name", "type", "remote"])
              : null,
          });
        }
        mgCanonicalR4Report.otherPageScenes.push({
          pageId: other.id,
          scene: rows,
          mainLinks: links,
        });
      }
      mgCanonicalR4Stage("Per-node SHA256 inventory begins");
      await mgCanonicalR4Yield();
      mgCanonicalR4Report.sceneDigests = [];
      for (let i = 0; i < before.length; i++) {
        const r = before[i];
        mgCanonicalR4Report.sceneDigests.push({
          id: r.id,
          type: r.type,
          sha256: digest(r),
        });
        if (i % 50 === 0) {
          mgCanonicalR4Stage("Per-node digest progress", {
            nodes: i,
            total: before.length,
          });
          await mgCanonicalR4Yield();
        }
      }
      mgCanonicalR4Report.finalExactTarget =
        await mgCanonicalR4ExactTargetGuard("final");
      mgCanonicalR4Stage("All recorded capture stages finished");
      mgCanonicalR4Report.complete =
        mgCanonicalR4Report.captureErrors.length === 0;
    } catch (e) {
      mgCanonicalR4Report.errors.push(String(e));
    } finally {
      if (changed) {
        try {
          figma.skipInvisibleInstanceChildren = prior;
          mgCanonicalR4Report.traversalRestored =
            figma.skipInvisibleInstanceChildren === prior;
        } catch (e) {
          mgCanonicalR4Report.errors.push(
            "Traversal restoration failed: " + String(e),
          );
        }
      } else mgCanonicalR4Report.traversalRestored = true;
      if (
        mgCanonicalR4Report.errors.length ||
        mgCanonicalR4Report.captureErrors.length ||
        !mgCanonicalR4Report.traversalRestored
      )
        mgCanonicalR4Report.complete = false;
    }
    return mgCanonicalR4Report;
  }

  mgCanonicalR4Started = Date.now();
  const report = await mgCanonicalNativeCaptureR4();
  return { report, nodeRow, readErrors: () => report.captureErrors };
}

if (typeof module !== "undefined") module.exports = { mgSelectedCapture };
