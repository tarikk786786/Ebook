# SECURITY_INCIDENT_RESPONSE.md — Incident Response Plan & Disaster Recovery
**Platform:** AnonTrove Ebook Commerce Platform (`projects/anon-trove-ebooks`)  
**Standard:** NIST SP 800-61 Rev. 2 / ISO 27035  
**Version:** 1.0.0  
**Effective Date:** 2026-11-08

---

## 1. Incident Classification & Severity Matrix

| Severity Level | Definition | Example Scenarios | Response SLA | Escalation Target |
| :--- | :--- | :--- | :---: | :--- |
| **SEV-1 (CRITICAL)** | Active exploitation of critical vulnerability, data breach, unauthorized admin access, or payment disruption. | - Exposed `ADMIN_ACCESS_SECRET` in wild<br/>- Unchecked payment webhook tampering<br/>- Bulk unmetered ebook exfiltration | **< 15 minutes** | Lead Security Engineer & Store Owner |
| **SEV-2 (HIGH)** | Vulnerability identified with high impact, partial service degradation, or elevated anomaly alerts. | - Elevated 401/403 rates on `/api/poll`<br/>- Webhook HMAC failures spike<br/>- Storage provider outage | **< 1 hour** | Application Security Team |
| **SEV-3 (MEDIUM)** | Low-impact vulnerability, single abnormal user transaction, or minor configuration drift. | - Flawed CSP report<br/>- Failed local storage sync | **< 24 hours** | Development Team |
| **SEV-4 (LOW)** | Security scanner warning, minor dependency advisory, or non-exploitable edge case. | - Outdated dev dependency<br/>- Scorecard recommendation | **< 1 week** | Maintenance Sprint |

---

## 2. Four-Phase Incident Response Lifecycle

### Phase 1: Detection & Triage
1. **Alert Sources**:
   - Vercel runtime error logs and HTTP 4xx/5xx spikes.
   - GitHub Security Dependabot alerts and Gitleaks pre-commit/CI detections.
   - FamGateway webhook status discrepancies.
2. **Immediate Triage Actions**:
   - Determine incident scope: Is production compromised? Are tokens leaked?
   - Tag incident severity according to matrix above.
   - Record timestamped incident entry in `SECURITY_REMEDIATION_LOG.md`.

### Phase 2: Containment & Isolation
1. **Compromised Credentials**:
   - If `ADMIN_ACCESS_SECRET` is suspected of leakage:
     - Generate a new 64-character cryptographically random secret (`openssl rand -hex 32`).
     - Immediately update Vercel environment variables (`vercel env add ADMIN_ACCESS_SECRET production`).
     - Trigger immediate zero-downtime redeployment.
   - If `DOWNLOAD_ENCRYPTION_SECRET` is compromised:
     - Rotate secret in Vercel. All existing download tokens will immediately decay and invalidate, preventing further unauthorized downloads.
2. **Abuse / DoS Throttling**:
   - Block malicious IP ranges via Vercel Firewall / WAF or update `middleware.ts` blocklist.
   - Temporarily reduce edge rate limits for affected routes.

### Phase 3: Eradication & Remediation
1. Identify the root cause (e.g. BOLA in `/api/poll` or unverified webhook signature).
2. Author minimal, surgical patch in git branch.
3. Execute automated regression suite locally to ensure zero side-effects.
4. Merge to `main` and verify production deployment.

### Phase 4: Recovery & Post-Incident Review
1. Confirm normal storefront and checkout operation via live synthetic probe.
2. Complete Post-Mortem Report detailing:
   - Root cause timeline.
   - Total impact (orders affected, assets accessed).
   - Permanent preventative controls added to AGENTS.md or automated test suites.
