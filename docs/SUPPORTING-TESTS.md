# Optional supporting tests

The first 19 supporting cohort is an optional source/mock workflow. It does not establish native Figma rendering, publication, consumer acceptance or handoff. Maintenance remains the default test workflow; historical harnesses outside this named cohort remain inactive checkpoints.

Install this toolkit and the selected Mangrove source checkout using their own locked workflows. Build source CSS and run the normal kit build first. Prepare a current disabled expanded configuration using [the expanded workflow](EXPANDED-WORKFLOW.md). The supporting configuration adds only the required current toolkit dependencies, declared test sites and the tracked source sample image; it preserves existing source/cache guards and never enables a full producer.

```sh
npm run prepare:supporting:first19 -- \
  /absolute/path/to/inputs-config.json \
  BASE_CONFIG_SHA256 \
  /absolute/path/to/new-supporting-output-directory
```

Use the returned configuration path and checksum:

```sh
npm run test:supporting:first19 -- \
  --source-root /absolute/path/to/undrr-mangrove \
  --config /absolute/path/to/new-supporting-output-directory/inputs-config.json \
  --config-sha256 SUPPORTING_CONFIG_SHA256
```

Use `--test NAME` to select a declared test. The launcher checks the configuration, manifest, cohort, original roots and selected current code before and after each child. It stops on a failure or drift and preserves completed child results. These sequential guards do not claim an operating-system race-free boundary.

The cohort covers gradients, SVG sizing, text decoration, absolute positioning, alpha masks, offsets, indentation, text case/defaults/thickness, rich text, preview access, retained review widths, media, experiment targeting and inherited-root ownership. Required dependency helpers are not extra advertised tests. The exact registered names and current hashes are in `scripts/supporting-first19.json`.

The source sample `stories/assets/images/card-image.png` remains source-owned. It is not added to the 1,270-member reference cache. Historical source corruption fixtures and the expensive full-producer harnesses are separate inactive lanes. Passing these mocks does not close [native release gates](RELEASE-STATUS.md) or waive inherited connector payload budgets.

The root actual installed command passed all 19 tests with exit0. Independent actual-result review passed (SHA256 `f754100e91f6971812b482fbb4c0b4611777af6f44a4ab38f49e5b2568606600`). Earlier author/private checks and launcher/configuration models remain distinct from this actual run; the final remote checkout run also passed all 19 tests with unchanged inputs and independent review (SHA256 `a64c6ea2cf7a79d3000a479f0f69d47452625f16432d96ff3bd0a8b8c510824c`).

The shared source cohort contains 19 advertised tests and two dependency-only bodies, mock-card-content and mock-search-results. Their own main routines are inactive; using their exports does not activate the corresponding larger historical harnesses. Actual metadata preparation has passed. The actual installed run is recorded above, with its independent review passed.
