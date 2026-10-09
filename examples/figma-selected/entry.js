figma.showUI(__html__, { width: 500, height: 620 });
const mgSelectedNativeSession = mgSelectedCreateSession(
  figma,
  MG_SELECTED_SOURCE,
  MG_SELECTED_SOURCE_SHA,
  mgSelectedRenderer,
);
let mgSelectedBusy = false,
  mgSelectedLastReport = null;
const mgSelectedProgress = (p) => figma.ui.postMessage({ type: "stage", ...p });
const mgSelectedCheckpoint = (report) =>
  figma.ui.postMessage({ type: "checkpoint", report });
function mgSelectedDeliverSummary(report, context = {}) {
  mgSelectedLastReport = report;
  let summary;
  try {
    summary = mgSelectedAcceptanceSummary(report, context);
  } catch (error) {
    summary = {
      status: "not-verified",
      errors: ["Automatic summary failed: " + String(error)],
      fullReportRetained: true,
    };
  }
  figma.ui.postMessage({ type: "report-summary", summary });
}
figma.ui.onmessage = async (message) => {
  if (message.type === "selected-session-invalidate") {
    mgSelectedNativeSession.invalidate();
    figma.ui.postMessage({ type: "session-invalidated" });
    return;
  }
  if (message.type === "close" && !mgSelectedBusy) {
    mgSelectedNativeSession.invalidate();
    return figma.closePlugin();
  }
  if (message.type === "selected-report-request" && !mgSelectedBusy) {
    if (mgSelectedLastReport)
      figma.ui.postMessage({
        type: "full-report",
        report: mgSelectedLastReport,
      });
    return;
  }
  const operations = [
    "selected-session-capture",
    "selected-session-rebuild",
    "selected-tag-rebuild",
    "selected-tag-capture",
  ];
  if (!operations.includes(message.type) || mgSelectedBusy) return;
  mgSelectedBusy = true;
  mgSelectedLastReport = null;
  mgSelectedProgress({
    stage: message.type.endsWith("capture")
      ? "Capture request received"
      : "Rebuild received",
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (message.type === "selected-session-rebuild") {
      const output = await mgSelectedNativeSession.rebuild(
        {
          sessionId: message.sessionId,
          rebuildApproved: message.rebuildApproved,
          freshAssociationConfirmed: message.associationConfirmed,
          ...(message.baselineRaw !== undefined
            ? { baselineRaw: message.baselineRaw }
            : {}),
          ...(message.configRaw !== undefined
            ? { configRaw: message.configRaw }
            : {}),
        },
        { onProgress: mgSelectedProgress, onCheckpoint: mgSelectedCheckpoint },
      );
      mgSelectedDeliverSummary(output.report, output.context);
      return;
    }
    mgSelectedNativeSession.invalidate();
    const config = JSON.parse(message.configRaw);
    if (
      message.associationConfirmed !== true ||
      (message.type === "selected-tag-rebuild" &&
        message.rebuildApproved !== true)
    )
      throw Error(
        "Confirm fresh target association and unchanged-source rebuild",
      );
    config.freshAssociationConfirmed = true;
    config.onCaptureProgress = mgSelectedProgress;
    config.onCheckpoint = mgSelectedCheckpoint;
    if (message.type === "selected-session-capture") {
      const summary = await mgSelectedNativeSession.prepare(config, {
        freshAssociationConfirmed: true,
        onProgress: mgSelectedProgress,
      });
      figma.ui.postMessage({ type: "session-ready", summary });
      return;
    }
    if (message.type === "selected-tag-capture") {
      const { report } = await mgSelectedCapture(figma, config);
      report.sourceSHA256 = MG_SELECTED_SOURCE_SHA;
      mgSelectedLastReport = report;
      figma.ui.postMessage({
        type: "snapshot-summary",
        summary: {
          complete: report.complete,
          errors: report.errors,
          sceneNodes: report.beforeScene?.length || 0,
          preservationChecked: false,
        },
      });
      return;
    }
    mgSelectedProgress({ stage: "Parsing full uploaded baseline" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    config.baselineRaw = message.baselineRaw;
    config.baseline = JSON.parse(message.baselineRaw);
    delete message.baselineRaw;
    const report = await mgSelectedTagRun(
      figma,
      config,
      mgSelectedRenderer,
      MG_SELECTED_SOURCE,
      MG_SELECTED_SOURCE_SHA,
    );
    mgSelectedDeliverSummary(report, {
      sourceSHA256: MG_SELECTED_SOURCE_SHA,
      baselineSHA256: config.baselineSHA256,
      target: config.target,
    });
  } catch (error) {
    mgSelectedNativeSession.invalidate();
    mgSelectedDeliverSummary(
      {
        kind: "Selected Tag input refusal",
        complete: false,
        errors: [String(error)],
        publication: false,
        ...(error.selectedSnapshot ? { snapshot: error.selectedSnapshot } : {}),
      },
      { sourceSHA256: MG_SELECTED_SOURCE_SHA },
    );
    if (error.selectedSnapshot)
      figma.ui.postMessage({
        type: "stage",
        stage: "Session refused: " + String(error),
      });
  } finally {
    mgSelectedBusy = false;
  }
};
