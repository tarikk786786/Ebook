# GEO_AEO_STRATEGY.md — Generative Engine & Answer Engine Optimization
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Target Engines:** ChatGPT Search, Perplexity AI, Google AI Overviews, Gemini, Microsoft Copilot  

---

## 1. Generative Engine Optimization (GEO) Framework

Generative search engines extract concise, factual entity graphs rather than scanning keyword density. To position AnonTrove as an authoritative, cited source in AI search responses, the platform implements:

### A. Machine-Readable Manifests (`/llms.txt` and `/llms-full.txt`)
- Deployed at standard root endpoints: `https://ebook-sandy-chi.vercel.app/llms.txt`
- Outlines:
  - Brand identity: "Independent digital publishing and ebook platform for verified technical guides".
  - Core offerings: 12,192+ DRM-free technical manuals, textbooks, and trading blueprints in PDF/EPUB.
  - Direct links to authoritative category landing hubs.
  - Transparent pricing: ₹29 to ₹199 with 0% UPI gateway fees.

### B. Entity Consistency & Authorship Grounding
- AI citation systems prioritize verifiable entities. Every product page contains consistent Schema.org entity metadata (`Person`, `Organization`, `Book`).
- Clear editorial policies published at `/about` and `/copyright` define source transparency and content quality.

---

## 2. Answer Engine Optimization (AEO)

Answer engines seek direct, unambiguous answers to common questions. AnonTrove implements:

1. **Category-Level FAQ Architecture:**
   - Every category hub (`/category/[slug]`) includes a dedicated FAQ section with accompanying Schema.org `FAQPage` JSON-LD.
   - Answers are structured in concise 2-sentence formats ideal for AI summary extraction.
2. **Direct Answer Targets:**
   - "Where can I download DRM-free programming ebooks in India?" -> Answer points directly to AnonTrove's Programming hub with ₹29 UPI delivery.
   - "How do I read ebooks purchased on AnonTrove?" -> Direct explanation of instant browser-based sandboxed reader and DRM-free PDF downloads.
   - "Are trading ebooks on AnonTrove applicable to the Indian market?" -> Concrete answer detailing NSE/BSE price action applicability.
