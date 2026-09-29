import type { ProviderHeaders } from "@earendil-works/pi-ai";
import { createRequestId } from "./identifier.ts";

/** Provider ids whose requests OpenCode's backend treats as its own client. */
export const ZEN_PROVIDER = "opencode";
export const ZEN_GO_PROVIDER = "opencode-go";

/**
 * Zen's anonymous bearer. The keyed free-tier lane is refused upstream
 * ("Model access is disabled"), while the literal `public` bearer is accepted
 * as anonymous — this is also what the CLI itself sends when unauthenticated.
 */
export const ANONYMOUS_API_KEY = "public";

/**
 * Zen's free tier fingerprints the client: `User-Agent` must start with
 * `opencode/`, and `x-opencode-session` must be a native `ses_` ULID.
 */
export const CLI_USER_AGENT = "opencode/1.18.18";
export const CLI_PROJECT_ID = "global";

/** Zen's free tier also refuses requests whose tool list lacks these names. */
export const REQUIRED_TOOL_NAMES = ["bash", "read"] as const;

export function isZenProvider(provider: string | undefined): boolean {
  return provider === ZEN_PROVIDER || provider?.startsWith("opencode-") === true;
}

function findHeader(headers: ProviderHeaders, name: string): string | undefined {
  return Object.keys(headers).find((key) => key.toLowerCase() === name);
}

/**
 * Rewrite Pi's attribution stamp (`x-opencode-client: pi`, plus pi's own
 * session uuid) into the CLI's identity. The header set is the only signal the
 * hook gets, so pi's own stamp doubles as the "this is an OpenCode request"
 * marker. Mutates in place, as `before_provider_headers` expects.
 */
export function spoofOpenCodeHeaders(
  headers: ProviderHeaders,
  sessionId: string,
): boolean {
  if (
    findHeader(headers, "x-opencode-client") === undefined &&
    findHeader(headers, "x-opencode-session") === undefined
  ) {
    return false;
  }

  const set = (name: string, value: string): void => {
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === name.toLowerCase()) delete headers[key];
    }
    headers[name] = value;
  };

  set("User-Agent", CLI_USER_AGENT);
  set("x-opencode-client", "cli");
  set("x-opencode-project", CLI_PROJECT_ID);
  set("x-opencode-session", sessionId);
  set("x-opencode-request", createRequestId());
  return true;
}

/** Adds the tool names Zen's free tier demands, keeping the caller's order. */
export function withRequiredTools(selected: readonly string[]): string[] {
  return [...new Set([...selected, ...REQUIRED_TOOL_NAMES])];
}
