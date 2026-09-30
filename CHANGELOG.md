# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-30

### Changed

- The extension no longer adds `bash` and `read` to a session's tool list when a
  Zen model is selected. That list is both the request tool list and the
  executable tool set, so selecting a Zen free model silently re-activated tools
  the user had deactivated for the session — for the rest of the process and
  again on resume, where the added tools were restored from the transcript. If
  Zen refuses a request whose tool list lacks those names, the request now fails
  instead of the tool roster being widened behind the user's back.
- Removed the now-unused `withRequiredTools`, `REQUIRED_TOOL_NAMES` and
  `isZenProvider` helpers from `src/spoof.ts`.

### Unchanged

- The OpenCode CLI identity spoofing: `User-Agent`, `x-opencode-client`,
  `x-opencode-project`, the per-session `ses_` ULID and the per-request `msg_`
  ULID are sent exactly as before.
- The anonymous `public` bearer is still registered for a Zen provider that has
  no credential, and a configured or stored Zen key still wins.
