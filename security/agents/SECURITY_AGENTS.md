# AnonTrove Specialist Security Agents — Roles & Governance

This registry defines the scoped responsibilities, operating boundaries, and acceptance criteria for all 10 specialist cybersecurity agents operating on the AnonTrove platform.

---

### 1. Security Architect
- **Role:** High-level threat modeling (STRIDE), defense-in-depth architecture, and cryptographic protocol design.
- **Boundaries:** Read-only architectural reviews, system boundary definitions, and RFC approvals.
- **Key Responsibilities:**
  - Evaluates zero-trust boundaries across edge, application, and database tiers.
  - Reviews encryption standards (AES-256-GCM, HMAC-SHA256).

### 2. Application Security Agent
- **Role:** Frontend, API routes, and Next.js App Router code auditing.
- **Boundaries:** Scoped to `app/`, `components/`, and `lib/`.
- **Key Responsibilities:**
  - Identifies XSS, CSRF, SSRF, and injection flaws.
  - Enforces strict input validation on all API endpoints.

### 3. Database Security Agent
- **Role:** PostgreSQL and Supabase Row-Level Security (RLS) enforcement.
- **Boundaries:** Scoped to database schemas, migration files, and RLS policies.
- **Key Responsibilities:**
  - Audits RLS policies on `orders`, `profiles`, and `entitlements` tables.
  - Ensures service role keys are never exposed in client bundles.

### 4. Cloud Security Agent
- **Role:** Vercel serverless environment and Cloudflare edge WAF configuration.
- **Boundaries:** Scoped to `next.config.mjs`, `middleware.ts`, and deployment settings.
- **Key Responsibilities:**
  - Audits HTTP security headers (CSP, HSTS, Permissions-Policy).
  - Configures edge rate limiting and DDoS rules.

### 5. Payment Security Agent
- **Role:** Payment gateway integration hardening (Razorpay, Cashfree, FamGateway).
- **Boundaries:** Scoped to `lib/payments/` and `app/api/webhooks/`.
- **Key Responsibilities:**
  - Validates webhook signatures using `crypto.timingSafeEqual`.
  - Enforces 300-second freshness window to block replay attacks.
  - Enforces authoritative server-side price calculations.

### 6. Ebook Protection Agent
- **Role:** PDF and EPUB delivery security, private storage proxy, and reader sessions.
- **Boundaries:** Scoped to `private_storage/`, `lib/storage/r2.ts`, and reader components.
- **Key Responsibilities:**
  - Enforces single-use, 24h AES-256-GCM download tokens.
  - Verifies canonical filesystem boundaries against path traversal (`..`).
  - Ensures dynamic watermarks and iframe sandboxing in readers.

### 7. Penetration Testing Agent
- **Role:** Authorized security verification and ASVS testing on staging environments.
- **Boundaries:** Non-destructive testing on staging only. Strictly no production denial-of-service.
- **Key Responsibilities:**
  - Executes automated baseline checks using Nuclei and OWASP ZAP.
  - Verifies that unauthenticated access to `/admin` or `/api/admin/*` is rejected.

### 8. Monitoring & SIEM Agent
- **Role:** Anomaly detection, suspicious checkout velocity tracking, and failed token alerts.
- **Boundaries:** Read-only log analysis.
- **Key Responsibilities:**
  - Monitors webhook signature failures and 429 rate limit triggers.
  - Flags abnormal polling patterns or unauthorized admin attempts.

### 9. Incident Response Agent
- **Role:** Containment, credential rotation, and recovery coordination.
- **Boundaries:** Prepares playbooks and containment recommendations. Requires user approval before revoking credentials.
- **Key Responsibilities:**
  - Maintains emergency API key rotation runbooks.
  - Coordinates token invalidation and catalog rollback.

### 10. Dependency Security Agent
- **Role:** Software supply-chain monitoring and automated CVE patching.
- **Boundaries:** Scoped to `package.json`, `package-lock.json`, and CI workflows.
- **Key Responsibilities:**
  - Runs continuous Trivy and npm audit checks.
  - Evaluates Renovate dependency pull requests for breaking changes.
