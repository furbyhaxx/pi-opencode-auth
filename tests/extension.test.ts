import { describe, expect, test } from "bun:test";
import type {
  BeforeAgentStartEvent,
  BeforeProviderHeadersEvent,
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { ProviderHeaders } from "@earendil-works/pi-ai";
import opencodeAuth from "../index.ts";
import { CLI_USER_AGENT, ZEN_PROVIDER } from "../src/spoof.ts";

type Handler = (event: never, ctx: never) => unknown;

function loadExtension(): Map<string, Handler[]> {
  const handlers = new Map<string, Handler[]>();
  const pi = {
    on(event: string, handler: Handler): () => void {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return () => {};
    },
    registerProvider: (): void => {},
  } as unknown as ExtensionAPI;
  opencodeAuth(pi);
  return handlers;
}

async function fire(
  handlers: Map<string, Handler[]>,
  event: string,
  payload: unknown,
  ctx: unknown = {},
): Promise<void> {
  for (const handler of handlers.get(event) ?? []) {
    await handler(payload as never, ctx as never);
  }
}

function agentStart(selectedTools: string[]): BeforeAgentStartEvent {
  return {
    type: "before_agent_start",
    prompt: "hello",
    systemPrompt: "",
    systemPromptOptions: { selectedTools },
  } as unknown as BeforeAgentStartEvent;
}

function context(provider: string): ExtensionContext {
  return { model: { provider } } as unknown as ExtensionContext;
}

describe("Zen model sessions", () => {
  test("a Zen model's tool list is left exactly as the user configured it", async () => {
    const handlers = loadExtension();
    const event = agentStart(["read", "write"]);

    await fire(handlers, "before_agent_start", event, context(ZEN_PROVIDER));

    expect(event.systemPromptOptions.selectedTools).toEqual(["read", "write"]);
  });

  test("an explicitly emptied tool list stays empty for a Zen free model", async () => {
    const handlers = loadExtension();
    const event = agentStart([]);

    await fire(handlers, "before_agent_start", event, context(ZEN_PROVIDER));

    expect(event.systemPromptOptions.selectedTools).toEqual([]);
  });
});

describe("Zen provider headers", () => {
  test("the extension stamps the CLI identity on a Zen request", async () => {
    const handlers = loadExtension();
    const headers: ProviderHeaders = {
      "x-opencode-client": "pi",
      "User-Agent": "pi-coding-agent/0.87.1",
    };

    await fire(handlers, "before_provider_headers", {
      type: "before_provider_headers",
      headers,
    } as BeforeProviderHeadersEvent);

    expect(headers["User-Agent"]).toBe(CLI_USER_AGENT);
    expect(headers["x-opencode-client"]).toBe("cli");
    expect(headers["x-opencode-project"]).toBe("global");
    expect(headers["x-opencode-session"]).toMatch(/^ses_/);
    expect(headers["x-opencode-request"]).toMatch(/^msg_/);
  });
});
