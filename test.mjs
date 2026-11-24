import assert from "node:assert/strict";
import { validateConfig } from "./src/validate-config.mjs";

const base = {
  market: "CA",
  sessionMode: "sticky",
  stickyMinutes: 10,
  targetUrl: "https://example.com/storefront",
  allowedHosts: ["example.com"],
  credentialEnv: "REGIONAL_PROXY_URL",
  evidence: {
    captureTimestamp: true,
    captureFinalUrl: true,
    captureStatusCode: true
  }
};

assert.equal(validateConfig(base).ok, true);
assert.equal(validateConfig({ ...base, market: "canada" }).ok, false);
assert.equal(validateConfig({ ...base, targetUrl: "http://example.com/" }).ok, false);
assert.equal(validateConfig({ ...base, targetUrl: "https://user:pass@example.com/" }).ok, false);
assert.equal(validateConfig({ ...base, targetUrl: "https://example.org/" }).ok, false);
assert.equal(validateConfig({ ...base, stickyMinutes: 0 }).ok, false);
assert.equal(validateConfig({ ...base, credentialEnv: "proxy-password" }).ok, false);

const rotating = validateConfig({ ...base, sessionMode: "rotating", stickyMinutes: undefined });
assert.equal(rotating.ok, true);
assert.equal("stickyMinutes" in rotating.value, false);

console.log("8/8 validation checks passed");
