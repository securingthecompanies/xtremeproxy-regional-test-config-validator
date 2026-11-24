# Regional Test Configuration Validator

This small, dependency-free Node.js utility validates a non-secret contract for authorized regional web testing. It checks the market label, session mode, HTTPS destination allowlist, environment-variable reference and minimum evidence fields before a networked test begins.

```bash
node src/validate-config.mjs examples/regional-test.config.json
node test.mjs
```

The documentation source lives in `docs/index.mdx`; `docs.json` is ready for docs.page rendering from a public GitHub repository. The validator does not make requests, read credentials or claim that a route belongs to a location.
