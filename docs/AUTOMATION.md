# Efficient local Figma maintenance

Research checked 8 October 2026. The maintained [selected runner](../examples/figma-selected/README.md) should own reconstruction, target admission, preservation checks and reports. An agent selects a supported operation and investigates its exceptions. Its current scope is existing unchanged-source static Tag rebuilds; this does not establish changed-source updates or arbitrary Storybook conversion.

## What to reuse from other approaches

[Figma Console MCP Desktop Bridge](https://github.com/southleft/figma-console-mcp/blob/main/figma-desktop-bridge/README.md) documents a local WebSocket connection between a running plugin and a local MCP server, distinct from its hosted relay mode. [TalkToFigma](https://github.com/grab/cursor-talk-to-figma-mcp) likewise uses a local server and an explicitly launched plugin, with batch node/text operations and progress reporting. These demonstrate that another hosted service is unnecessary for active-session automation. Neither supplies Mangrove's source semantics, ownership rules or exact preservation contract.

The useful pattern is one operation request to a deterministic executor, followed by a small result and retained full evidence. Use batch operations and indexes within the admitted target. Cache source packets and media by checksum, but keep fresh native target checks and baseline validation. Returning a smaller summary must not remove fields from the verifier or rewrite a failed receipt.

The current toolkit uses documented native controls and the Plugin API. It has not installed either bridge. If launch/download control remains a measured bottleneck after the session workflow, evaluate a pinned local bridge that invokes this same runner. A proposal should bind to loopback, authenticate its session, allow only the supported operations and retain exact file/page association. Console's documented local transport is unauthenticated; do not expose it or treat a general arbitrary-code endpoint as the maintenance contract. Preserve applicable upstream licence notices if code is reused.

## First-party alternatives and autonomy limits

Official [write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) supports native components, variables and layout through remote `use_figma`. It is not read-only. Official remote writes require a Full seat and edit permission for the target file. Its documented limits include a 20 KB response cap, custom-font restrictions and image-bearing component import restrictions. Those matter for this toolkit's complete evidence and Book Card media. A remote write is not proof of exact compatibility with the existing native/private-data workflow.

[Code Connect](https://developers.figma.com/docs/code-connect/) maps components and props to code snippets; it is not an automatic reverse-sync engine. Rendered [code-to-canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) captures can provide useful references, but existing member keys, property ownership and consumer overrides still require an explicit update contract.

[Figma's plugin lifecycle](https://developers.figma.com/docs/plugins/) requires user-initiated execution, allows one plugin/action at a time and excludes background plugins. A local bridge can automate an open editor/plugin session; this is not documented headless CI or autonomous publication. Compilation and offline checks can run unattended. Native writes still require an editable authenticated session, and disconnection/target changes must fail closed. Keep scoped publication, genuine consumer uptake and human design acceptance as distinct gates.

## Measure before expanding the mechanism

Record capture, mutation, summary and transfer times, artifact sizes and agent tool calls for a representative operation. The previous Tag baseline was 54,740,230 bytes; compact JSON retained the same fields in 32,977,189 bytes, a 40% reduction. Its 118,327,184-byte operation report became 66,007,136 bytes, a 44% reduction. These are serialization measurements, not a benchmark of native runtime or model-token savings.

The [single-session workflow](COMPONENT-MAINTENANCE.md#single-session-tag-workflow) now removes baseline export/re-upload, derives configuration in the plugin, downloads full evidence only on request and returns automatic recorded-check summaries. Two ordinary native executions passed independent finite unchanged-source Tag review on 2026-10-09. Each automatic summary was 1,261 bytes; each complete report was 66,007,136 bytes. Native capture remains substantial work; profile read/digest stages before claiming runtime gains. Keep full before/after comparison until actual measurements and native evidence justify a different verifier. Extend Card/CTA through family-specific policies around the same executor rather than another historical runtime copy.
