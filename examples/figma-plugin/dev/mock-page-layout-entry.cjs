"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../code.js"), "utf8");
function fixture(marker) {
  const calls = [],
    posts = [];
  const context = {
    figma: {
      root: {
        getSharedPluginData(ns, key) {
          assert.equal(ns, "orgundrrmangrove");
          assert.equal(key, "mgPageLayout");
          return marker;
        },
      },
      ui: { postMessage: (m) => posts.push(m) },
      showUI() {},
      notify() {},
      closePlugin() {
        calls.push("close");
      },
    },
    __html__: "",
    errorMessage: (e) => String(e.message || e),
    preflightMangroveMaintenance: async () => calls.push("preflight"),
    buildMangroveComponents: async () => {
      calls.push("build");
      return {};
    },
    importVariables: async () => {
      calls.push("import");
      return { counts: { created: 0, updated: 0 }, errors: [] };
    },
    organizeMangroveKit: async () => {
      calls.push("organize");
      return {};
    },
    inspectMangroveKit: async () => {
      calls.push("inspect");
      return {};
    },
  };
  vm.runInNewContext(source, context);
  return { send: context.figma.ui.onmessage, calls, posts };
}
(async () => {
  for (const marker of [
    '{"version":1,"layout":"mangrove-four-pages"}',
    "malformed or future marker",
  ]) {
    for (const type of [
      "import",
      "build-components",
      "organize-kit",
      "create-welcome",
      "refresh-kit-guidance",
      "set-maintenance-policy",
      "prepare-override-probes",
      "audit-capability-probes",
      "unknown-write",
    ]) {
      const f = fixture(marker);
      await f.send({ type });
      assert.deepEqual(f.calls, [], type + " reached mutation/preflight");
      assert.equal(f.posts[0].type, "error");
      assert.match(f.posts[0].message, /standalone token maintenance/);
      assert.match(f.posts[0].message, /Library page/);
    }
    const f = fixture(marker);
    await f.send({ type: "inspect" });
    await f.send({ type: "close" });
    assert.deepEqual(f.calls, ["inspect", "close"]);
  }
  for (const type of ["import", "build-components", "organize-kit"]) {
    const f = fixture("");
    await f.send({ type });
    assert(
      f.calls.includes(
        type === "build-components"
          ? "build"
          : type === "organize-kit"
            ? "organize"
            : "import",
      ),
    );
    assert(!f.posts.some((p) => p.type === "error"));
  }
  console.log(
    "PASS page-layout full-entry refusal before import/build/layout/policy/probe writes; readonly/close and unmarked legacy dispatch preserved. No native acceptance.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
