"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const { fixture } = require("./controller-model.test.cjs"),
  { buildTagDocument } = require("../../scripts/build-figma-tag.cjs"),
  { prepareConfig } = require("../../scripts/build-figma-selected.cjs");
const source = buildTagDocument(),
  sha = (s) => crypto.createHash("sha256").update(s).digest("hex"),
  copy = (x) => JSON.parse(JSON.stringify(x));
const context = {
  module: { exports: {} },
  require: (p) => require(p === "./tag-contract.js" ? "./tag-contract.js" : p),
  setTimeout,
  Date,
  console,
};
for (const f of ["tag-contract.js", "target-config.js", "session.js"])
  vm.runInNewContext(fs.readFileSync(__dirname + "/" + f, "utf8"), context);
(async () => {
  function environment(options = {}) {
    const f = fixture(),
      native = {
        pluginId: "mangrove-tokens-exploratory",
        fileKey: f.config.target.fileKey,
        currentPage: { type: "PAGE", id: f.config.target.pageId },
      };
    let calls = 0,
      captures = 0,
      release;
    const session = context.mgSelectedCreateSession(
      native,
      source,
      f.sourceHash,
      () => {},
      {
        checksum: sha,
        capture: async () => {
          captures++;
          if (options.delay) await new Promise((r) => (release = r));
          const snapshot = copy(f.baseline);
          if (options.incomplete) snapshot.complete = false;
          if (options.mismatch)
            snapshot.assets.collections[0].key = "x".repeat(40);
          return { report: snapshot };
        },
        run: async (api, cfg) => {
          calls++;
          assert(
            Object.isFrozen(cfg.baseline.beforeScene[0]),
            "Cached baseline mutable",
          );
          assert.equal(
            sha(cfg.baselineRaw),
            cfg.baselineSHA256,
            "Cached checksum changed",
          );
          assert.equal(cfg.baseline.sourceSHA256, f.sourceHash);
          assert.equal(cfg.baseline.beforeScene.length, 101);
          if (options.throw) throw Error("Runtime failed");
          return {
            complete: !options.failure,
            errors: options.failure ? ["Failed"] : [],
          };
        },
      },
    );
    return {
      f,
      native,
      session,
      calls: () => calls,
      captures: () => captures,
      release: () => release(),
    };
  }
  const callbacks = { freshAssociationConfirmed: true };
  const e = environment(),
    ready = await e.session.prepare(e.f.config, callbacks);
  assert.equal(ready.preservationChecked, false);
  assert.equal(ready.sceneNodes, 101);
  assert.equal(ready.links, 0);
  assert(
    !("baseline" in ready) && !("baselineRaw" in ready),
    "Baseline leaked to UI",
  );
  assert.deepEqual(JSON.parse(JSON.stringify(ready.target)), e.f.config.target);
  const output = await e.session.rebuild({
    sessionId: ready.sessionId,
    rebuildApproved: true,
    freshAssociationConfirmed: true,
  });
  assert.equal(output.report.complete, true);
  assert.equal(e.calls(), 1);
  await assert.rejects(
    () =>
      e.session.rebuild({
        sessionId: ready.sessionId,
        rebuildApproved: true,
        freshAssociationConfirmed: true,
      }),
    /stale/,
  );
  assert.equal(e.calls(), 1);
  for (const kind of [
    "stale",
    "page",
    "file",
    "namespace",
    "unapproved",
    "override",
    "failure",
    "throw",
    "invalidate",
  ]) {
    const x = environment({
        failure: kind === "failure",
        throw: kind === "throw",
      }),
      r = await x.session.prepare(x.f.config, callbacks),
      request = {
        sessionId: r.sessionId,
        rebuildApproved: true,
        freshAssociationConfirmed: true,
      };
    if (kind === "stale") request.sessionId = "old";
    if (kind === "page") x.native.currentPage.id = "changed";
    if (kind === "file") x.native.fileKey = "other";
    if (kind === "namespace") x.native.pluginId = "other";
    if (kind === "unapproved") request.rebuildApproved = false;
    if (kind === "override") request.baselineRaw = "forged";
    if (kind === "invalidate") x.session.invalidate();
    if (kind === "failure")
      assert.equal((await x.session.rebuild(request)).report.complete, false);
    else await assert.rejects(() => x.session.rebuild(request));
    await assert.rejects(
      () =>
        x.session.rebuild({
          sessionId: r.sessionId,
          rebuildApproved: true,
          freshAssociationConfirmed: true,
        }),
      /stale/,
    );
    assert.equal(
      x.calls(),
      ["failure", "throw"].includes(kind) ? 1 : 0,
      kind + " reached runtime unexpectedly",
    );
  }
  for (const options of [{ incomplete: true }, { mismatch: true }]) {
    const x = environment(options);
    await assert.rejects(() => x.session.prepare(x.f.config, callbacks));
    await assert.rejects(
      () =>
        x.session.rebuild({
          sessionId: "forged",
          rebuildApproved: true,
          freshAssociationConfirmed: true,
        }),
      /stale/,
    );
    assert.equal(x.calls(), 0);
  }
  const delayed = environment({ delay: true }),
    pending = delayed.session.prepare(delayed.f.config, callbacks);
  await new Promise((r) => setTimeout(r, 0));
  await assert.rejects(
    () => delayed.session.prepare(delayed.f.config, callbacks),
    /busy/,
  );
  delayed.session.invalidate();
  delayed.release();
  await assert.rejects(() => pending, /invalidated/);
  assert.equal(delayed.calls(), 0);
  const f = fixture(),
    raw = JSON.stringify(f.baseline),
    sourceRaw = JSON.stringify(source, null, 2) + "\n";
  const pure = context.mgSelectedDeriveTargetConfig(
    f.baseline,
    source,
    f.config.target.fileKey,
    { sourceSHA256: sha(sourceRaw), baselineSHA256: sha(raw) },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(pure)),
    prepareConfig(raw, sourceRaw, f.config.target.fileKey),
    "Native/CLI derivation differs",
  );
  console.log(
    "PASS native session cache: same CLI guards/config, immutable full baseline/checksum, small summary, one-time approval, stale/target/plugin/override/incomplete/busy/failure invalidation refusals. Model only.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
