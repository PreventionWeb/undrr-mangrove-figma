figma.showUI(__html__, { width: 460, height: 460 });
let mgSelectedBusy = false;
figma.ui.onmessage = async (message) => {
  if (message.type === "close" && !mgSelectedBusy) return figma.closePlugin();
  if (
    !["selected-tag-rebuild", "selected-tag-capture"].includes(message.type) ||
    mgSelectedBusy
  )
    return;
  mgSelectedBusy = true;
  figma.ui.postMessage({
    type: "stage",
    stage:
      message.type === "selected-tag-capture"
        ? "Capture request received"
        : "Rebuild received",
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 0));
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
    config.onCaptureProgress = (p) =>
      figma.ui.postMessage({ type: "stage", ...p });
    config.onCheckpoint = (report) =>
      figma.ui.postMessage({ type: "checkpoint", report });
    if (message.type === "selected-tag-capture") {
      const { report } = await mgSelectedCapture(figma, config);
      report.sourceSHA256 = MG_SELECTED_SOURCE_SHA;
      figma.ui.postMessage({ type: "snapshot", report });
      return;
    }
    figma.ui.postMessage({
      type: "stage",
      stage: "Parsing full uploaded baseline",
    });
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
    figma.ui.postMessage({ type: "report", report });
  } catch (error) {
    figma.ui.postMessage({
      type: "report",
      report: {
        kind: "Selected Tag input refusal",
        complete: false,
        errors: [String(error)],
        publication: false,
      },
    });
  } finally {
    mgSelectedBusy = false;
  }
};
