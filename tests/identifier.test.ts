import { describe, expect, test } from "bun:test";
import { createRequestId, createSessionId } from "../src/identifier.ts";

describe("OpenCode identifiers", () => {
  test("session ids are ses_ + descending ULID", () => {
    const id = createSessionId();
    expect(id).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/);
    expect(id.length).toBe(4 + 26);
  });

  test("request ids are msg_ + ascending ULID", () => {
    expect(createRequestId()).toMatch(/^msg_[0-9a-f]{12}[0-9A-Za-z]{14}$/);
  });

  test("descending ids shrink and ascending ids grow within one timestamp", () => {
    const at = 1_790_000_000_000;
    const firstSession = createSessionId(at);
    const secondSession = createSessionId(at);
    expect(secondSession < firstSession).toBe(true);

    const firstRequest = createRequestId(at);
    const secondRequest = createRequestId(at);
    expect(secondRequest > firstRequest).toBe(true);
  });
});
