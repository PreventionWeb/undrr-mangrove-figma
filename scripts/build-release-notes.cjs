#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const STATES = new Set([
  "source-only",
  "partial",
  "native-accepted",
  "published-finite",
  "unsupported",
  "unverified",
]);
const GATES = ["source", "rehearsal", "canonical", "publication", "consumer"];
const GATE_STATES = new Set([
  "accepted",
  "pending",
  "failed",
  "unsupported",
  "unverified",
]);
const SHA = /^[a-f0-9]{64}$/;
const KEY = /^[a-f0-9]{40}$/;
const NODE = /^\d+:\d+$/;
// Reviewed text targets only. The Components/CTA grid row represents Text CTA,
// not Editorial CTA. Unknown family/row associations must not emit a patch plan.
const TARGETS = {
  tag: {
    nodeId: "139:5083",
    setKey: "a3d00166e4505977f0ec2db5887ed07318c33ca0",
    textIds: ["30:5358", "30:5359"],
  },
  "horizontal-book-card": {
    nodeId: "128:4670",
    setKey: "95dc9441c9b100a7fba6529d3e364cc108f69d9a",
    textIds: ["30:5379", "30:5380"],
  },
  "editorial-cta": {
    nodeId: "23:4308",
    setKey: "f8d496df2f17c24142736ca82df46a2306536f99",
    textIds: ["30:2803"],
  },
};
function requireThat(ok, message) {
  if (!ok) throw Error(message);
}
function text(v) {
  return typeof v === "string" && v.trim().length > 0 && !/[\r\n]/.test(v);
}
function dated(v) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v
  );
}
function validateRegister(register) {
  requireThat(
    register?.version === 1 &&
      register.kind === "Dated selected release observations" &&
      register.liveInventory === false,
    "Explicit dated observations version1 required; live inventory is unsupported",
  );
  requireThat(
    Array.isArray(register.releases) && register.releases.length > 0,
    "Explicit release records required",
  );
  const ids = new Set();
  for (const r of register.releases) {
    requireThat(
      text(r.id) && !ids.has(r.id) && text(r.name),
      "Unique named releases required",
    );
    ids.add(r.id);
    requireThat(
      STATES.has(r.status) && dated(r.observedOn),
      "Explicit supported status/date required: " + r.id,
    );
    requireThat(
      text(r.scope) &&
        Array.isArray(r.limits) &&
        r.limits.length > 0 &&
        r.limits.every(text),
      "Finite scope and limits required: " + r.id,
    );
    requireThat(
      text(r.documentation) &&
        r.documentation.startsWith("docs/") &&
        !r.documentation.includes(".."),
      "Local documentation reference required",
    );
    requireThat(
      r.gates &&
        GATES.every((g) => GATE_STATES.has(r.gates[g])) &&
        Object.keys(r.gates).length === GATES.length,
      "Every gate must have an explicit state: " + r.id,
    );
    if (r.status === "source-only")
      requireThat(
        r.gates.source === "accepted" &&
          GATES.slice(1).every((g) => r.gates[g] !== "accepted"),
        "Source-only cannot imply native acceptance",
      );
    if (r.status === "partial")
      requireThat(
        r.gates.canonical !== "accepted" &&
          r.gates.publication !== "accepted" &&
          r.gates.consumer !== "accepted",
        "Partial is not canonical/publication/consumer acceptance",
      );
    if (r.status === "unsupported")
      requireThat(
        GATES.some((g) => r.gates[g] === "unsupported") &&
          r.gates.publication !== "accepted" &&
          r.gates.consumer !== "accepted",
        "Unsupported scope must remain explicit",
      );
    const provenance = (field, kind) => {
      const e = r.evidence?.[field];
      requireThat(
        e?.kind === kind &&
          e.reviewedAcceptance === true &&
          text(e.artifact) &&
          SHA.test(e.sha256),
        "Reviewed actual " + field + " provenance required: " + r.id,
      );
    };
    if (r.status === "native-accepted") {
      requireThat(
        ["source", "rehearsal", "canonical"].every(
          (g) => r.gates[g] === "accepted",
        ),
        "Native accepted requires actual source/rehearsal/canonical gates",
      );
      provenance("native", "reviewed-native-construction");
    }
    if (r.status === "unverified")
      requireThat(
        GATES.slice(1).every((g) => r.gates[g] !== "accepted"),
        "Unverified cannot imply native release acceptance",
      );
    if (r.gates.publication === "accepted")
      provenance("publication", "reviewed-native-publication");
    if (r.gates.consumer === "accepted")
      provenance("consumer", "reviewed-genuine-remote-consumer");
    if (r.status === "published-finite") {
      requireThat(
        GATES.every((g) => r.gates[g] === "accepted"),
        "Published finite requires every actual gate: " + r.id,
      );
      requireThat(
        r.source &&
          KEY.test(r.source.revision) &&
          SHA.test(r.source.profileSHA256),
        "Pinned source provenance required",
      );
      const c = r.canonical;
      requireThat(
        c?.fileKey === "Zgjq8pQ0FMT8d6dhw9M5bt" &&
          NODE.test(c.nodeId) &&
          KEY.test(c.setKey),
        "Exact canonical identity required",
      );
      requireThat(
        c.url ===
          `https://www.figma.com/design/${c.fileKey}?node-id=${c.nodeId.replace(":", "-")}`,
        "Canonical URL must match exact identity",
      );
      requireThat(
        Array.isArray(c.members) &&
          c.members.length > 0 &&
          new Set(c.members.map((m) => m.key)).size === c.members.length &&
          new Set(c.members.map((m) => m.nodeId)).size === c.members.length &&
          c.members.every(
            (m) => KEY.test(m.key) && NODE.test(m.nodeId) && text(m.name),
          ),
        "Exact unique native members required",
      );
      requireThat(
        typeof r.consumerURL === "string" &&
          /^https:\/\/www\.figma\.com\/design\/wOTLILmiXUI3uzG2BdPUxB\?node-id=\d+-\d+$/.test(
            r.consumerURL,
          ),
        "Exact consumer review URL required",
      );
    }
  }
  return register;
}
function cataloguePlan(register) {
  validateRegister(register);
  const notes = [];
  for (const r of register.releases) {
    if (r.status !== "published-finite") continue;
    const target = TARGETS[r.id];
    requireThat(
      target &&
        r.canonical.nodeId === target.nodeId &&
        r.canonical.setKey === target.setKey,
      "Unknown or changed catalogue family identity: " + r.id,
    );
    requireThat(
      Array.isArray(r.catalogueNotes) &&
        r.catalogueNotes.length === target.textIds.length &&
        new Set(r.catalogueNotes.map((n) => n.nodeId)).size ===
          target.textIds.length &&
        r.catalogueNotes.every(
          (n) =>
            target.textIds.includes(n.nodeId) &&
            text(n.text) &&
            ["status", "limits"].includes(n.role),
        ),
      "Unknown or missing exact catalogue TEXT association: " + r.id,
    );
    notes.push(
      ...r.catalogueNotes.map((n) => ({
        ...n,
        familyId: r.id,
        observedOn: r.observedOn,
        expectedType: "TEXT",
        canonicalSetKey: r.canonical.setKey,
      })),
    );
  }
  return {
    version: 1,
    kind: "Review-only selected release catalogue notes",
    writesFigma: false,
    liveInventory: false,
    requiresFreshTargetInspection: true,
    notes,
    unpatchedStates: register.releases
      .filter((r) => r.status !== "published-finite")
      .map((r) => ({ id: r.id, status: r.status, gates: r.gates })),
  };
}
function markdown(register) {
  validateRegister(register);
  const lines = [
    "# Selected release observations",
    "",
    "Dated evidence records only. This is not a current live Figma inventory or native admission.",
    "",
  ];
  for (const r of register.releases) {
    lines.push(
      `## ${r.name}`,
      "",
      `${r.status}; observed ${r.observedOn}.`,
      "",
      r.scope,
      "",
      `Gates: ${GATES.map((g) => g + "=" + r.gates[g]).join(", ")}.`,
      "",
    );
    if (r.status === "published-finite")
      lines.push(
        `[Masters](${r.canonical.url}) · [Consumer](${r.consumerURL})`,
        "",
      );
    lines.push(
      ...r.limits.map((v) => "- " + v),
      "",
      `Details: ${r.documentation}`,
      "",
    );
  }
  return lines.join("\n");
}
function main(args) {
  requireThat(
    args.length <= 1 && (!args.length || args[0] === "--catalogue-plan"),
    "Usage: node scripts/build-release-notes.cjs [--catalogue-plan]",
  );
  const register = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../releases/selected-releases.json"),
      "utf8",
    ),
  );
  process.stdout.write(
    args[0] === "--catalogue-plan"
      ? JSON.stringify(cataloguePlan(register), null, 2) + "\n"
      : markdown(register),
  );
}
module.exports = { validateRegister, cataloguePlan, markdown };
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
