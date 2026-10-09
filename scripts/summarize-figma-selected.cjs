#!/usr/bin/env node
"use strict";
const fs = require("node:fs"),
  crypto = require("node:crypto");
const {
  mgSelectedAcceptanceSummary,
} = require("../examples/figma-selected/summary.js");
const {
  mgTagSourceGuard,
  MG_TAG_ACCEPTED_SOURCE_SHA256,
} = require("../examples/figma-selected/tag-contract.js");
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i],
    value = process.argv[i + 1];
  if (!["--report", "--source", "--out"].includes(key) || !value || args[key])
    throw Error(
      "Use --report native-report.json --source tag-source.json [--out summary.json]",
    );
  args[key] = value;
}
if (!args["--report"] || !args["--source"])
  throw Error("Explicit native report and supported source packet required");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const source = fs.readFileSync(args["--source"]);
mgTagSourceGuard(JSON.parse(source));
if (hash(source) !== MG_TAG_ACCEPTED_SOURCE_SHA256)
  throw Error("Changed source requires a separate release");
const raw = fs.readFileSync(args["--report"]),
  report = JSON.parse(raw);
const summary = mgSelectedAcceptanceSummary(report, {
  sourceSHA256: hash(source),
});
summary.fullReport = {
  path: args["--report"],
  bytes: raw.length,
  sha256: hash(raw),
};
summary.provenance =
  "Summarises the supplied receipt; does not inspect current Figma or establish independent review.";
const output = JSON.stringify(summary, null, 2) + "\n";
if (args["--out"]) {
  if (args["--out"] === args["--report"] || args["--out"] === args["--source"])
    throw Error("Do not overwrite input evidence");
  fs.writeFileSync(args["--out"], output, { flag: "wx" });
  console.log(
    JSON.stringify({
      status: summary.status,
      out: args["--out"],
      sha256: summary.fullReport.sha256,
    }),
  );
} else process.stdout.write(output);
if (summary.status !== "recorded-checks-passed") process.exitCode = 1;
