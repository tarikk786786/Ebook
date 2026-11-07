# ARCHITECTURAL DECISION RECORDS (ADR)

### ADR-001: Next.js 14 App Router as Unified Front & Backend
- **Context**: Need high performance, edge caching, zero maintenance serverless architecture for digital downloads and reader pages.
- **Decision**: Next.js 14 with App Router, serverless API routes, and SSG/ISR.
- **Consequence**: Ultra-fast initial page loads, global CDN distribution, seamless developer workflow.

### ADR-002: Ephemeral AES-256-GCM Tokens vs Database Sessions for Guest Downloads
- **Context**: Zero-trace privacy standard requires allowing frictionless guest checkouts without storing personal customer identities or IP logs.
- **Decision**: Encrypt order payload (orderId, bookId, expiry) directly into an AES-256-GCM authenticated cipher token.
- **Consequence**: Decrypted statelessly on server stream requests; expires automatically after 24 hours without database lookups.

### ADR-003: Multi-Gateway Redundancy with FamGateway UPI, Razorpay & Cashfree
- **Context**: Ensure uninterrupted checkout in Indian and international markets with 0% fee non-custodial UPI option alongside credit cards and net banking.
- **Decision**: Built a unified `PaymentGateway` factory pattern in `lib/payments/`.
- **Consequence**: Easily switch or provide user choice at checkout.

### ADR-004: In-Browser Secure Readers with Canvas Watermarking
- **Context**: Customers want immediate access to purchased books on mobile and desktop without mandatory downloads.
- **Decision**: Implemented PDF.js canvas rendering and EPUB.js iframe rendering with dynamic customer watermarking.
- **Consequence**: Protects author copyrights while providing premium reading experience.
