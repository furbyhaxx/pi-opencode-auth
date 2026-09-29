import { describe, expect, test } from "bun:test";
import type { ProviderHeaders } from "@earendil-works/pi-ai";
import {
  ANONYMOUS_API_KEY,
  CLI_USER_AGENT,
  isZenProvider,
  spoofOpenCodeHeaders,
  withRequiredTools,
  ZEN_GO_PROVIDER,
  ZEN_PROVIDER,
} from "../src/spoof.ts";

const PI_STAMP: ProviderHeaders = {
  "x-opencode-session": "3f2a1c7e-9b44-4d10-8a55-6c1d2e3f4a5b",
  "x-opencode-client": "pi",
  "User-Agent": "pi-coding-agent/0.87.1",
};

describe("spoofOpenCodeHeaders", () => {
  test("replaces pi's attribution stamp with the CLI identity", () => {
    const headers: ProviderHeaders = { ...PI_STAMP };
    expect(spoofOpenCodeHeaders(headers, "ses_test")).toBe(true);
    expect(headers["User-Agent"]).toBe(CLI_USER_AGENT);
    expect(headers["x-opencode-client"]).toBe("cli");
    expect(headers["x-opencode-session"]).toBe("ses_test");
    expect(headers["x-opencode-project"]).toBe("global");
    expect(headers["x-opencode-request"]).toMatch(/^msg_/);
  });

  test("keeps credential and unrelated headers untouched", () => {
    const headers: ProviderHeaders = { ...PI_STAMP, Authorization: "Bearer secret", Accept: "*/*" };
    spoofOpenCodeHeaders(headers, "ses_test");
    expect(headers["Authorization"]).toBe("Bearer secret");
    expect(headers["Accept"]).toBe("*/*");
    expect(ANONYMOUS_API_KEY).toBe("public");
  });

  test("replaces a differently cased existing header instead of duplicating it", () => {
    const headers: ProviderHeaders = { ...PI_STAMP, "user-agent": "pi-coding-agent/0.87.1" };
    spoofOpenCodeHeaders(headers, "ses_test");
    expect(Object.keys(headers).filter((k) => k.toLowerCase() === "user-agent")).toEqual([
      "User-Agent",
    ]);
  });

  test("leaves non-OpenCode requests alone", () => {
    const headers: ProviderHeaders = { "x-session-affinity": "abc", "User-Agent": "pi-coding-agent/0.87.1" };
    expect(spoofOpenCodeHeaders(headers, "ses_test")).toBe(false);
    expect(headers).toEqual({
      "x-session-affinity": "abc",
      "User-Agent": "pi-coding-agent/0.87.1",
    });
  });

  test("still spoofs when pi's client stamp is the only marker", () => {
    const headers: ProviderHeaders = { "x-opencode-client": "pi" };
    expect(spoofOpenCodeHeaders(headers, "ses_test")).toBe(true);
    expect(headers["x-opencode-session"]).toBe("ses_test");
  });
});

describe("isZenProvider", () => {
  test("matches the built-in Zen providers and nothing else", () => {
    expect(isZenProvider(ZEN_PROVIDER)).toBe(true);
    expect(isZenProvider(ZEN_GO_PROVIDER)).toBe(true);
    expect(isZenProvider("opencode-free")).toBe(true);
    expect(isZenProvider("anthropic")).toBe(false);
    expect(isZenProvider(undefined)).toBe(false);
  });
});

describe("withRequiredTools", () => {
  test("adds the tool names Zen's free tier requires", () => {
    expect(withRequiredTools(["read", "edit"])).toEqual(["read", "edit", "bash"]);
  });

  test("keeps order and does not duplicate names", () => {
    expect(withRequiredTools(["bash", "write", "read"])).toEqual(["bash", "write", "read"]);
  });

  test("does not mutate the caller's list", () => {
    const selected = ["write"];
    withRequiredTools(selected);
    expect(selected).toEqual(["write"]);
  });
});
