# Small designer handoff example

This is a filled scoping example, not an executed change or acceptance receipt. Replace the illustrative inputs with the real approved nodes, revisions, evidence and reviewers. It shows how a small request can use a short issue/PR record rather than treating every template field as a release audit.

## Request

The designer wants the existing Button's horizontal padding adjusted for one approved size, using an existing spacing token. Keep its label, anchor semantics, disabled behaviour and focus appearance. Record the exact approved Figma node/checkpoint and selected Storybook story in the real request. The decision is component-local; a global spacing-token change and unrelated variants are outside scope.

## Implementation and comparison

Work in Mangrove's CtaButton source/styles and stories. Confirm the actual source token and size mapping before editing. Record the source revision and compare the selected browser result with the approved design using matching copy, font, brand, viewport and state. Include the changed size and adjacent unchanged sizes, plus default, hover, focus and disabled behaviour where the padding change can affect them. Verify Tab/focus, Enter activation and disabled non-activation; do not introduce button-specific Space behaviour into an anchor just to match the component's name.

Use the checkout's required code checks and a real-browser before/after capture. The designer reviews padding and retained appearance; the code reviewer checks scope, semantics and compatibility. No toolkit installation or Figma reconstruction is required for this manual code handoff.

## Recipe disposition and completion

Inspect whether the accepted source change affects the toolkit's exported Button. If it does, record a named recipe follow-up and any manual-main ownership decision rather than silently rebuilding Figma. Native publication is not part of this request.

The final real record needs only: approved node/checkpoint, source revision/code PR, selected story links and comparison inputs, actual checks/evidence, designer/code review outcome, and the recipe disposition or follow-up link. Omit the optional native maintenance record because no native update was requested. If a reviewer rejects or defers a difference, leave that outcome explicit; this example supplies no fictitious passing results.
