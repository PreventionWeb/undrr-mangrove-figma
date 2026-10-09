"use strict";
// Historical extraction parity is separate from the current source contract.
require("./mock-kit-source-contract.cjs");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const expected = require("./construction-compatibility.json");
const runtime =
  require("../../../scripts/build-figma-plugin.cjs").renderPlugin();
assert.equal(
  crypto.createHash("sha256").update(runtime).digest("hex"),
  expected.runtime.sha256,
  "Historical extraction runtime differs; use test:kit for current contracts and behaviour",
);
console.log("PASS historical extraction runtime pin");
