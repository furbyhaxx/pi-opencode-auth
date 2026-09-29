# pi-opencode-auth

Makes Pi's built-in **OpenCode Zen** (`opencode`) and **OpenCode Go** (`opencode-go`) providers look like the OpenCode CLI, so Zen's free models answer instead of returning:

```
403 FreeTierError: OpenCode's free tier can only be used from within OpenCode
```

## What it patches

| Layer | Pi sends by default | Extension sends |
| --- | --- | --- |
| `User-Agent` | `pi-coding-agent/...` | `opencode/1.18.18` |
| `x-opencode-client` | `pi` | `cli` |
| `x-opencode-session` | pi session uuid | `ses_` + descending ULID, stable per pi session |
| `x-opencode-request` | *(absent)* | `msg_` + ascending ULID, per request |
| `x-opencode-project` | *(absent)* | `global` |
| Tools | user's active roster | roster + `bash` and `read` (Zen refuses requests without them) |
| `Authorization` | configured/stored Zen key | unchanged when a key exists, `Bearer public` when there is none |

Zen's gate checks the request, not the account: the same request with a real key and with the anonymous `public` bearer both pass once the fingerprint matches. The gate is also satisfied by pi's streaming request shape, which every agent turn uses.

## Install

```
pi install /home/furbyhaxx/.pi/extensions/pi-opencode-auth
```

Or load it ad hoc (no settings change): `pi -e /home/furbyhaxx/.pi/extensions/pi-opencode-auth/index.ts --model opencode/big-pickle`.

## Usage

Pick any free model, e.g. `opencode/big-pickle`, `opencode/nemotron-3.5-lightning-free`, `opencode/muse-spark-1.3-contributor-free`. No login needed: without a Zen credential the extension registers the anonymous `public` bearer so the provider's models are selectable at all. With `OPENCODE_API_KEY` or a stored credential, that credential wins and paid models keep working.

Free models in Pi's snapshot are `big-pickle` and the `*-free` entries. Zen ships models between Pi releases; those appear only once Pi's catalog carries them.

## Development

```
bun run check      # tsc --noEmit && bun test
```

Load a local change with `pi -e ./index.ts`.
