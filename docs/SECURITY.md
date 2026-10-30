# Security Architecture & Threat Mitigations — Chaos to Solution (CTS)

## Overview

Chaos to Solution (CTS) incorporates defense-in-depth protections designed to safeguard against Server-Side Request Forgery (SSRF), DNS rebinding (TOCTOU), denial-of-service via unbounded responses, timing attacks, and credential leakage.

---

## 1. Server-Side Request Forgery (SSRF) Protection

When the AI engine suggests an external online API or documentation URL, `resourceVerifier.js` tests its reachability through `ssrfValidator.js` and `safeFetcher.js`:

### DNS Resolution & IP Blocklist
Before any connection is initiated, the hostname is resolved to all associated IPv4 and IPv6 addresses. If any resolved address falls into prohibited ranges, the request is immediately aborted with `SSRF_PROHIBITED`:
- **IPv4 Private Subnets (RFC 1918)**:
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
- **Loopback**: `127.0.0.0/8` and `::1`
- **Link-Local & Cloud Metadata**:
  - `169.254.0.0/16` (including `169.254.169.254` AWS/GCP/Azure instance metadata)
  - `fe80::/10`
- **Carrier-Grade NAT & Test Networks**: `100.64.0.0/10`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`.

### DNS Rebinding Mitigation (TOCTOU)
To prevent Time-of-Check to Time-of-Use DNS rebinding:
- `safeFetcher.js` pins the verified IP address during socket creation.
- Outbound HTTP/HTTPS connections connect directly to the pinned IP while preserving the `Host` header for TLS SNI and virtual hosting.

---

## 2. Safe Fetching & DoS Defenses

External resource checks enforce strict physical limits:
- **Strict Timeouts**: Socket connection, TLS handshake, and response reading are bounded to **4,000 ms**.
- **Response Size Capping**: Inbound streams are monitored via byte-counting transforms and truncated/aborted if they exceed **512 KB** (`OVERSIZED_RESPONSE`), preventing memory exhaustion.
- **Redirect Validation**: Follows a maximum of **3 redirects**. Every redirect location header is re-validated against the SSRF IP blocklist before following.

---

## 3. Operator Authentication & Timing Attack Defense

Operator endpoints (`DELETE /api/teams/:id`, `POST /api/event-timer/*`) require `EVENT_ADMIN_TOKEN`:
- **Constant-Time Verification**: Uses `crypto.timingSafeEqual` over SHA-256 digested tokens. This eliminates timing side-channel leakage regardless of token length.
- **Ephemeral In-Memory Handling**: The React frontend captures the operator token via an on-demand modal dialog, maintaining it purely in component state during the action. The token is **never persisted** to `localStorage`, `sessionStorage`, cookies, or analytics.

---

## 4. API Input Validation & Sanitization

- **Theme Whitelist**: Validates theme against an explicit frozen array of 8 approved themes.
- **Team Name Bounds**: Rejects strings shorter than 2 or longer than 50 characters, trimming control characters and normalizing casing.
- **Output Sanitization**: MongoDB connection strings are sanitized via `sanitizeMongoUri` before any logging occurs, stripping user credentials.

---

## 5. Deployment & Secret Isolation

- **Zero Secret Commits**: `.gitignore` strictly excludes `.env`, `node_modules`, and temporary build artifacts.
- **Environment Separation**: API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `EVENT_ADMIN_TOKEN`) and database URIs (`MONGODB_URI`) are injected at runtime via platform secrets (Render, Vercel).
- **Least Privilege**: MongoDB user is scoped to the specific application database with no cluster administration permissions.
