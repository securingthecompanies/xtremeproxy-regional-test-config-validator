import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const SESSION_MODES = new Set(["rotating", "sticky"]);
const MARKET_PATTERN = /^[A-Z]{2}$/;
const ENV_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function validateConfig(input) {
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["configuration must be a JSON object"] };
  }

  const market = typeof input.market === "string" ? input.market.trim().toUpperCase() : "";
  if (!MARKET_PATTERN.test(market)) errors.push("market must be a two-letter code");

  if (!SESSION_MODES.has(input.sessionMode)) {
    errors.push("sessionMode must be rotating or sticky");
  }

  if (input.sessionMode === "sticky") {
    if (!Number.isInteger(input.stickyMinutes) || input.stickyMinutes < 1 || input.stickyMinutes > 60) {
      errors.push("stickyMinutes must be an integer from 1 to 60 in sticky mode");
    }
  }

  const allowedHosts = Array.isArray(input.allowedHosts)
    ? [...new Set(input.allowedHosts.map((host) => String(host).trim().toLowerCase()).filter(Boolean))]
    : [];
  if (allowedHosts.length === 0) errors.push("allowedHosts must contain at least one hostname");

  let targetUrl;
  try {
    targetUrl = new URL(input.targetUrl);
    if (targetUrl.protocol !== "https:") errors.push("targetUrl must use HTTPS");
    if (targetUrl.username || targetUrl.password) errors.push("targetUrl must not contain credentials");
    if (!allowedHosts.includes(targetUrl.hostname.toLowerCase())) {
      errors.push("targetUrl hostname must appear in allowedHosts");
    }
  } catch {
    errors.push("targetUrl must be a valid absolute URL");
  }

  if (typeof input.credentialEnv !== "string" || !ENV_PATTERN.test(input.credentialEnv)) {
    errors.push("credentialEnv must name an uppercase environment variable");
  }

  const evidence = input.evidence;
  for (const field of ["captureTimestamp", "captureFinalUrl", "captureStatusCode"]) {
    if (!evidence || typeof evidence[field] !== "boolean") {
      errors.push(`evidence.${field} must be boolean`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      market,
      sessionMode: input.sessionMode,
      ...(input.sessionMode === "sticky" ? { stickyMinutes: input.stickyMinutes } : {}),
      targetUrl: targetUrl.toString(),
      allowedHosts,
      credentialEnv: input.credentialEnv,
      evidence: {
        captureTimestamp: evidence.captureTimestamp,
        captureFinalUrl: evidence.captureFinalUrl,
        captureStatusCode: evidence.captureStatusCode
      }
    }
  };
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("usage: node src/validate-config.mjs <config.json>");
  const input = JSON.parse(await readFile(configPath, "utf8"));
  const result = validateConfig(input);
  if (!result.ok) {
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(result.value, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
