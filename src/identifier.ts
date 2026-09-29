/**
 * OpenCode's native identifier format, mirrored from the CLI
 * (`packages/schema/src/identifier.ts`): a 26-char ULID — 6 hex timestamp
 * bytes followed by 14 base62 random chars. Session ids are descending,
 * message (request) ids ascending.
 */
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

let lastTimestamp = 0;
let counter = 0;

function ulid(descending: boolean, timestamp: number): string {
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp;
    counter = 0;
  }
  counter += 1;

  const current = BigInt(timestamp) * 0x1000n + BigInt(counter);
  const value = descending ? ~current : current;
  const time = Array.from({ length: 6 }, (_, index) =>
    Number((value >> BigInt(40 - 8 * index)) & 0xffn)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return time + Array.from(bytes, (byte) => CHARS[byte % 62]).join("");
}

/** `ses_` + descending ULID, the value the CLI sends as `x-opencode-session`. */
export function createSessionId(now: number = Date.now()): string {
  return `ses_${ulid(true, now)}`;
}

/** `msg_` + ascending ULID, the user-message id the CLI sends as `x-opencode-request`. */
export function createRequestId(now: number = Date.now()): string {
  return `msg_${ulid(false, now)}`;
}
