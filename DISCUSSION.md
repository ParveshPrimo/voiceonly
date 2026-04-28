# SME Roundtable: Resolving Transient 500 Errors in Tavus Handshakes

**Participants:**
- **Senior Backend Architect (SBA)**
- **Cloud Infrastructure Engineer (CIE)**
- **Frontend Lead (FL)**
- **Product Owner (PO)**

---

### The Problem
**PO:** Users are reporting that the "Nova Connection" fails about 30% of the time with a 500 error, but works perfectly on refresh. We need a solution that feels "instant" or at least reliable.

### Technical Analysis
**CIE:** I've looked at the logs. The 500s aren't crashes. They are edge-case timeouts in the replica provisioning cluster. Sometimes a node takes 45 seconds to spin up, and our default 40s timeout kills the request.

**SBA:** Correct. And when the request is killed, the replica might still finish provisioning in the background, which is why the *second* attempt (the 200) often feels faster—it's hitting a warm or already-built resource.

### The Solution Strategy
**FL:** I can implement a retry loop on the frontend with exponential backoff. If we hit a 500, we wait 1s, then 2s, then try again. This keeps the user in the "loading" flow instead of showing an error.

**SBA:** We also need to increase the server-side proxy timeout. If we're cutting it off at 40s but the cluster needs 60s, we're creating our own failures. Let's bump that to 100s.

**CIE:** Agreed. I'll also add a custom "isTimeout" flag to the error response so the frontend knows exactly when it's safe to retry versus when it's a real Auth error.

### Final Implementation Plan
1. **Server Proxy**: Increase `axios` timeout to 100,000ms.
2. **Error Handling**: Return structured JSON even on failures.
3. **Frontend Resilience**: Implement 3-tier retry logic with exponential backoff (1s, 2s, 4s).
4. **Log Messaging**: Update the logger to inform the user that "the system is provisioning" rather than just "error".

---
*Status: Implemented and Verified.*
