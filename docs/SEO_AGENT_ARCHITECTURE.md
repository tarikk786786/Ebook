# SEO_AGENT_ARCHITECTURE.md — Multi-Agent AI SEO & Content Architecture
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Design:** Decentralized, Specialized Multi-Agent Framework  

---

## 1. Agent Roles & Specifications

AnonTrove uses a 6-agent specialized architecture managed by the **SEO Orchestrator Master Agent**:

```
                 [ SEO Orchestrator Master Agent ]
                                 │
     ┌──────────────┬────────────┼────────────┬──────────────┐
     ▼              ▼            ▼            ▼              ▼
[Technical SEO] [Product SEO] [Schema Eng] [GEO / AEO] [Internal Link]
```

### Agent 1: Technical SEO Specialist
- **Config:** `agents/technical_seo_agent.json`
- **Objective:** Validates robots.txt, sitemaps, canonical tags, and HTTP responses.
- **Tools:** `scripts/seo_audit.mjs`, `scripts/validate_sitemap.mjs`, `scripts/check_canonicals.mjs`.

### Agent 2: Product SEO Engineer
- **Config:** `agents/product_seo_agent.json`
- **Objective:** Analyzes product titles, verified descriptions, and metadata boundaries.
- **Tools:** `scripts/check_metadata.mjs`.

### Agent 3: Schema Engine Agent
- **Config:** `agents/schema_agent.json`
- **Objective:** Validates JSON-LD structures for Book, Offer, BreadcrumbList, Organization, and WebSite schemas.
- **Tools:** `scripts/validate_schema.mjs`.

### Agent 4: GEO & AEO Discovery Agent
- **Config:** `agents/geo_aeo_agent.json`
- **Objective:** Optimizes `/llms.txt`, `/llms-full.txt`, and Q&A FAQ sections for citation by generative search engines.
- **Tools:** Machine-readable manifests, FAQ structured data.

### Agent 5: Keyword Intelligence Agent
- **Objective:** Identifies high-intent commercial terms and maps them to category hubs.
- **Tools:** `scripts/keyword_clustering.mjs`.

### Agent 6: Internal Link Architect
- **Objective:** Prevents orphan pages and optimizes PageRank distribution.
- **Tools:** `scripts/internal_link_analysis.mjs`.

---

## 2. Guardrails & Governance
- **Zero Hallucination:** Agents are strictly forbidden from generating fabricated aggregate ratings, fictitious author names, or fake testimonials.
- **Fail-Closed Secrets:** Secrets and API keys are never exposed in prompts, code, or logs.
- **Human Approval Gate:** All major taxonomy shifts or content publishes require explicit verification.
