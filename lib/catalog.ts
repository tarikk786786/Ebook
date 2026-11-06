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
  category: 'Security & Privacy' | 'FinTech & Engineering' | 'Indie Hacking' | 'Architecture';
  badge?: string;
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
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
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
    format: 'PDF (Searchable & Printable)',
    fileSize: '7.8 MB',
    category: 'FinTech & Engineering',
    badge: 'Popular',
    coverImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
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
    id: 'book-zero-to-prod',
    slug: 'zero-to-prod-indie-hacker',
    title: 'Zero to Prod: The Solo Architect',
    subtitle: 'Shipping Micro-SaaS & Digital Products on $0 Infrastructure',
    author: 'DevKaggle',
    description: 'How to build, launch, and monetize high-uptime software tools and digital stores using Vercel, GitHub, Cloudflare, and automated UPI payment gateways without spending a single rupee on servers.',
    priceInInr: 49.00,
    originalPriceInInr: 199.00,
    pages: 110,
    format: 'PDF',
    fileSize: '3.1 MB',
    category: 'Indie Hacking',
    badge: 'Value Pick',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    sampleExcerpt: [
      "You don't need a \$200/month Kubernetes cluster to validate your first 1,000 customers.",
      "The modern serverless edge tier allows you to host frontends globally for free on Vercel, store files efficiently, and collect automated payments with FamGateway.",
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
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
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
  }
];

export function getBookById(id: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.id === id);
}

export function getBookBySlug(slug: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.slug === slug);
}
