# Security Policy

The **Chaos to Solution (CTS)** team takes security seriously. We appreciate the responsible disclosure of any vulnerabilities found in the project.

---

## Supported Versions

Security updates and bug fixes are applied to the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| `1.0.x` (main) | :white_check_mark: |
| `< 1.0` | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability:
1. Use GitHub's private vulnerability reporting feature:
   - Navigate to the **Security** tab of the [Chaos_To_Solution repository](https://github.com/safiya-18/Chaos_To_Solution/security).
   - Under **Reporting**, click **Report a vulnerability** to open an advisory draft.
2. Provide a detailed summary including:
   - Type of issue (e.g., SSRF, authentication bypass, timing attack, denial of service).
   - Step-by-step instructions to reproduce the vulnerability.
   - Any proof-of-concept scripts or payload examples (without public release).
   - Affected components, endpoints, or environment conditions.
3. The maintainers will acknowledge receipt of your report, investigate the issue, and coordinate a fix and release advisory.

---

## Technical Security Architecture

For detailed documentation on the technical defenses implemented in CTS—including SSRF validation, DNS rebinding mitigation, IP-pinned fetching, response-size bounding, and constant-time operator authentication—please refer to the [Technical Security Guide](./docs/SECURITY.md).
