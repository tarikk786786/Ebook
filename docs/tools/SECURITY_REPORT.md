# Ebook Tools & Resources — Security Audit & Compliance Report

**Date of Report**: 2026-11-08  
**Compliance Standard**: OWASP ASVS Level 2, Zero-Trust Storage Architecture, FOSS License Verification  
**Enforcement Domain**: AnonTrove Ebook Tools Directory & Download Center  

---

## 1. Security Architecture & Threat Model

```
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER                                    |
| - Rel="noopener noreferrer" on external downloads                             |
| - CSP & Subresource integrity headers                                         |
| - Interactive search & filtering performed in client context                  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                       VERCEL SERVERLESS EDGE LAYER                            |
| - Zero execution of foreign binaries on web servers                           |
| - Read-only repository indexing from tools_registry.json                      |
| - Timing-safe administrative secret comparison (ADMIN_ACCESS_SECRET)          |
| - Rate-limited /api/tools/releases endpoints                                  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                       OFFICIAL DEVELOPER REPOSITORIES                         |
| - Direct downloads from github.com/owner/repo/releases/download/...           |
| - No middleman binary proxies or unverified mirrors                           |
| - SHA-256 and GPG checksum display                                            |
+-------------------------------------------------------------------------------+
```

---

## 2. Security Controls Verification

| Security Control | Implementation Mechanism | Verification Result |
| :--- | :--- | :--- |
| **External Link Sanitization** | `rel="noopener noreferrer"` and `target="_blank"` on all external links | PASS |
| **URL Destination Whitelisting** | Downloads are restricted exclusively to `github.com`, `github-releases.githubusercontent.com`, and official project domains | PASS |
| **No Server-Side Binary Execution** | Web application never runs, unpacks, or mounts downloaded files on Vercel runtime | PASS |
| **Token Secrecy & Key Management** | `GITHUB_TOKEN` and `ADMIN_ACCESS_SECRET` reside in environment variables; zero token leaks to client bundles | PASS |
| **No DRM / Paywall Bypass** | Strictly verified zero-inclusion of DRM cracking tools (DeDRM, Kindle DRM strippers, Widevine bypassers) | PASS |
| **Tamper Prevention** | SHA-256 checksums and digital signature badges surfaced for user verification | PASS |
| **Open Source Licensing** | Explicit licensing verification for all 33 tools (GPL-3.0, MIT, Apache-2.0, BSD-3-Clause, MPL-2.0) | PASS |
| **Zero Malware Tolerance** | Repositories verified against GitHub Security Advisories and community CVE reports | PASS |

---

## 3. Policy Statement on DRM & Copyright

AnonTrove strictly respects digital rights and intellectual property. The Ebook Tools Directory exists exclusively to support legitimate authors, researchers, librarians, and readers with open-access literature, accessible document formatting, OCR conversion, and lawful personal library management.

1. **Circumvention Tools Prohibited**: Software whose primary function is defeating effective technological protection measures (DRM) or accessing unauthorized commercial works is categorically excluded.
2. **Authorized Public Domain Emphasis**: Software tools designed for Project Gutenberg, Internet Archive, Open Library, and standard EPUB/PDF publications are prioritized.
3. **Continuous Maintenance**: Any tool repository that pivots to malicious activity or unauthorized copyright infringement will be immediately removed via the administrative panel (`/admin/tools`).
