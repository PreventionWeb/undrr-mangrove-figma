# Expanded recipe workflow

This optional workflow exports 139 recipe families and 2,269 variants. It is separate from normal kit construction and occasional variable/style maintenance. Exported recipes do not establish native rendering, publication, consumer-update or page-assembly acceptance.

## Prerequisites

Install this toolkit with `npm ci`. Install the selected Mangrove source checkout using its own locked dependency workflow, build its source CSS, and run `npm run build:kit` here with `MANGROVE_SOURCE_ROOT` set to that checkout. Tokens, styles, source components, media and React dependencies remain owned by Mangrove.

Preparation requires an explicit source revision, the checked-in compact admission manifest and its SHA256, an approved reference index and its SHA256, and a successful committed-cache receipt and its SHA256. The reference prerelease contains the exact required inputs, indexed by checksum with per-path provenance and licence records. Public retrieval and complete cache admission have passed independent review; final fresh-checkout setup remains pending.

## Fetch reference inputs

Use the optional download command with an explicit source checkout, an existing external cache parent and a new download directory outside protected roots:

```sh
npm run fetch:references -- \
  --source-root /absolute/path/to/undrr-mangrove \
  --cache-parent /absolute/path/to/reference-cache-parent \
  --output /absolute/path/to/new-reference-download-directory
```

The command pins all nine release assets, verifies the index and provenance/licence sidecar, and admits all seven archives through the complete owned-cache verifier. It returns the exact `cacheAdmission` paths and checksums needed below. It preserves download and admission journals, including partial failures. Reference data is read-only; historical code proof is never executed. Retained UNKNOWN/unapproved provenance labels remain explicit and are not a blanket licence assignment.

The download command has 12 offline wrapper cases and 14 provider fixtures plus independent review. Actual public retrieval and complete 1,270-member cache admission have also passed independent review. Default maintenance and normal construction do not download this package.

## Prepare and export

Use canonical absolute paths. Choose a new output directory outside the source, toolkit and reference roots. Preparation verifies the complete 1,817-input manifest, the 1,270-member reference cache, local compiler dependencies, source-owned runtime dependencies, actual Git HEAD and clean source state before creating output.

```sh
npm run prepare:expanded -- \
  --source-root /absolute/path/to/undrr-mangrove \
  --source-revision ACTUAL_40_HEX_GIT_HEAD \
  --source-profile preserved-spike \
  --sidecar /absolute/path/to/undrr-mangrove-figma/contracts/expanded-inputs.compact.json \
  --sidecar-sha256 COMPACT_SHA256 \
  --index /absolute/path/to/reference-bundle-index.json \
  --index-sha256 INDEX_SHA256 \
  --cache-receipt /absolute/path/to/cache-admission-operation.json \
  --cache-receipt-sha256 RECEIPT_SHA256 \
  --output /absolute/path/to/new-output-directory
```

Here `--sidecar` means the compact input-admission manifest. The reference provenance/licence sidecar is a separate required reference-delivery input.

`preserved-spike` accepts only `d5e790d3b0318730fdbd270279f340f35a2833ab`. `thin-integration` checks the actual supplied Git revision and admits only the known source package and minimal workspace-lock changes, retaining the other 440 source pins. The thin upstream PR has not yet been committed. Its final supported revision and complete packet comparison remain pending. Four historical package/lock pins in AuthorImage, CodeBlock and Logo have a reviewed finite compatibility mapping. It checks real current source bytes against the admitted source row and permits only the known thin package/lock pairs. Other source checks and reference font/licence comparisons remain exact; immutable audit records retain their historical pins.

Preparation writes an ownership marker, expanded manifest, disabled configuration and preparation receipt. It does not invoke the exporter. Use the exact config path and checksum returned by successful preparation:

```sh
npm run export:expanded -- \
  --config /absolute/path/to/new-output-directory/inputs-config.json \
  --config-sha256 CONFIG_SHA256 \
  --execute
```

Export verifies the prepared configuration and current command modules, rechecks source/cache inputs, creates an exclusive attempt journal and invokes the existing exporter once. It retains stdout, stderr, terminal status, packet digest, final guards and an operation receipt. Failed operations retain their owned evidence. Existing packet files and attempts are refused; use a new directory for another attempt.

## Verified scope

The migrated full export at the preserved source checkpoint is byte-identical to the original: 210,368,334 bytes, SHA256 `f01e9a8e2700e3506c77f7dd0659b7f944e41f1703d01e0e7231b83bfa235b18`. That actual export used the independently reviewed migration runner. It does not by itself verify this newly adopted portable command end to end.

The portable commands have independent review covering complete real disabled preparations, 19 focused command/profile cases, two additional dependency/base negatives, four returned-Git ownership/metadata faults and 14 modeled export branches. Modeled branches do not count as actual exports. The finite Tag path mapping preserves the historical logical citation while reading the exact tracked lowercase source filename. Linux execution remains unverified.

Shared-command thin-source export and final checkout verification remain required before claiming the split is portable. See [split status](SPLIT-STATUS.md) and [native release gates](RELEASE-STATUS.md).
