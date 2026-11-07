const fs = require('fs');
const path = require('path');

const targetProjectDir = path.resolve(__dirname, 'skills');
const targetConfigDir = 'C:\\Users\\tarik\\.gemini\\config\\skills';

const skills = [
  {
    name: 'web-application-security',
    description: 'Enterprise web application security based on OWASP Top 10 (2025/2021), ASVS 5.0 Level 2 controls, and WSTG.',
    references: [
      'https://owasp.org/Top10/',
      'https://github.com/OWASP/ASVS',
      'https://github.com/OWASP/wstg',
      'https://cheatsheetseries.owasp.org/'
    ],
    scope: 'General web application vulnerability assessment, defense-in-depth, input sanitization, and header hardening.'
  },
  {
    name: 'nextjs-security',
    description: 'Next.js App Router security architecture: Server Actions CSRF, Image Optimization hardening, and SSRF prevention.',
    references: [
      'https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy',
      'https://github.com/advisories/GHSA-2xp9-vwfh-vxw4',
      'https://github.com/advisories/GHSA-2464-fhr4-w9xw'
    ],
    scope: 'Next.js App Router, SSR hydration safety, NextImage SVG disablement, and Server Actions boundary validation.'
  },
  {
    name: 'api-security',
    description: 'REST and Serverless API security: timing attack defense, cryptographic HMAC validation, and rate limiting.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
      'https://owasp.org/www-project-api-security/'
    ],
    scope: 'Endpoint sanitization, payload size bounds, rate limiting, and timing-safe cryptographic comparisons.'
  },
  {
    name: 'supabase-security',
    description: 'Supabase PostgreSQL production security: service-role isolation, environment hardening, and audit logging.',
    references: [
      'https://supabase.com/docs/guides/database/postgres/row-level-security',
      'https://supabase.com/docs/guides/auth/auth-mfa'
    ],
    scope: 'Role minimization, service role protection, Postgres extension auditing, and connection encryption.'
  },
  {
    name: 'database-rls-security',
    description: 'PostgreSQL Row-Level Security (RLS) policies: customer data isolation, tenant boundaries, and ownership predicates.',
    references: [
      'https://www.postgresql.org/docs/current/ddl-rowsecurity.html',
      'https://supabase.com/docs/guides/database/postgres/row-level-security'
    ],
    scope: 'Table-level RLS enablement, SELECT/UPDATE/INSERT ownership checks, and bypass-proof views.'
  },
  {
    name: 'cloudflare-security',
    description: 'Cloudflare edge protection: WAF managed rules, DDoS mitigation, Turnstile CAPTCHA, and edge rate limiting.',
    references: [
      'https://developers.cloudflare.com/waf/',
      'https://developers.cloudflare.com/turnstile/'
    ],
    scope: 'Edge firewalling, bot fighting, webhook path bypass exceptions, and SSL/TLS 1.3 configuration.'
  },
  {
    name: 'vercel-security',
    description: 'Vercel deployment security: environment variable scoping, security headers, preview deployment guards, and CORS.',
    references: [
      'https://vercel.com/docs/security',
      'https://vercel.com/docs/edge-network/headers'
    ],
    scope: 'Environment secret segregation, serverless timeout hardening, edge middleware protection, and HSTS.'
  },
  {
    name: 'payment-security',
    description: 'Payment gateway integration security: Razorpay & Cashfree HMAC signatures, replay prevention, and price integrity.',
    references: [
      'https://razorpay.com/docs/webhooks/validate-test/',
      'https://docs.cashfree.com/docs/webhook-verification',
      'https://famgateway.in/docs.md'
    ],
    scope: 'Server-side authoritative pricing, webhook replay windows (<300s), and idempotent order state machines.'
  },
  {
    name: 'ebook-file-security',
    description: 'Private object storage security: Cloudflare R2 bucket isolation, short-lived signed URLs, and path traversal defense.',
    references: [
      'https://developers.cloudflare.com/r2/',
      'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html'
    ],
    scope: 'Zero public bucket permissions, tokenized proxy downloads, and canonical filesystem boundaries.'
  },
  {
    name: 'pdf-epub-security',
    description: 'Ebook reader sandbox security: PDF.js & EPUB.js iframe isolation, XML/SVG entity sanitization, and canvas watermarking.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox'
    ],
    scope: 'Iframe sandbox directives, ZIP bomb inspection for EPUBs, and tamper-resistant dynamic canvas watermarks.'
  },
  {
    name: 'authentication-security',
    description: 'Authentication architecture: admin session management, timing-safe secrets, and brute-force throttling.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
      'https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html'
    ],
    scope: 'Session invalidation, multi-factor authentication, secure cookie flags, and credential stuffing defense.'
  },
  {
    name: 'authorization-security',
    description: 'Authorization & Access Control: BOLA/IDOR prevention, order-to-book manifest binding, and least-privilege roles.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
      'https://owasp.org/www-project-api-security/'
    ],
    scope: 'Object-level ownership verification, download token manifest validation, and privilege escalation prevention.'
  },
  {
    name: 'dependency-security',
    description: 'Software supply-chain security: lockfile auditing, SBOM generation, and automated CVE remediation via Trivy & Renovate.',
    references: [
      'https://github.com/aquasecurity/trivy',
      'https://github.com/renovatebot/renovate'
    ],
    scope: 'NPM dependency auditing, indirect dependency vulnerability triage, and malicious package detection.'
  },
  {
    name: 'secret-management',
    description: 'Enterprise secret hygiene: Gitleaks pre-commit hooks, CI/CD secret scanning, and appinfo11.txt credential standards.',
    references: [
      'https://github.com/gitleaks/gitleaks',
      'https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html'
    ],
    scope: 'Zero hardcoded secrets, environment variable rotation, dummy placeholder templates, and git history scrubbing.'
  },
  {
    name: 'security-testing',
    description: 'Continuous security testing: Semgrep AST rulesets, OWASP ZAP baseline DAST, and Nuclei vulnerability templates.',
    references: [
      'https://github.com/semgrep/semgrep',
      'https://github.com/zaproxy/zaproxy',
      'https://github.com/projectdiscovery/nuclei'
    ],
    scope: 'Automated CI/CD security pipelines, staging DAST scans, and regression test suites.'
  },
  {
    name: 'incident-response',
    description: 'Cybersecurity incident response: compromise containment, emergency credential rotation, and forensic rollback.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html',
      'https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final'
    ],
    scope: 'Detection, containment, eradication, recovery, and post-incident root-cause analysis.'
  },
  {
    name: 'backup-recovery',
    description: 'Disaster recovery and backup resilience: Cloudflare R2 object replication, catalog snapshots, and recovery drills.',
    references: [
      'https://developers.cloudflare.com/r2/data-security/',
      'https://www.postgresql.org/docs/current/backup.html'
    ],
    scope: 'Immutable database dumps, versioned storage buckets, RPO/RTO verification, and credential recovery.'
  },
  {
    name: 'privacy-compliance',
    description: 'Customer privacy engineering: zero-trace architecture, PII minimization, and GDPR/DPDP alignment.',
    references: [
      'https://gdpr.eu/',
      'https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html'
    ],
    scope: 'Zero unnecessary telemetry, ephemeral session tokens, customer right-to-erasure, and anonymized logs.'
  }
];

