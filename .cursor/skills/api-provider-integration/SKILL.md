---
name: api-provider-integration
description: Implement or extend provider adapters for Google Books, Open Library, and Internet Archive behind a common interface. Use when adding metadata/cover sources.
---

# API provider integration

## Interface each adapter must support

- searchBook / lookupIsbn
- retrieveCandidateMetadata / coverReference
- sourceIdentifier, sourceUrl, attribution
- rateLimitInfo, cache, failure handling

## Config

Server-side env only. Document in `.env.example` without real keys.

## Compliance

Follow `.cursor/rules/provider-compliance.mdc`. Test each adapter independently; app continues if optional providers are down.
