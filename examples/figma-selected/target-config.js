/* Pure target derivation shared by CLI and native session. No Figma API or writes. */
const mgSelectedTargetContract =
  typeof module !== "undefined"
    ? require("./tag-contract.js")
    : {
        MG_TAG_ACCEPTED_SOURCE_SHA256,
        mgTagSourceGuard,
        mgTagIdentity,
        mgTagClosure,
      };
function mgSelectedDeriveTargetConfig(
  baseline,
  source,
  fileKey,
  { sourceSHA256, baselineSHA256 },
) {
  const {
    MG_TAG_ACCEPTED_SOURCE_SHA256,
    mgTagSourceGuard,
    mgTagIdentity,
    mgTagClosure,
  } = mgSelectedTargetContract;
  mgTagSourceGuard(source);
  if (sourceSHA256 !== MG_TAG_ACCEPTED_SOURCE_SHA256)
    throw Error("Changed Tag packet requires a separate source/native release");
  if (!/^[a-f0-9]{64}$/.test(baselineSHA256))
    throw Error("Exact baseline checksum required");
  if (
    !/^[A-Za-z0-9]{22}$/.test(fileKey) ||
    !baseline.complete ||
    baseline.errors.length ||
    baseline.captureErrors.length ||
    !baseline.traversalRestored ||
    !Array.isArray(baseline.otherPageScenes)
  )
    throw Error("Exact file key and complete full native baseline required");
  if (
    baseline.sourceSHA256 &&
    baseline.sourceSHA256 !== MG_TAG_ACCEPTED_SOURCE_SHA256
  )
    throw Error("Prior baseline source differs");
  const rows = baseline.beforeScene;
  const unique = (items, label) => {
    if (items.length !== 1) throw Error("Unique " + label + " required");
    return items[0];
  };
  const set = unique(
    rows.filter(
      (n) =>
        n.type === "COMPONENT_SET" &&
        mgTagIdentity(n, "mgKitId") === "family/tag",
    ),
    "existing Tag set",
  );
  const main = unique(
      rows.filter(
        (n) => mgTagIdentity(n, "mgKitId") === "integration/tag/main",
      ),
      "selected master root",
    ),
    review = unique(
      rows.filter(
        (n) => mgTagIdentity(n, "mgKitId") === "integration/tag/review",
      ),
      "selected review root",
    );
  const page = unique(
    rows.filter((n) => n.type === "PAGE"),
    "current page",
  );
  if (
    main.parentId !== page.id ||
    review.parentId !== page.id ||
    set.parentId !== main.id ||
    mgTagClosure(rows, [main.id, review.id]).size !== 100
  )
    throw Error("Existing selected Tag100 anatomy required");
  const collection = unique(
    baseline.assets.collections.filter((c) => c.name === source.collection),
    "source collection",
  );
  const members = set.childIds.map((id) => {
    const n = rows.find((n) => n.id === id);
    if (!n || n.type !== "COMPONENT" || !n.key)
      throw Error("Native member key required");
    return { id: n.id, key: n.key, type: n.type };
  });
  const definitions = set.componentPropertyDefinitions;
  const label = JSON.parse(mgTagIdentity(set, "mgKitProperties")).Label;
  if (members.length !== 5 || definitions[label]?.type !== "TEXT")
    throw Error("Existing owning Label and five members required");
  return {
    version: 1,
    operation: "rebuild",
    sourceSHA256,
    baselineSourceSHA256:
      baseline.sourceSHA256 || MG_TAG_ACCEPTED_SOURCE_SHA256,
    baselineSHA256,
    target: { fileKey, pageId: page.id },
    association: { collectionId: collection.id, collectionKey: collection.key },
    selectedSet: { id: set.id, key: set.key, labelProperty: label },
    setMembers: members,
    setAnchors: [{ id: set.id, key: set.key, members }],
    rootIds: [main.id, review.id],
  };
}
if (typeof module !== "undefined")
  module.exports = { mgSelectedDeriveTargetConfig };