function generateSkillContent(skill) {
  return `---
name: ${skill.name}
description: ${skill.description}
---

# ${skill.name.toUpperCase().replace(/-/g, ' ')} — SECURITY SKILL GUIDE

## 1. Domain Scope & Overview
${skill.scope}

## 2. Authoritative References & Standards
${skill.references.map(r => `- [${r}](${r})`).join('\n')}
- **OWASP ASVS 5.0 (Application Security Verification Standard)**: Level 2 Verified
- **OWASP Top 10 (2025/2021)**: Proactive Controls

## 3. Core Security Checklist
- [ ] **Verification**: Validate all inputs at canonical system boundaries.
- [ ] **Least Privilege**: Deny by default; grant explicit permissions only.
- [ ] **Timing-Safe Operations**: Use \`crypto.timingSafeEqual\` for secrets, hashes, and signatures.
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
`;
}

// Generate for project and global config
for (const skill of skills) {
  const content = generateSkillContent(skill);

  // Project skill directory
  const projSkillDir = path.join(targetProjectDir, skill.name);
  fs.mkdirSync(projSkillDir, { recursive: true });
  fs.writeFileSync(path.join(projSkillDir, 'SKILL.md'), content, 'utf8');

  // Config skill directory
  const cfgSkillDir = path.join(targetConfigDir, skill.name);
  fs.mkdirSync(cfgSkillDir, { recursive: true });
  fs.writeFileSync(path.join(cfgSkillDir, 'SKILL.md'), content, 'utf8');
}

console.log(`Successfully generated and installed ${skills.length} security skills!`);
