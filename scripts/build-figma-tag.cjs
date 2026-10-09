#!/usr/bin/env node
/** Finite source Tag profile. Does not alter the normal kit or execute Figma. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { getMangroveRoot } = require("./mangrove-source.cjs");
const { buildTagRecipes, SOURCE_HASHES } = require("./figma-tag-recipes.cjs");
const REVIEW_ROLES = ["font-family/text", "font-size/300", "color/neutral-900"];
function projectTagClosure(doc) {
  const byName = new Map(doc.variables.map((v) => [v.name, v])),
    wanted = new Set(),
    visiting = new Set();
  if (byName.size !== doc.variables.length)
    throw Error("Duplicate source variable names");
  function requireRole(name, positive = false) {
    if (wanted.has(name) && !positive) return;
    if (visiting.has(name)) throw Error("Tag union alias cycle: " + name);
    const spec = byName.get(name);
    if (!spec) throw Error("Missing Tag source role: " + name);
    visiting.add(name);
    if (!["COLOR", "FLOAT", "STRING"].includes(spec.type))
      throw Error("Unsupported Tag source type: " + name);
    if (
      JSON.stringify(Object.keys(spec.values).sort()) !==
      JSON.stringify(doc.modes.map((m) => m.id).sort())
    )
      throw Error("Incomplete Tag source mode values: " + name);
    for (const value of Object.values(spec.values)) {
      if (value && typeof value === "object" && Object.hasOwn(value, "alias")) {
        if (Object.keys(value).length !== 1 || typeof value.alias !== "string")
          throw Error("Malformed Tag alias: " + name);
        const target = byName.get(value.alias);
        if (!target || target.type !== spec.type)
          throw Error("Missing or wrong-type Tag alias target: " + name);
        requireRole(value.alias, positive);
      } else if (spec.type === "FLOAT") {
        if (!Number.isFinite(value) || value < 0 || (positive && value === 0))
          throw Error("Invalid Tag FLOAT terminal: " + name);
      } else if (spec.type === "STRING") {
        if (typeof value !== "string" || !value)
          throw Error("Invalid Tag STRING terminal: " + name);
      } else if (
        !value ||
        Object.keys(value).sort().join(",") !== "a,b,g,r" ||
        Object.values(value).some((v) => !Number.isFinite(v) || v < 0 || v > 1)
      )
        throw Error("Invalid Tag COLOR terminal: " + name);
    }
    visiting.delete(name);
    wanted.add(name);
  }
  function visit(value) {
    if (typeof value === "string" && byName.has(value)) requireRole(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  }
  visit(doc.components);
  visit(doc.styles);
  REVIEW_ROLES.forEach((name) => requireRole(name));
  ["font-size/250", "font-size/300", "tag/min-width", "tag/min-height"].forEach(
    (name) => requireRole(name, true),
  );
  const variables = doc.variables.filter((v) => wanted.has(v.name));
  if (variables.length !== 29)
    throw Error("Exact29 Tag recipe/style/review roles required");
  return { ...doc, variables };
}
function buildTagDocument({ root = getMangroveRoot() } = {}) {
  if (path.resolve(root) !== getMangroveRoot())
    throw Error("Selected Tag root must match configured Mangrove source");
  const foundations =
    require("./figma-maintenance-foundations.cjs").buildFigmaFoundations();
  const { collection, modes, variables, styles } = foundations;
  const families = buildTagRecipes({ root, modes, variables, styles });
  const doc = projectTagClosure({
    collection,
    modes,
    variables,
    styles: {
      text: styles.text.filter((s) => s.id === "component.tag.label"),
      effect: [],
    },
    components: { version: 1, families },
  });
  return {
    ...doc,
    $comment:
      "Selected source-backed static Tag profile. Source export only; selected native adapter and release review required.",
    selectedProfile: {
      id: "tag-static-five-tones-v1",
      supportedSourceRevision: require("../source-lock.json").revision,
      sourceHashes: SOURCE_HASHES,
      reviewRoles: REVIEW_ROLES,
      familyCounts: { tag: 5 },
      variableCount: 29,
      textStyleCount: 1,
      effectStyleCount: 0,
      defaultKitRuntimeAdmission: false,
      nativeExecutionAccepted: false,
      scope:
        "Static intrinsic Latin SPAN metadata only. Linked states, badge/code roles, grouped containers, long-label wrapping, RTL, Arabic, forced colours and motion are not included. Historical recipe fields retained unchanged; current acceptance is recorded separately.",
    },
  };
}
function main(args) {
  const index = args.indexOf("--output"),
    output = index >= 0 ? args[index + 1] : null;
  if (!output && !args.includes("--stdout"))
    throw Error("Supply explicit --output /tmp/tag-source.json or --stdout");
  if (args.includes("--check") && !output)
    throw Error("--check requires --output");
  const raw = JSON.stringify(buildTagDocument(), null, 2) + "\n";
  if (args.includes("--check")) {
    if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== raw)
      throw Error("Selected Tag source profile output is missing or stale");
    return;
  }
  if (args.includes("--stdout")) process.stdout.write(raw);
  else fs.writeFileSync(output, raw);
}
module.exports = { buildTagDocument, projectTagClosure, REVIEW_ROLES };
if (require.main === module)
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
