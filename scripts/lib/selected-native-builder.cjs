// Optional compiler specialization. The normal shared builder is never rewritten.
function selectedNativeBuilder(source) {
  function once(old, replacement) {
    if (source.split(old).length !== 2)
      throw Error(
        "Selected native builder boundary changed: " + old.slice(0, 60),
      );
    source = source.replace(old, replacement);
  }
  once(
    "const organized = owned.has('layout/start');",
    "const organized = false; integration.preflightOwned(owned);",
  );
  once(
    "const main = container('main', 'Mangrove / Main components', 1200);",
    "const main = integration.mainParent();",
  );
  once(
    "const review = container('review', 'Mangrove / Review', 800);",
    "const review = integration.reviewParent();",
  );
  once(
    "if (typeof mgLayoutGrid === 'function') {",
    "if (integration.preserveSetLayout(set, family)) {} else if (typeof mgLayoutGrid === 'function') {",
  );
  once("  paint(review, 'fills', 'color/neutral-0');", "");
  once("    [...usedText],\n    usedEffects.size > 0", "    [],\n    false");
  const start = source.indexOf(
    "  if (organized) {\n    try {\n      result.layout",
  );
  const end = source.indexOf("  result.createdNodeIds = [...created];", start);
  if (start < 0 || end < 0)
    throw Error("Selected native layout boundary changed");
  source =
    source.slice(0, start) +
    "  result.layout = integration.placeSelected(built);\n" +
    source.slice(end);
  for (const text of [
    "`review/${id}`",
    "`review/${id}/title`",
    "`review/${id}/grid`",
    "`review/${id}/specimen/${specimen.id}`",
  ])
    once(text, text.replace("`review/", "`integration/card-cta/review/"));
  return source;
}
module.exports = { selectedNativeBuilder };
