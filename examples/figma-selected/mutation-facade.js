function mgMutationFacade(native, allowed, styleAllowed, journal, fence) {
  const cache = new WeakMap(),
    reverse = new WeakMap(),
    created = new Set();
  const unwrap = (v) =>
    reverse.get(v) || (Array.isArray(v) ? v.map(unwrap) : v);
  const readers = /^(get|find|resolve|export)/;
  const pure = new Set([
    "base64Decode",
    "base64Encode",
    "setBoundVariableForEffect",
    "setBoundVariableForPaint",
    "createVariableAlias",
  ]);
  const nodeMutators = new Set([
    "appendChild",
    "insertChild",
    "remove",
    "rescale",
    "resize",
    "resizeWithoutConstraints",
    "setSharedPluginData",
    "setPluginData",
    "setBoundVariable",
    "setExplicitVariableModeForCollection",
    "clearExplicitVariableModeForCollection",
    "setProperties",
    "addComponentProperty",
    "editComponentProperty",
    "deleteComponentProperty",
    "setRangeFontName",
    "setRangeFontSize",
    "setRangeFills",
    "setRangeTextDecoration",
    "setRangeTextDecorationOffset",
    "setRangeTextStyleIdAsync",
    "setRangeLineHeight",
    "setRangeLetterSpacing",
    "setRangeHyperlink",
    "setTextStyleIdAsync",
    "setEffectStyleIdAsync",
    "setFillStyleIdAsync",
    "setStrokeStyleIdAsync",
  ]);
  const creators = new Set([
    "createFrame",
    "createSection",
    "createText",
    "createRectangle",
    "createComponent",
    "createNodeFromSvg",
    "createImage",
    "createTextStyle",
    "createEffectStyle",
    "combineAsVariants",
  ]);
  function admits(o) {
    return created.has(o.id) || allowed.has(o.id) || styleAllowed.has(o.id);
  }
  function isHandle(v) {
    return (
      v === native ||
      v === native.variables ||
      v === native.viewport ||
      v === native.ui ||
      typeof v.getPluginData === "function" ||
      typeof v.getSharedPluginData === "function" ||
      typeof v.getSizeAsync === "function" ||
      typeof v.getBytesAsync === "function" ||
      (typeof v.id === "string" &&
        ("modes" in v ||
          "resolvedType" in v ||
          "children" in v ||
          ["TEXT", "EFFECT", "PAINT", "GRID"].includes(v.type))) ||
      Object.keys(v).some((k) => typeof v[k] === "function")
    );
  }
  function output(v) {
    if (v && typeof v.then === "function") return v.then(output);
    if (Array.isArray(v)) return v.map(output);
    if (
      !v ||
      typeof v !== "object" ||
      ArrayBuffer.isView(v) ||
      v instanceof ArrayBuffer
    )
      return v;
    if (cache.has(v)) return cache.get(v);
    if (!isHandle(v)) {
      const data = {};
      for (const k of Object.keys(v)) data[k] = output(v[k]);
      return Object.freeze(data);
    }
    const describe = (k) =>
      "Bounded facade get " +
      (v.id || v.type || (v === native && "FIGMA") || "API") +
      "." +
      String(k);
    const p = new Proxy(
      {},
      {
        has(_target, k) {
          return k in v;
        },
        ownKeys() {
          return Reflect.ownKeys(v);
        },
        getOwnPropertyDescriptor(_target, k) {
          const d = Reflect.getOwnPropertyDescriptor(v, k);
          if (!d) return undefined;
          return {
            configurable: true,
            enumerable: d.enumerable,
            get() {
              return output(v[k]);
            },
          };
        },
        get(_target, k) {
          const o = v;
          let x;
          try {
            x = o[k];
          } catch (e) {
            throw Error(describe(k) + ": " + String(e));
          }
          if (typeof x !== "function") return output(x);
          return (...args) => {
            fence();
            if (
              pure.has(k) ||
              readers.test(String(k)) ||
              k === "loadFontAsync" ||
              k === "listAvailableFontsAsync"
            )
              return output(
                x.apply(
                  o,
                  args.map((a) =>
                    typeof a === "function"
                      ? (...values) => a(...values.map(output))
                      : unwrap(a),
                  ),
                ),
              );
            if (k === "createInstance") {
              if (!admits(o))
                throw Error("Instance source outside selected scope");
              journal.push({
                kind: "create-attempt",
                method: k,
                sourceId: o.id,
              });
              const r = x.apply(o, args.map(unwrap));
              created.add(r.id);
              journal.push({ kind: "create", method: k, id: r.id });
              if (r?.children) {
                const queue = [...r.children];
                while (queue.length) {
                  const n = queue.shift();
                  created.add(n.id);
                  journal.push({ kind: "create-descendant", id: n.id });
                  if (n.children) queue.push(...n.children);
                }
              }
              return output(r);
            }
            if (o === native && creators.has(k)) {
              if (
                k === "combineAsVariants" &&
                args[0].some((n) => !created.has(unwrap(n).id))
              )
                throw Error("Combine existing components refused");
              journal.push({ kind: "create-attempt", method: k });
              const r = x.apply(o, args.map(unwrap));
              if (r && typeof r.then === "function")
                throw Error("Unexpected async creator");
              if (r?.id) created.add(r.id);
              journal.push({ kind: "create", method: k, id: r?.id || null });
              if (r?.children) {
                const queue = [...r.children];
                while (queue.length) {
                  const n = queue.shift();
                  created.add(n.id);
                  journal.push({ kind: "create-descendant", id: n.id });
                  if (n.children) queue.push(...n.children);
                }
              }
              return output(r);
            }
            if (nodeMutators.has(k)) {
              if (k === "appendChild" || k === "insertChild") {
                const child = unwrap(args[k === "insertChild" ? 1 : 0]);
                if (!child || !admits(child))
                  throw Error("Reparent foreign child refused");
              }
              if (
                (k === "appendChild" || k === "insertChild") &&
                o === native.currentPage
              ) {
                const child = unwrap(args[k === "insertChild" ? 1 : 0]);
                if (!created.has(child.id))
                  throw Error("Reparent existing node to page refused");
              } else if (!admits(o))
                throw Error(
                  "Mutation outside selected scope " + o.id + "." + String(k),
                );
              if (k === "addComponentProperty" && !created.has(o.id))
                throw Error("New property on existing CTA refused");
              if (k === "remove" && !created.has(o.id))
                throw Error("Remove existing selected node refused");
              journal.push({ kind: "call", id: o.id, method: k });
              return output(x.apply(o, args.map(unwrap)));
            }
            if (o === native.viewport && k === "scrollAndZoomIntoView")
              return undefined;
            throw Error(
              "Unadmitted method " + String(k) + " on " + (o.id || "API"),
            );
          };
        },
        set(_target, k, value) {
          const o = v;
          fence();
          if (!admits(o))
            throw Error(
              "Setter outside selected scope " + o.id + "." + String(k),
            );
          journal.push({ kind: "set", id: o.id, field: String(k) });
          o[k] = unwrap(value);
          return true;
        },
      },
    );
    cache.set(v, p);
    reverse.set(p, v);
    return p;
  }
  return { api: output(native), created, raw: unwrap };
}

if (typeof module !== "undefined") module.exports = { mgMutationFacade };
