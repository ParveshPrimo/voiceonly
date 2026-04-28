# Agent Instructions for Tavus Integration

When working on this project, adhere to the following conventions:

## Tavus API Management

- **Proxying**: All Tavus API calls MUST be proxied through the Express `server.ts`. Never call the Tavus API directly from the client to prevent API key exposure and to bypass CORS/timeout restrictions.
- **Timeouts**: The Tavus conversion endpoint `/v2/conversations` can take a significant amount of time (up to 90s) during replica provisioning. Ensure the server-side axios/fetch timeout is set to at least 100,000ms.
- **Retry Strategy**: 
    - The client (`App.tsx`) should implement a retry loop for 500-level errors.
    - If a `timeout` flag is returned from the server proxy, the client MUST treat this as a retryable event.
- **Error Objects**: Tavus errors can come back as strings or objects. Always use the safe parsing utility implemented in the log handlers to extract `data.error.message`.

## Deployment Rules

- The `start` script in `package.json` must run `tsx server.ts` or the equivalent production build to ensure the backend proxy is active.
- Port 3000 is the hardcoded application port.
