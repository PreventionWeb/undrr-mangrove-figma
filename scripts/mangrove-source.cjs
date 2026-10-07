"use strict";
const fs = require("node:fs");
const path = require("node:path");
function getMangroveRoot() {
  if (!process.env.MANGROVE_SOURCE_ROOT) {
    throw new Error(
      "Set MANGROVE_SOURCE_ROOT to an installed Mangrove source checkout. See README.md.",
    );
  }
  const root = path.resolve(process.env.MANGROVE_SOURCE_ROOT);
  for (const file of [
    "tokens/mangrove.yaml",
    "scripts/build-tokens.cjs",
    "stories/assets/scss/_control-tokens.scss",
  ]) {
    if (!fs.existsSync(path.join(root, file)))
      throw new Error(`Missing Mangrove source: ${file} in ${root}`);
  }
  return root;
}
function getTokenEngine() {
  const tokens = require(
    path.join(getMangroveRoot(), "scripts/build-tokens.cjs"),
  );
  for (const name of ["loadSources", "layersFor", "mergeLayers", "resolve"]) {
    if (typeof tokens[name] !== "function")
      throw new Error(
        `Mangrove token engine does not export ${name}. Use the pinned revision in source-lock.json.`,
      );
  }
  return tokens;
}
module.exports = { getMangroveRoot, getTokenEngine };
