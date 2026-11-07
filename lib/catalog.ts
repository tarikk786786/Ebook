export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  priceInInr: number;
  originalPriceInInr: number;
  pages: number;
  format: string; // PDF, EPUB, MOBI
  fileSize: string;
  category: 'Security & Privacy' | 'FinTech & Payments' | 'Indie Hacking' | 'Architecture' | 'AI & Agents';
  badge?: string;
  rating: number;
  reviewCount: number;
  readingTime: string;
  edition: string;
  coverImage: string;
  sampleExcerpt: string[];
  tableOfContents: string[];
  fileName: string;
}

export const BOOK_CATALOG: Book[] = [
  {
    id: 'book-zero-trace',
    slug: 'zero-trace-engineer',
    title: 'The Zero-Trace Engineer',
    subtitle: 'Building Paranoid, Private & Surveillance-Resistant Web Systems',
    author: 'Satoshi Vector',
    description: 'A masterclass on building systems that collect zero PII, eliminate telemetry leakages, leverage ephemeral cryptographic tokens, and defend against forensic tracking.',
    priceInInr: 99.00,
    originalPriceInInr: 399.00,
    pages: 148,
    format: 'PDF + EPUB',
    fileSize: '4.2 MB',
    category: 'Security & Privacy',
    badge: 'Bestseller',
    rating: 4.9,
    reviewCount: 312,
    readingTime: '3.5 hrs',
    edition: '2026 Revised Edition',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "Principle 1: What does not exist cannot be subpoenaed or breached.",
      "Most digital services collect user emails, IP addresses, and behavioral telemetry under the guise of 'analytics' or 'fraud prevention'.",
      "By replacing accounts with ephemeral, time-decayed cryptographic tokens (AES-256-GCM), a merchant can deliver digital goods safely without holding a single byte of user identity.",
      "In this chapter, we explore how non-custodial P2P payment settlement changes the privacy game completely."
    ],
    tableOfContents: [
      '1. Threat Modeling for Modern Software Engineers',
      '2. Ephemeral Tokenization: The Death of User Databases',
      '3. Non-Custodial Payment Rail Design with UPI',
      '4. Timing-Safe Cryptographic Webhooks',
      '5. Hardening Serverless Endpoints on Edge Compute',
      '6. Anti-Forensic Data Destruction Strategies'
    ],
    fileName: 'the-zero-trace-engineer.pdf'
  },
  {
    id: 'book-fintech-upi',
    slug: 'high-volume-upi-protocols',
    title: 'High-Volume FinTech & UPI Protocols',
    subtitle: 'The Non-Custodial Blueprint for Automated Indian Payments',
    author: 'Aryan Developer Network',
    description: 'Everything you need to master automated UPI collection, bypass bank daily receiver limits with Multi-Wallet failover pools, and run zero-fee FinTech pipelines.',
    priceInInr: 149.00,
    originalPriceInInr: 599.00,
    pages: 212,
    format: 'PDF + EPUB',
    fileSize: '7.8 MB',
    category: 'FinTech & Payments',
    badge: 'Trending',
    rating: 4.9,
    reviewCount: 248,
    readingTime: '5.2 hrs',
    edition: '2026 Core FinTech Edition',
    coverImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "Traditional payment gateways take 2% to 3% cuts on every transaction, plus GST, while imposing rolling reserves and mandatory Current Accounts.",
      "The Unified Payments Interface (UPI) is intrinsically a real-time, peer-to-peer settlement network.",
      "By pairing stateless IMAP notification engines with dynamic QR generators, developers can collect payments directly to their bank accounts at 0% fees with 0-second settlement.",
      "Here is how multi-wallet routing prevents receiver limits from throttling high-traffic launches."
    ],
    tableOfContents: [
      '1. The Anatomy of a UPI Intent Deep-Link',
      '2. Dynamic vs Static QR Code Generation',
      '3. Stateless IMAP Bank Notification Parsing',
      '4. Multi-Wallet Failover Routing Algorithms',
      '5. Section 22 CGST Exemption & Indie Business Compliance',
      '6. Stress-Testing High-Concurrency Webhook Ingestion'
    ],
    fileName: 'high-volume-upi-protocols.pdf'
  },
  {
    id: 'book-ai-architect',
    slug: 'the-ai-agent-architect',
    title: 'The AI Agent Architect',
    subtitle: 'Designing Autonomous Multi-Agent Workflows & Production RAG',
    author: 'Dr. Julian Vance',
    description: 'From single prompts to self-healing agent swarms. Learn how to architect stateful memory, tool-calling pipelines, evaluate hallucination rates, and run local SLMs on serverless infrastructure.',
    priceInInr: 149.00,
    originalPriceInInr: 649.00,
    pages: 184,
    format: 'PDF + EPUB + Code Bundle',
    fileSize: '6.4 MB',
    category: 'AI & Agents',
    badge: 'Editor Choice',
    rating: 5.0,
    reviewCount: 194,
    readingTime: '4.8 hrs',
    edition: '2026 Autonomous Systems Guide',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "Autonomous agents are not simply LLMs with while loops; they are event-driven distributed state machines.",
      "The transition from static prompt engineering to dynamic agent loops requires mastering tool execution sandboxing, deterministic context pruning, and multi-agent consensus protocols.",
      "In this chapter, we build an autonomous researcher that synthesizes multi-source telemetry without prompt drift."
    ],
    tableOfContents: [
      '1. Mental States and BDI Architectures for Agents',
      '2. Memory Hierarchy: Ephemeral, Vector & Long-Term Graphs',
      '3. Safe Tool Calling & Sandboxed Execution Boundaries',
      '4. Multi-Agent Consensus: Supervisors vs Peer Networks',
      '5. Production Benchmarking & Hallucination Elimination'
    ],
    fileName: 'the-ai-agent-architect.pdf'
  },
  {
    id: 'book-zero-to-prod',
    slug: 'zero-to-prod-indie-hacker',
    title: 'Zero to Prod: The Solo Architect',
    subtitle: 'Shipping Micro-SaaS & Digital Products on $0 Infrastructure',
    author: 'DevKaggle',
    description: 'How to build, launch, and monetize high-uptime software tools and digital stores using Vercel, GitHub, Cloudflare, and automated UPI payment gateways without spending a single rupee on servers.',
    priceInInr: 49.00,
    originalPriceInInr: 199.00,
    pages: 110,
    format: 'PDF + EPUB',
    fileSize: '3.1 MB',
    category: 'Indie Hacking',
    badge: 'Value Pick',
    rating: 4.8,
    reviewCount: 420,
    readingTime: '2.8 hrs',
    edition: '3rd Printing (2026)',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "You don't need a \$200/month Kubernetes cluster to validate your first 1,000 customers.",
      "The modern serverless edge tier allows you to host frontends globally for free on Vercel, store files efficiently, and collect automated payments with non-custodial UPI.",
      "Your total fixed monthly burn rate? Zero. Your gross margins? 100%.",
      "This playbook is your definitive checklist to go from initial git commit to live paying users in under 48 hours."
    ],
    tableOfContents: [
      '1. The Zero-Dollar Stack Architecture',
      '2. Next.js App Router & Edge Runtime Optimization',
      '3. Headless Checkout & Conversion Psychology',
      '4. Automating Digital Goods Delivery Without Database Bloat',
      '5. Launching on Reddit, Telegram, and Developer Communities',
      '6. Scaling to Your First ₹1,00,000'
    ],
    fileName: 'zero-to-prod-the-solo-architect.pdf'
  },
  {
    id: 'book-system-arch',
    slug: 'clean-architecture-handbook',
    title: 'The Resilient Microservices Handbook',
    subtitle: 'Decoupled Systems, Event-Driven Queues, and Fault-Tolerance',
    author: 'Elena Rostova',
    description: 'Practical architectural patterns for building backend services that gracefully survive network partitions, external API outages, and concurrency spikes.',
    priceInInr: 199.00,
    originalPriceInInr: 799.00,
    pages: 260,
    format: 'PDF + Source Code Bundle',
    fileSize: '12.5 MB',
    category: 'Architecture',
    rating: 4.9,
    reviewCount: 165,
    readingTime: '6.4 hrs',
    edition: '2026 Hardcover Companion',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "Distributed systems fail in subtle, cascading ways that unit tests rarely predict.",
      "When an upstream payment provider or banking rail slows down, synchronous HTTP calls cause thread exhaustion in your API workers.",
      "We unpack idempotency keys, exponential backoff with jitter, dead-letter queues, and circuit breaker patterns with ready-to-run TypeScript and Go code."
    ],
    tableOfContents: [
      '1. Invariance, Idempotency and State Machines',
      '2. Event Sourcing vs Transactional Outbox Pattern',
      '3. Circuit Breakers, Bulkheads & Jittered Retries',
      '4. Distributed Tracing Without PII Leaks',
      '5. Real-World FinTech Incident Postmortems'
    ],
    fileName: 'the-resilient-microservices-handbook.pdf'
  },
  {
    id: 'book-copywriting-code',
    slug: 'high-converting-technical-copywriting',
    title: 'High-Converting Technical Copywriting',
    subtitle: 'Selling Digital Products, Dev Tools & Developer APIs',
    author: 'Marcus Cole',
    description: 'The psychology of selling to sceptical developers and technical buyers. Master documentation-as-marketing, README copywriting, landing page teardowns, and pricing tier positioning.',
    priceInInr: 99.00,
    originalPriceInInr: 349.00,
    pages: 132,
    format: 'PDF + EPUB',
    fileSize: '3.8 MB',
    category: 'Indie Hacking',
    badge: 'Popular',
    rating: 4.8,
    reviewCount: 188,
    readingTime: '3.2 hrs',
    edition: '2026 Developer Marketing Edition',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "Engineers don't hate sales. They hate vague buzzwords, fake urgency countdowns, and marketing puffery.",
      "When writing copy for developers, transparency is your highest-leverage conversion weapon.",
      "Show the terminal commands, explain the zero-fee economics, reveal the architecture diagram, and let the product speak for itself."
    ],
    tableOfContents: [
      '1. The Technical Buyer Mindset & Bullshit Detectors',
      '2. Anatomy of a High-Conversion Developer Landing Page',
      '3. Writing Documentation That Sells Without Selling',
      '4. GitHub READMEs: The Highest ROI Real Estate on the Internet',
      '5. Pricing Architecture: Free Tier Hooks vs High-Ticket Tiers'
    ],
    fileName: 'high-converting-technical-copywriting.pdf'
  },
  {
    id: 'book-master-bundle',
    slug: 'all-access-master-library',
    title: 'The All-Access Master Library (All 6 Volumes)',
    subtitle: 'Complete Technical & Privacy Collection: 1,046 Pages, All PDF + EPUB Editions',
    author: 'AnonTrove Editorial Syndicate',
    description: 'Get every single published manual in our catalog at 86% discount: The Zero-Trace Engineer, High-Volume FinTech, AI Agent Architect, Zero to Prod, Microservices, and Technical Copywriting.',
    priceInInr: 399.00,
    originalPriceInInr: 2999.00,
    pages: 1046,
    format: 'Complete Bundle (PDF + EPUB + Code)',
    fileSize: '37.8 MB',
    category: 'Indie Hacking',
    badge: 'Special Bundle',
    rating: 5.0,
    reviewCount: 520,
    readingTime: '26+ hrs',
    edition: '2026 Complete Collector Boxset',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    sampleExcerpt: [
      "The All-Access Master Library combines all foundational texts of modern independent software engineering.",
      "Volume 1: Surveillance-resistant architecture & zero-PII data pipelines.",
      "Volume 2: Non-custodial UPI automation & high-volume payment routing.",
      "Volume 3: Stateful autonomous AI agents & production RAG systems.",
      "Volume 4: Zero-dollar infrastructure deployment from idea to paying users.",
      "Volume 5: Fault-tolerant microservices, queues & circuit breakers.",
      "Volume 6: Technical copywriting & developer marketing that converts."
    ],
    tableOfContents: [
      'Vol 1: The Zero-Trace Engineer (Full Edition)',
      'Vol 2: High-Volume FinTech & UPI Protocols (Full Edition)',
      'Vol 3: The AI Agent Architect (Full Edition)',
      'Vol 4: Zero to Prod: The Solo Architect (Full Edition)',
      'Vol 5: The Resilient Microservices Handbook (Full Edition)',
      'Vol 6: High-Converting Technical Copywriting (Full Edition)'
    ],
    fileName: 'the-zero-trace-engineer.pdf'
  }
];

export function getBookById(id: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.id === id);
}

export function getBookBySlug(slug: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.slug === slug);
}
