# Nova AI - Tavus Professional Interface

This application provides a secure bridge to the Tavus cloud cluster, enabling real-time multimodal video conversations with AI replicas.

## Technical Architecture

- **Frontend**: React 18+ with Vite, Tailwind CSS for styling.
- **Backend**: Express server acting as a proxy to the Tavus API to protect sensitive API keys and handle long-running provisioning tasks.
- **Integration**: Tavus API v2 for conversation management.

## Solutions Implemented

### 1. Handling Indeterminate Status (500 vs 200)
Occasionally, the Tavus API may return a 500 Internal Server error or time out during the initial replica provisioning phase. This is often transient.
- **Client-Side Retry Logic**: The application implements an exponential backoff retry strategy in `App.tsx`.
- **Server-Side Timeout Extension**: The proxy timeout in `server.ts` has been extended to 100 seconds to accommodate slower provisioning cycles in the Tavus cluster.

### 2. Error Response Parsing
Enhanced the error handling to gracefully parse various response formats from the Tavus API, ensuring that clear feedback is provided in the session logs.

## Setup

1. Define `TAVUS_API_KEY` in your environment variables.
2. The proxy server runs on port 3000.
