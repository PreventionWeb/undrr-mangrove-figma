/** Isolated authored Card content presets. Native/publication acceptance open. */
"use strict";
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const SOURCE_HASHES = {
  "stories/Components/Cards/Card/HorizontalBookCard.jsx":
    "baa6eb4baf7c640a34947e93c5fbf37c8fa4bc48731d8dc7937ce26c9075ebfb",
  "stories/Components/Cards/Card/HorizontalBookCard.stories.jsx":
    "aa7023fc7477df59e8aa28ede37e322fbe1edfb8fc509b62377e986a8811397b",
  "stories/Components/Cards/Card/cardParts.jsx":
    "ff7ef9eb6fe17893c11ea9ee4135294011aedab580be1175bd7d7ae7c49e68bc",
  "stories/Components/Cards/Card/card.scss":
    "e5220ce8519237793fc7a1045ea38342a887ec02681309aa8667d1928f3d25a3",
  "stories/Components/Buttons/CtaButton/CtaButton.jsx":
    "a21ece51b122636a0221bdecd60f38000e839ce7333272776ce26809cc8f6167",
  "stories/Components/Buttons/CtaButton/CtaButton.stories.jsx":
    "7f25a8461469744068db1e2b52ed58d58a68717609e7aa911291db45040a5512",
  "stories/Components/Buttons/CtaButton/cta-button.scss":
    "f1534e70a4c4c1d60dea8356fdef4b4b476e49d93c3ed310557f898d3bc5a40b",
};
function buildHorizontalBookRecipes({ root, modes, variables, styles, cover }) {
  const fail = (m) => {
      throw Error(`Figma Card content recipe needs updating: ${m}`);
    },
    read = (f) => fs.readFileSync(path.join(root, f));
  for (const [file, hash] of Object.entries(SOURCE_HASHES))
    if (crypto.createHash("sha256").update(read(file)).digest("hex") !== hash)
      fail(`Guarded source ${file} changed`);
  if (
    modes
      .map((m) => m.id)
      .sort()
      .join(",") !== "delta,irp,mcr,preventionweb,undrr"
  )
    fail("Expected five source modes");
  const source = (file, needle) => {
    const text = read(file).toString(),
      i = text.indexOf(needle);
    if (i < 0) fail(`Missing ${needle}`);
    return { file, line: text.slice(0, i).split("\n").length };
  };
  const cardRef = source(
    "stories/Components/Cards/Card/card.scss",
    ".mg-card {",
  );
  const byName = new Map(variables.map((v) => [v.name, v]));
  const value = (name, m, type, seen = new Set()) => {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail(`Missing/wrong/circular ${name}`);
    seen.add(name);
    const x = v.values[m.id];
    if (x == null) fail(`Missing ${name}/${m.id}`);
    return x.alias ? value(x.alias, m, type, seen) : x;
  };
  const per = (fn) => Object.fromEntries(modes.map((m) => [m.id, fn(m)]));
  const upsert = (array, e) => {
    const matched = array.filter((v) => v.id === e.id || v.name === e.name);
    if (
      matched.length > 1 ||
      (matched.length && (matched[0].id !== e.id || matched[0].name !== e.name))
    )
      fail(`Foreign identity ${e.id}`);
    const i = array.findIndex((v) => v.id === e.id);
    if (i < 0) array.push(e);
    else array[i] = e;
  };
  const helper = (name, type, scopes, fn) => {
    const full = `component/card-content/${name}`;
    upsert(variables, {
      id: full.replaceAll("/", "."),
      name: full,
      type,
      scopes,
      sourceRef: cardRef,
      description:
        "Authored bounded source projection. See geometry/source limitations.",
      hiddenFromPublishing: false,
      codeSyntax: {},
      values: per((m) => (typeof fn === "function" ? fn(m) : fn)),
    });
    return full;
  };
  const num = (n, x) =>
    helper(
      n,
      "FLOAT",
      ["WIDTH_HEIGHT", "GAP", "STROKE_FLOAT", "CORNER_RADIUS"],
      x,
    );
  const alpha = (n, role, a) =>
    helper(n, "COLOR", ["FRAME_FILL", "STROKE_COLOR", "TEXT_FILL"], (m) => ({
      ...value(role, m, "COLOR"),
      a,
    }));
  const border = alpha("book-border", "color/neutral-600", 0.2);
  const one = num("one", 1),
    pEnd = num(
      "paragraph-end",
      (m) =>
        value("font-size/300", m, "FLOAT") + value("spacing/50", m, "FLOAT"),
    );
  const widths = Object.fromEntries(
    [390, 640].map((w) => [w, num(`width-${w}`, w)]),
  );
  for (const m of modes) {
    for (const [role, expected] of [
      ["card/padding", 15],
      ["spacing/100", 10],
      ["spacing/200", 20],
      ["font-size/300", 16],
      ["font-size/500", 23],
    ])
      if (value(role, m, "FLOAT") !== expected)
        fail(`Measured preset ${role}/${m.id} changed`);
    if (
      value("font-family/ui", m, "STRING") !== "Roboto Condensed" ||
      value("font-family/text", m, "STRING") !== "Roboto"
    )
      fail("Measured Latin face changed");
  }
  const clonedStyle = (id, from, role, size, decoration) => {
    const original = styles.text.find((s) => s.id === from);
    if (!original) fail(`Missing ${from}`);
    if (original.bindings?.fontFamily !== role)
      fail(`Source font binding ${from} changed`);
    for (const mode of modes) {
      const expectedFamily = value(role, mode, "STRING"),
        v = original.values[mode.id];
      if (
        v?.fontName?.family !== expectedFamily ||
        v.fontName.style !==
          (from === "component.card.summary" ? "Regular" : "Bold")
      )
        fail(`Source font template ${from}/${mode.id} changed`);
    }

    const e = JSON.parse(JSON.stringify(original));
    e.id = `component.card-content.${id}`;
    e.name = `Mangrove/component/card-content/${id}`;
    e.component = true;
    e.recommended = false;
    e.source = cardRef;
    e.bindings = { fontFamily: role, fontSize: `font-size/${size}` };
    e.values = per((m) => ({
      ...original.values[m.id],
      fontSize: value(`font-size/${size}`, m, "FLOAT"),
      ...(decoration ? { textDecoration: decoration } : {}),
    }));
    upsert(styles.text, e);
    return e.id;
  };
  const title = clonedStyle(
      "title",
      "component.card.title",
      "font-family/ui",
      "500",
    ),
    linkedTitle = clonedStyle(
      "title-link",
      "component.card.title",
      "font-family/ui",
      "500",
      "UNDERLINE",
    ),
    body = clonedStyle(
      "body",
      "component.card.summary",
      "font-family/text",
      "300",
    ),
    label = clonedStyle(
      "label",
      "component.card.label",
      "font-family/ui",
      "250",
    );
  const f = (id, layout, children = [], extra = {}) => ({
    type: "FRAME",
    id,
    name: id,
    fill: null,
    layout,
    children,
    ...extra,
  });
  const t = (
    id,
    characters,
    style,
    fill,
    property,
    width = "FILL",
    extra = {},
  ) => ({
    type: "TEXT",
    id,
    name: id,
    characters,
    textStyle: style,
    fill,
    ...(property ? { textProperty: property } : {}),
    textWrap: "AUTO",
    layout: { width, height: "HUG" },
    ...extra,
  });
  const col = (id, children, extra = {}) =>
    f(
      id,
      { mode: "VERTICAL", width: "FILL", height: "HUG", gap: "spacing/0" },
      children,
      extra,
    );
  if (
    crypto.createHash("sha256").update(cover).digest("hex") !==
    "4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370"
  )
    fail("Exact Bali cover bytes changed");
  const coverImage = {
    assetId: "card-content-bali-gp2022-cover",
    base64: cover.toString("base64"),
    scaleMode: "FILL",
  };
  function visual(w) {
    const h = ((w - 2) * 4) / 3 + 2;
    return f(
      "visual",
      {
        mode: "NONE",
        width: num(`cover-box-width-${w}-false`, w),
        height: num(`cover-box-height-${w}-false`, h),
        clipsContent: true,
      },
      [
        f(
          "cover",
          {
            mode: "NONE",
            width: num(`cover-ink-width-${w}`, w - 2),
            height: num(`cover-ink-height-${w}`, ((w - 2) * 4) / 3),
          },
          [],
          { position: { x: 1, y: 1 }, image: coverImage },
        ),
      ],
      {
        stroke: border,
        bindings: {
          strokeWeight: one,
        },
      },
    );
  }
  // Exact CSS border-chevron projection. It remains an inline/baseline candidate.
  function caret(size, paint) {
    const side = size * 0.35,
      b = size * 0.15,
      v = side * Math.SQRT2;
    const rotate = ([x, y]) => [
      (x - y + side) / Math.SQRT2,
      (x + y) / Math.SQRT2,
    ];
    const poly = (points) =>
      `<polygon fill="#000000" points="${points.map((p) => rotate(p).join(",")).join(" ")}"/>`;
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v} ${v}">${poly(
      [
        [0, 0],
        [side, 0],
        [side, b],
        [0, b],
      ],
    )}${poly([
      [side - b, b],
      [side, b],
      [side, side],
      [side - b, side],
    ])}</svg>`;
    return f(
      "caret-slot",
      {
        mode: "NONE",
        width: num(`caret-slot-${size}`, size * 0.6),
        height: num(`caret-line-${size}`, size * 1.25),
        clipsContent: false,
      },
      [
        {
          type: "SVG",
          id: "caret-ink",
          name: "Exact source border chevron",
          layout: { width: v, height: v },
          position: {
            x: size * 0.25 + (side - v) / 2,
            y: (size * 1.25 - v) / 2 - size * 0.1,
          },
          svg: {
            assetId: `card-title-caret-${size}`,
            markup,
            monochrome: { fills: paint },
          },
        },
      ],
    );
  }
  function heading(text, linked) {
    const fill = linked ? "color/interactive" : "color/text";
    return f(
      "title-box",
      {
        mode: "HORIZONTAL",
        width: "FILL",
        height: "HUG",
        gap: "spacing/0",
        align: "CENTER",
      },
      [
        t(
          "title",
          text,
          linked ? linkedTitle : title,
          fill,
          "Title",
          linked ? "HUG" : "FILL",
          { textWrap: "BALANCE", textAlign: "LEFT" },
        ),
        ...(linked ? [caret(23, fill)] : []),
      ],
      { bindings: { paddingTop: "spacing/100", paddingBottom: "spacing/75" } },
    );
  }
  const action = (text, width = "HUG") => ({
    type: "INSTANCE",
    id: "cta",
    name: "Authored CTA action",
    family: "editorial-cta",
    variant: {
      Context: "Base",
      State: "Default",
      Content: "Short",
      Motion: "NoPreference",
    },
    overrides: { Label: text },
    expose: true,
    layout: { width, height: "HUG" },
  });
  const rawSummary = /summaryText: `([^`]+)`/.exec(
    read(
      "stories/Components/Cards/Card/HorizontalBookCard.stories.jsx",
    ).toString(),
  )?.[1];
  if (!rawSummary) fail("Missing authored rich summary");
  const match =
    /^(.*)<a href="#" class="mg-card__text-link">([^<]+)<\/a>([\s\S]*)$/.exec(
      rawSummary,
    );
  if (!match) fail("Rich inline anatomy changed");
  const chunks = match.slice(1).map((s) => s.replace(/\s+/g, " ")),
    characters = chunks.join("");
  function summary() {
    let end = 0;
    return col(
      "summary-box",
      [
        {
          type: "TEXT",
          id: "summary",
          name: "Authored rich summary",
          characters,
          textWrap: "PRETTY",
          textRuns: chunks.map((s, i) => {
            const start = end;
            end += s.length;
            return {
              id: ["before-link", "source-placeholder-link", "after-link"][i],
              start,
              end,
              textStyle: body,
              fill: i === 1 ? "color/interactive" : "color/neutral-800",
              textDecoration: i === 1 ? "UNDERLINE" : "NONE",
            };
          }),
          layout: { width: "FILL", height: "HUG" },
        },
      ],
      { bindings: { paddingBottom: pEnd } },
    );
  }
  const base = (id, name, ref, description, variants, limitations) => ({
    id,
    name: `Mangrove/${name}`,
    kind: "component-set",
    sourceRef: ref,
    description,
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants,
  });
  const common = [
    "Latin English finite source content only. Native/otherengine pixels, arbitrary edits/wrapping, brand/script and publication acceptance pending.",
    "Root height depicts card box only; source external10px margin-bottom belongs to composition flow.",
    "Linked title caret only supports declared single-line fixture titles. Native baseline/underline offset and arbitrary edited-title wrapping are not accepted.",
  ];
  const shell = (children, width, extra = {}) =>
    f(
      "root",
      {
        mode: "VERTICAL",
        width: widths[width],
        height: "HUG",
        gap: "spacing/0",
        clipsContent: false,
      },
      children,
      {
        fill: "card/background",
        effectStyle: "shadow.raised",
        bindings: {
          cornerRadius: "card/border-radius",
          paddingTop: "card/padding",
          paddingBottom: "card/padding",
          paddingLeft: "card/padding",
          paddingRight: "card/padding",
        },
        ...extra,
      },
    );
  const horizontalVariants = [];
  for (const Width of [640, 390])
    for (const Preset of ["Default", "NoImage", "NoLink", "ButtonOnly"]) {
      const linked = Preset === "Default" || Preset === "NoImage",
        hasCover = Preset !== "NoImage",
        hasCTA = Preset !== "NoLink",
        content = col("content", [
          f(
            "meta",
            {
              mode: "HORIZONTAL",
              width: "FILL",
              height: "HUG",
              gap: "spacing/50",
            },
            [
              t("label-1", "Label 1", label, "color/tag", "Label 1", "HUG"),
              t("label-2", "Label 2", label, "color/tag", "Label 2", "HUG"),
            ],
          ),
          heading("Title in large size", linked),
          summary(),
          ...(hasCTA
            ? [action("Primary action", Width === 390 ? "FILL" : "HUG")]
            : []),
        ]);
      const children = hasCover
        ? [visual(Width === 640 ? 160 : 200), content]
        : Width === 390
          ? [
              f("source-empty-track", {
                mode: "NONE",
                width: "FILL",
                height: 0,
                clipsContent: false,
              }),
              content,
            ]
          : [content];
      horizontalVariants.push({
        id: `horizontal-book-card.${Preset.toLowerCase()}.${Width}`,
        name: `Preset=${Preset}, Width=${Width}`,
        properties: { Preset, Width: String(Width), Tone: "Primary" },
        tree: shell(children, Width, {
          layout: {
            mode: Width === 640 ? "HORIZONTAL" : "VERTICAL",
            width: widths[Width],
            height: "HUG",
            gap:
              Width === 640 || Preset === "NoImage"
                ? "spacing/100"
                : "spacing/0",
            clipsContent: false,
          },
        }),
      });
    }
  const hbook = base(
    "horizontal-book-card",
    "Horizontal Book Card",
    source(
      "stories/Components/Cards/Card/HorizontalBookCard.jsx",
      "export function HorizontalBookCard",
    ),
    "Four actual source story states at640 desktop and390 mobile. Exact visible rich summary.",
    horizontalVariants,
    [
      ...common,
      "Body uses three contiguous authored inline runs, no whole-string component property. Direct formatted-run edit recovery relies on isolated rich TEXT capability.",
      'Source summary anchor href="#" is preserved in metadata and visibly styled; native HTTPS hyperlink omitted, no invented destination.',
      "Actual CtaButton VariantCTA reuses unpublished editorial-cta Base child, not filled Button. Nested consumer edits require native acceptance.",
      "Fixed widths/cover grid project source desktop160px versus mobile200px-max visual. Responsive resizing and other tones remain open.",
    ],
  );
  hbook.effectSurfaceCapability = "source-effect-surface-v1";
  for (const variant of hbook.variants)
    variant.tree.effectSurface = {
      version: 1,
      kind: "UNCLIPPED_INNER_SHADOW_RECTANGLE",
      sourceEffectStyle: variant.tree.effectStyle,
      sourceFill: variant.tree.fill,
    };
  hbook.sourceHrefMetadata = {
    summary: "#",
    title: "javascript:void(0)",
    CTA: "javascript:void(0)",
  };
  return hbook;
}
module.exports = { buildHorizontalBookRecipes, SOURCE_HASHES };
