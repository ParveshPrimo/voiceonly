# Changelog

## [1.1.0] - 2026-04-28

### Added
- **Resilience Layer**: Implemented a 3-tier exponential backoff retry strategy in `App.tsx` to handle transient server errors.
- **Enhanced Logging**: The session log now correctly differentiates between "Provisioning" states and terminal errors.
- **Proxy Intelligence**: Added an `isTimeout` flag to the server response to signal to the client when a retry is appropriate.
- **Documentation**: Added `DISCUSSION.md` capturing the SME roundtable logic and `AGENTS.md` for persistent integration rules.

### Fixed
- **Timeout Criticality**: Resolved "timeout of 40000ms exceeded" by increasing the server-side proxy timeout to 100,000ms, accommodating Tavus replica provisioning times.
- **Indeterminate 500s**: Improved reliability by treating 500-level status codes as retryable events rather than terminal failures.
- **Error Object Parsing**: Fixed a bug where nested Tavus error objects were not being rendered correctly in the UI.

### Technical Notes
- Server: Express (Node.js)
- Timeout: 100s
- Retry Logic: Max 3 attempts with exponential backoff (Attempt * 1000ms).
