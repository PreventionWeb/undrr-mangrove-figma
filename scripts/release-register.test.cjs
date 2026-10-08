"use strict";
const assert = require("node:assert/strict");
const register = require("../releases/selected-releases.json");
const {
  validateRegister,
  cataloguePlan,
  markdown,
} = require("./build-release-notes.cjs");
const copy = () => structuredClone(register);
assert.equal(validateRegister(register), register);
assert.deepEqual(
  register.releases.map((r) => r.canonical.members.length),
  [5, 8, 23],
);
const plan = cataloguePlan(register);
assert.equal(plan.writesFigma, false);
assert.equal(plan.liveInventory, false);
assert.equal(plan.notes.length, 5);
assert.deepEqual(
  plan.notes.filter((n) => n.familyId === "editorial-cta").map((n) => n.nodeId),
  ["30:2803"],
);
assert(markdown(register).includes("not a current live Figma inventory"));
const refuses = (change) => {
  const r = copy();
  change(r);
  assert.throws(() => validateRegister(r));
};
refuses((r) => delete r.releases[0].gates.consumer);
refuses((r) => delete r.releases[0].evidence.publication);
refuses((r) => (r.releases[0].evidence.publication.kind = "source-mock-pass"));
refuses((r) => (r.releases[0].evidence.publication.sha256 = "missing"));
refuses((r) => (r.releases[0].evidence.consumer.reviewedAcceptance = false));
refuses((r) => (r.liveInventory = true));
refuses(
  (r) =>
    (r.releases[0].canonical.members[1].key =
      r.releases[0].canonical.members[0].key),
);
refuses((r) => (r.releases[0].canonical.url = r.releases[1].canonical.url));
refuses((r) => {
  r.releases[0].status = "native-accepted";
  delete r.releases[0].evidence.native;
});
refuses((r) => {
  r.releases[0].status = "unverified";
});
for (const status of ["source-only", "partial", "unsupported", "unverified"]) {
  const r = copy();
  const item = r.releases[0];
  item.status = status;
  item.gates = {
    source: "accepted",
    rehearsal: status === "partial" ? "failed" : "unverified",
    canonical: "pending",
    publication: "pending",
    consumer: "pending",
  };
  if (status === "unsupported") item.gates.rehearsal = "unsupported";
  delete item.evidence;
  delete item.canonical;
  delete item.consumerURL;
  validateRegister(r);
  const p = cataloguePlan(r);
  assert.equal(p.notes.length, 3);
  assert.equal(p.unpatchedStates[0].status, status);
  assert(markdown(r).includes(status));
  assert(!markdown(r).includes("undefined"));
}
const unknown = copy();
unknown.releases[0].catalogueNotes[0].nodeId = "30:2803";
assert.throws(() => cataloguePlan(unknown));
const wrong = copy();
wrong.releases[2].canonical.setKey = wrong.releases[1].canonical.setKey;
assert.throws(() => cataloguePlan(wrong));
const extra = copy();
extra.releases[0].id = "unknown-family";
assert.throws(() => cataloguePlan(extra));
console.log(
  "PASS dated release provenance, explicit incomplete states, exact identity/member/row refusals and review-only notes; no native acceptance inferred.",
);
