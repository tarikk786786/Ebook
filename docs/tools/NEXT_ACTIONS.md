# Ebook Tools & Resources — Next Actions & Roadmap

## Continuous Execution Roadmap

### 1. High Priority (Completed)
- [x] Initial 33 FOSS tool collection across 14 categories.
- [x] Pre-rendered detail pages (`/tools/[slug]`) with CLI installation guides and verified assets.
- [x] Official GitHub release tracker API (`/api/tools/releases`) with in-memory caching.
- [x] Zero-trust admin management dashboard (`/admin/tools`) with live link verification.
- [x] All 6 technical documentation artifacts written in `docs/tools/`.
- [x] Live production deployment and HTTP 200 verification on Vercel.

### 2. Medium Term (Next Iteration)
- **Automatic GitHub Release Webhook / Cron Job**:
  - Implement a daily cron task querying GitHub REST API for version bumps.
  - Automatically update `data/tools_registry.json` when upstream authors publish new tagged releases.
- **In-Browser WebAssembly Previews**:
  - Embed lightweight wasm readers (e.g. Readest / Foliate Web / EPUB.js) directly inside tool showcase pages for zero-install demonstrations.
- **Direct Checksum Verification Utility**:
  - Add client-side Web Crypto API hasher allowing users to drop their downloaded file on `/tools/[slug]` to instantly verify SHA-256 against upstream release tags.

### 3. Long Term (Future Expansion)
- **Community Tool Submissions**:
  - Provide a moderated PR workflow or admin submission form for open-source ebook authors to register their tools.
- **Hardware Compatibility Matrix**:
  - Expand device testing badges (Kobo, Kindle Jailbreak, Onyx Boox, Remarkable, Android E-ink).
