---
name: supabase-security
description: Supabase PostgreSQL production security: service-role isolation, environment hardening, and audit logging.
---

# SUPABASE SECURITY — SECURITY SKILL GUIDE

## 1. Domain Scope & Overview
Role minimization, service role protection, Postgres extension auditing, and connection encryption.

## 2. Authoritative References & Standards
- [https://supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [https://supabase.com/docs/guides/auth/auth-mfa](https://supabase.com/docs/guides/auth/auth-mfa)
- **OWASP ASVS 5.0 (Application Security Verification Standard)**: Level 2 Verified
- **OWASP Top 10 (2025/2021)**: Proactive Controls

## 3. Core Security Checklist
- [ ] **Verification**: Validate all inputs at canonical system boundaries.
- [ ] **Least Privilege**: Deny by default; grant explicit permissions only.
- [ ] **Timing-Safe Operations**: Use `crypto.timingSafeEqual` for secrets, hashes, and signatures.
- [ ] **Defense-in-Depth**: Layer edge WAF, application middleware, and storage encryption.
- [ ] **Audit Trail**: Maintain immutable event logs with zero sensitive PII exposure.

## 4. Audit & Verification Procedures
1. **Static Analysis**: Inspect source files for compliance using Semgrep and ESLint security plugins.
2. **Dynamic Testing**: Execute targeted verification requests against isolated staging instances.
3. **Boundary Check**: Ensure all external data is parsed through strict schemas (e.g., Zod / TypeScript regex).

## 5. Remediation Instructions
- If vulnerability detected: isolate affected route immediately.
- Apply patch following least-privilege and defense-in-depth principles.
- Verify resolution with automated unit tests and regression scans before production deployment.

## 6. Acceptance Criteria
- Zero critical or high severity vulnerabilities in scanning pipelines.
- All unit and integration security tests pass with 100% green status.
