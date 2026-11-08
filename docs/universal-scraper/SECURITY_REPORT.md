# Universal Ebook Discovery Engine — Security & Legal Compliance Audit

## 1. Executive Security & Ethical Stance
The Universal Ebook Discovery and Acquisition System is designed to strictly adhere to ethical web data acquisition, copyright law, and computer security standards. The engine is deliberately engineered with technical safeguards against copyright infringement, credential leaks, and network abuse.

---

## 2. Core Compliance Directives

### A. Zero Circumvention Policy
- **DRM Bypass Prevention**: The system does NOT decrypt Adobe ADEPT, Apple FairPlay, Amazon KFX/AZW DRM, or proprietary reader containers.
- **Paywall & Anti-Bot Bypassing**: The system does NOT employ CAPTCHA solving farms, cookie spoofing, header poisoning, or headless obfuscation to evade paywalls.
- **Access Status Verification**: If a source responds with HTTP 401, 403, or 429, the crawler gracefully marks the source as restricted or rate-limited and halts requests rather than rotating unauthorized proxies.

### B. Copyright & Rights Classification
Every discovered item is run through the AI Rights Classifier before being made visible on `/discover`:
1. **Public Domain Verification**: Must either precede copyright cutoff years (pre-1929 US, or life-plus-70 rules), or carry verified CC0 / Public Domain marks from authoritative repositories (Gutenberg, Standard Ebooks, Internet Archive).
2. **Borrowable / Controlled Digital Lending**: For in-copyright works scanned by libraries (such as Open Library and Internet Archive), only official library borrowing links are presented. No unauthorized file downloads are facilitated.
3. **Store Inventory**: AnonTrove's commercial inventory is strictly segregated and fulfilled through authorized channels with UPI payment verification.

### C. Telegram Acquisition Safeguards
- **Channel Scope**: Scrapes only public educational channels where content is intended for open distribution, user-administered channels, or verified account inventory.
- **Authentication Safeguards**: Session string and API keys are stored in environment variables and `appinfo11.txt`. Never committed to public source control.
- **Zero Infiltration**: No access to private invites, paid VIP channels, or channels flagging copyrighted content notices.

---

## 3. Web & API Security Implementation

| Security Domain | Mitigation Strategy | Implementation |
| :--- | :--- | :--- |
| **Admin Control Plane** | Zero-Trust Token Authentication | `x-admin-token` header verified against `ADMIN_ACCESS_SECRET` on all `/api/scraper/*` and `/api/admin/*` endpoints. |
| **SSRF Prevention** | Protocol & Host Whitelisting | Download and cover image links are validated against allowed protocols (`http:`, `https:`) and non-private IP ranges. |
| **XSS & Injection Defense** | React JSX Auto-Escaping & Sanitization | All harvested metadata strings (titles, descriptions, authors) are sanitized before rendering or storing in JSON. |
| **Rate-Limiting & Politeness** | Adaptive Exponential Backoff | `PoliteRequester` ensures no third-party server is overwhelmed. Minimum inter-request delay enforced. |
| **Secrets Protection** | Git Push Protection & Env Scoping | Pre-commit and push protection blocks any accidental exposure of GitHub, Telegram, or Payment tokens. |

---

## 4. Audit Conclusion
The Universal Discovery Engine satisfies both strict security best practices and intellectual property legal guidelines. It operates as a discovery and curation platform for public domain, open-access, and legitimately authorized literature.
