"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { JSDOM } = require("jsdom");
(async () => {
  const dom = new JSDOM(fs.readFileSync(__dirname + "/ui.html", "utf8"), {
      runScripts: "dangerously",
    }),
    win = dom.window,
    el = (id) => win.document.getElementById(id);
  let release, posted;
  const baselineRaw =
    '{"complete":true,"opaque":{"richSegments":[{"font":"actual face"}]}}';
  Object.defineProperty(el("config"), "files", {
    value: [{ size: 12, text: async () => '{"target":1}' }],
  });
  Object.defineProperty(el("baseline"), "files", {
    value: [
      {
        size: 54 * 1048576,
        text: () => new Promise((resolve) => (release = resolve)),
      },
    ],
  });
  el("association").checked = true;
  el("approval").checked = true;
  win.parent.postMessage = (message) => (posted = message.pluginMessage);
  const sending = el("advanced-run").onclick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el("status").textContent, "Reading baseline (54.0 MiB)");
  assert.equal(
    posted.type,
    "selected-session-invalidate",
    "Rebuild payload sent before full file read",
  );
  release(baselineRaw);
  await sending;
  assert.equal(
    el("status").textContent,
    "Sending inputs; waiting for Figma validation",
  );
  assert.equal(
    posted.baselineRaw,
    baselineRaw,
    "Progress changed baseline bytes",
  );
  const order = [],
    figma = {
      showUI() {},
      ui: { postMessage: (m) => order.push(m.stage || m.type) },
      closePlugin() {},
    };
  const context = {
    figma,
    __html__: "",
    MG_SELECTED_SOURCE: {},
    MG_SELECTED_SOURCE_SHA: "source",
    mgSelectedRenderer: {},
    mgSelectedCreateSession: () => ({ invalidate() {} }),
    mgSelectedAcceptanceSummary: (r) => ({ complete: r.complete }),
    JSON: {
      parse(raw) {
        order.push(raw === "config" ? "parse-config" : "parse-baseline");
        return raw === "config" ? {} : { full: true };
      },
    },
    setTimeout(fn, delay) {
      order.push("yield");
      return setTimeout(fn, delay);
    },
    mgSelectedTagRun: async (native, cfg) => {
      assert.equal(cfg.baselineRaw, "baseline");
      assert.deepEqual(cfg.baseline, { full: true });
      return { complete: false };
    },
  };
  vm.runInNewContext(fs.readFileSync(__dirname + "/entry.js", "utf8"), context);
  await figma.ui.onmessage({
    type: "selected-tag-rebuild",
    configRaw: "config",
    baselineRaw: "baseline",
    associationConfirmed: true,
    rebuildApproved: true,
  });
  assert(order.indexOf("Rebuild received") < order.indexOf("yield"));
  assert(order.indexOf("yield") < order.indexOf("parse-config"));
  assert(
    order.indexOf("Parsing full uploaded baseline") <
      order.indexOf("parse-baseline"),
  );
  assert.equal(order.filter((x) => x === "yield").length, 2);
  // Summary failure must never erase the real post-mutation operation receipt.
  const actualReport = {
    complete: false,
    journal: [{ id: "owned-1" }],
    errors: ["native error"],
  };
  context.mgSelectedTagRun = async () => actualReport;
  context.mgSelectedAcceptanceSummary = () => {
    throw Error("unexpected shape");
  };
  const delivered = [];
  figma.ui.postMessage = (m) => delivered.push(m);
  await figma.ui.onmessage({
    type: "selected-tag-rebuild",
    configRaw: "config",
    baselineRaw: "baseline",
    associationConfirmed: true,
    rebuildApproved: true,
  });
  assert.equal(
    delivered.find((m) => m.type === "report-summary").summary.status,
    "not-verified",
  );
  assert(
    !delivered.some((m) => m.type === "full-report"),
    "Full report sent automatically",
  );
  await figma.ui.onmessage({ type: "selected-report-request" });
  assert.equal(
    delivered.find((m) => m.type === "full-report").report,
    actualReport,
  );
  el("save").disabled = false;
  el("save-summary").disabled = false;
  el("association").checked = true;
  el("config").onchange();
  assert.equal(
    el("association").checked,
    false,
    "New target retains old file association approval",
  );
  assert(
    el("save").disabled && el("save-summary").disabled,
    "Stale downloads remain enabled after target change",
  );
  dom.window.close();
  console.log(
    "PASS actual UI delayed-file progress/unchanged payload and native ACK/parse yields. No checksum or transport changes.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
