# SECURITY_RESEARCH_REGISTER.md — Official Tool Evaluation & Compatibility Matrix
**Platform:** AnonTrove Ebook Commerce Platform (`projects/anon-trove-ebooks`)  
**Target Environment:** Next.js 14.2 (App Router), TypeScript, React, Tailwind CSS, Vercel Serverless, Backblaze B2, FamPay UPI  
**Research Date:** November 8, 2026  
**Status:** Phase 1 Research Complete

---

## 1. Tool Evaluation Matrix

Every proposed security scanner and automation tool has been investigated against official GitHub repositories, release histories, and compatibility with our Next.js + TypeScript + Serverless architecture.

| Tool Name | Official Repository | Latest Stable Version | License | Primary Function | Architecture Compatibility | Evaluation Decision |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **CodeQL** | [github/codeql](https://github.com/github/codeql) | v2.19.x | MIT / GitHub ToS | Semantic data-flow SAST | Fully compatible with JS/TS & Python | **ACCEPTED & INTEGRATED** (Primary semantic SAST) |
| **Semgrep** | [semgrep/semgrep](https://github.com/semgrep/semgrep) | v1.98.x | LGPL-2.1 / Commercial | Fast AST-based pattern SAST | Native support for Next.js, React, Node.js | **ACCEPTED & INTEGRATED** (OWASP rules in CI) |
| **Gitleaks** | [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | v8.21.x | MIT | Static secret detection in Git history | Standalone Go binary, zero dependency | **ACCEPTED & INTEGRATED** (Pre-commit & CI) |
| **TruffleHog** | [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) | v3.88.x | AGPL-3.0 | Deep secret verification & active probe | Heavy runtime; overlaps with Gitleaks | **REJECTED (Redundant)**: Avoid CI duplicate scanner; Gitleaks is faster & sufficient |
| **OSV-Scanner** | [google/osv-scanner](https://github.com/google/osv-scanner) | v1.9.x | Apache-2.0 | Vulnerability database lookup (Open Source) | Evaluates `package-lock.json` directly | **ACCEPTED** (CI dependency audit) |
| **Dependabot** | [dependabot/dependabot-core](https://github.com/dependabot) | Built-in GitHub | Core: MIT | Automated dependency security PRs | Native GitHub feature | **ACCEPTED & CONFIGURED** (`.github/dependabot.yml`) |
| **Renovate** | [renovatebot/renovate](https://github.com/renovatebot/renovate) | v38.x | AGPL-3.0 | Dependency update automation | High flexibility but overlaps with Dependabot | **REJECTED (Alternative)**: Dependabot is built into GitHub without extra app permissions |
| **Trivy** | [aquasecurity/trivy](https://github.com/aquasecurity/trivy) | v0.57.x | Apache-2.0 | Filesystem, container & lockfile scanner | Native GitHub Action; fast SBOM & CVE scan | **ACCEPTED & INTEGRATED** (Commit SHA pinned) |
| **Checkov** | [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov) | v3.2.x | Apache-2.0 | Infrastructure-as-Code (Terraform/K8s) | Project is Vercel serverless (No Terraform) | **REJECTED**: No Terraform/CloudFormation IaC present in repository |
| **OWASP ZAP** | [zaproxy/zaproxy](https://github.com/zaproxy/zaproxy) | v2.15.x | Apache-2.0 | Dynamic Application Security Testing (DAST) | Docker / GitHub Action for HTTP probing | **ACCEPTED (Staging Passive)**: ZAP Baseline on preview/staging; NEVER destructive |
| **Playwright** | [microsoft/playwright](https://github.com/microsoft/playwright) | v1.49.x | Apache-2.0 | End-to-End browser test automation | Node.js native, tests real headless Chromium | **ACCEPTED & INTEGRATED** (Customer & admin regression tests) |
| **OpenSSF Scorecard**| [ossf/scorecard](https://github.com/ossf/scorecard) | v5.1.x | Apache-2.0 | Supply chain security posture analyzer | GitHub Action with SARIF upload | **ACCEPTED & INTEGRATED** (Scheduled weekly audit) |
| **actionlint** | [rhysd/actionlint](https://github.com/rhysd/actionlint) | v1.7.x | MIT | Static checker for GitHub Actions YAML | Fast Go binary; checks workflow syntax | **ACCEPTED & INTEGRATED** (PR workflow linter) |
| **zizmor** | [zizmorcore/zizmor](https://github.com/zizmorcore/zizmor) | v0.1.x | AGPL-3.0 | GitHub Actions security audit | Rust-based; early ecosystem | **EVALUATED (Deferred)**: actionlint provides mature stability |
| **Syft** | [anchore/syft](https://github.com/anchore/syft) | v1.17.x | Apache-2.0 | Software Bill of Materials (SBOM) generator | Generates CycloneDX / SPDX JSON | **ACCEPTED** (Release & main branch SBOM generation) |
| **Grype** | [anchore/grype](https://github.com/anchore/grype) | v0.84.x | Apache-2.0 | Vulnerability scanner for container / SBOM | Scans Syft SBOMs | **ACCEPTED** (Companion to Syft) |

---

## 2. In-Depth Tool Justification & Architecture Alignment

### A. Static Application Security Testing (SAST)
- **Selection: CodeQL + Semgrep**
- **Reasoning**:
  - `CodeQL` performs inter-procedural taint tracking and semantic data-flow analysis to trace untrusted inputs (e.g. query params in `app/api/download/[token]`) to dangerous sinks.
  - `Semgrep` provides instant, rule-based AST validation for Next.js and React patterns (checking for `dangerouslySetInnerHTML`, missing CSRF headers, and unprotected API routes).
  - Both emit standard SARIF output that uploads directly into the GitHub Security tab without friction.

### B. Secret Detection
- **Selection: Gitleaks**
- **Rejection: TruffleHog**
- **Reasoning**:
  - `Gitleaks` is lightweight, deterministic, and easily integrated as a pre-commit hook and in CI.
  - `TruffleHog` performs live online credential verification by probing third-party APIs, which risks triggering unwanted rate limits, alerting service providers, or exposing transient tokens. Gitleaks' offline regular-expression and Shannon entropy analysis is safer for automated CI workflows.

### C. Dependency Management & Vulnerability Scanning
- **Selection: Dependabot + Trivy + OSV-Scanner**
- **Rejection: Renovate (Redundant)**
- **Reasoning**:
  - `Dependabot` handles automated version bumps and security pull requests with zero third-party hosting requirements.
  - `Trivy` scans both Node.js `package-lock.json` and Python dependencies in `workers/` and `scripts/`.
  - `OSV-Scanner` provides direct matching against Google's open vulnerability database.

### D. Dynamic Testing (DAST)
- **Selection: OWASP ZAP Baseline**
- **Safety Policy**:
  - Configured strictly in **passive mode** against local or Vercel preview environments.
  - No active fuzzing or destructive attack vectors against production (`https://ebook-sandy-chi.vercel.app`).

### E. Supply Chain & CI Workflow Hardening
- **Selection: actionlint + OpenSSF Scorecard**
- **Implementation**:
  - `actionlint` catches syntax errors, unquoted expressions, and unpinned actions on every PR modifying `.github/workflows/`.
  - OpenSSF Scorecard scores repo settings: branch protection, pinned dependencies, token permissions, and SAST coverage.
