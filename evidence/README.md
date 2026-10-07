# Evidence and references

The bulk upstream evidence is intentionally not copied into Git. `index.json` records its current locations and migration status; entries without a download URL are historical locators, not fetchable dependencies.

Future release assets must carry exact filenames, byte sizes, SHA256 checksums, source revisions, provenance/licences and retrieval URLs. Preserve negative evidence as well as successful checks. Separate packages needed by executable recipes from historical validation records. Do not advertise a complete portable reference package until its dependency closure and clean-download workflow are verified.

The initial maintenance entry requires no `holistic/assets` package. Expanded source recipes often do; migrate those dependencies together with their callers.
