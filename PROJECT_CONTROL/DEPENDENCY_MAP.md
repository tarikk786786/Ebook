# DEPENDENCY MAP — EBOOK ECOMMERCE PLATFORM

```mermaid
graph TD
    subgraph Data & Storage Layer
        BR[books_registry.json] --> Cat[lib/catalog.ts]
        PSto[private_storage/] --> Stream[Stream Delivery Proxy]
        R2[Cloudflare R2] --> Stream
        Supabase[(Supabase PostgreSQL 15)] --> UserLib[User Library & RLS]
    end

    subgraph Payments & Tokenization
        RP[Razorpay Adapter] --> PayRouter[lib/payments Router]
        CF[Cashfree Adapter] --> PayRouter
        FG[FamGateway Adapter] --> PayRouter
        PayRouter --> Webhook[app/api/webhooks/*]
        Webhook --> SigVerify{timingSafeEqual HMAC}
        SigVerify -->|Valid| IssueToken[lib/crypto AES-256-GCM]
        IssueToken --> DownRoute[app/api/download/[token]]
    end

    subgraph Storefront & Reader
        Cat --> Home[app/page.tsx]
        Cat --> BookDetail[app/book/[slug]]
        Cart[context/CartContext.tsx] --> Checkout[app/api/checkout]
        DownRoute --> Stream
        Stream --> PDFR[components/reader/PdfReader.tsx]
        Stream --> EPUBR[components/reader/EpubReader.tsx]
    end

    subgraph Automation & Marketing
        Webhook --> N8N[n8n Automation]
        Webhook --> Listmonk[Listmonk Email]
        Home --> PostHog[PostHog Analytics]
    end
```
