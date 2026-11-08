export interface EbookBundle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  priceInInr: number;
  originalPriceInInr: number;
  bookCount: number;
  category: string;
  badge: string;
  features: string[];
  includedTitles: string[];
}

export const CURATED_BUNDLES: EbookBundle[] = [
  {
    id: "bundle-developer-vault",
    slug: "full-stack-developer-vault",
    title: "Full-Stack Software Engineering Master Vault",
    subtitle: "Complete collection of verified modern architecture, system design, and coding guides.",
    description: "Master full-stack software development from design patterns and distributed systems to modern TypeScript, Python, and high-performance databases. All books formatted in DRM-free universal PDF.",
    priceInInr: 99,
    originalPriceInInr: 349,
    bookCount: 12,
    category: "Programming & Software Engineering",
    badge: "Most Popular",
    features: [
      "12 comprehensive software engineering manuals",
      "System design, microservices & algorithms",
      "Modern TypeScript, React, Go, and Python handbooks",
      "Instant PDF downloads + in-browser reader access"
    ],
    includedTitles: [
      "Designing Data-Intensive Applications",
      "System Design Interview Handbook",
      "Modern TypeScript Architecture Guide",
      "Clean Code & Enterprise Patterns",
      "High-Performance Browser Networking"
    ]
  },
  {
    id: "bundle-cybersecurity-arsenal",
    slug: "cybersecurity-pentesting-arsenal",
    title: "Cybersecurity, Pentesting & Defense Arsenal",
    subtitle: "Ethical hacking, threat modeling, reverse engineering, and cloud security guides.",
    description: "Hands-on, practitioner-focused security textbooks covering offensive penetration testing, web application security (OWASP ASVS), malware analysis, and cloud defense.",
    priceInInr: 99,
    originalPriceInInr: 389,
    bookCount: 10,
    category: "Cybersecurity & Ethical Hacking",
    badge: "Security Pro",
    features: [
      "10 battle-tested security manuals",
      "Offensive exploit analysis & web application pentesting",
      "Reverse engineering & memory safety handbooks",
      "Zero DRM lock-in, immediate delivery"
    ],
    includedTitles: [
      "Web Application Hacker's Handbook",
      "Practical Malware Analysis",
      "The Art of Software Security Assessment",
      "Linux Server Hardening Manual"
    ]
  },
  {
    id: "bundle-trading-quant-suite",
    slug: "quantitative-trading-finance-suite",
    title: "Quantitative Trading & Financial Markets Suite",
    subtitle: "Technical analysis, algorithmic trading, financial modeling, and risk systems.",
    description: "Quantitative finance and market strategy manuals for serious traders and analysts. Learn options strategies, algorithmic Python execution, and mathematical risk management.",
    priceInInr: 89,
    originalPriceInInr: 299,
    bookCount: 8,
    category: "Trading, Quantitative & Financial Markets",
    badge: "High Value",
    features: [
      "8 quantitative market manuals",
      "Algorithmic execution scripts & trading strategies",
      "Risk analysis & derivatives modeling",
      "Instant UPI delivery & cloud reader"
    ],
    includedTitles: [
      "Quantitative Trading Systems with Python",
      "Technical Analysis of Financial Markets",
      "Options Volatility and Pricing Strategies",
      "Financial Risk Management Foundations"
    ]
  },
  {
    id: "bundle-ai-ml-engineering",
    slug: "ai-machine-learning-engineering-suite",
    title: "Artificial Intelligence & Machine Learning Suite",
    subtitle: "Deep learning, LLM fine-tuning, computer vision, and mathematical foundations.",
    description: "From transformer architectures and diffusion models to production PyTorch pipelines. Everything you need to engineer and deploy modern AI systems.",
    priceInInr: 99,
    originalPriceInInr: 329,
    bookCount: 9,
    category: "Artificial Intelligence & Machine Learning",
    badge: "Trending",
    features: [
      "9 modern machine learning textbooks",
      "Transformer architectures & LLM training playbooks",
      "Production ML inference & quantization guides",
      "DRM-free digital editions"
    ],
    includedTitles: [
      "Deep Learning with PyTorch",
      "Building LLM Applications & Agents",
      "Mathematics for Machine Learning",
      "Hands-On Computer Vision Systems"
    ]
  }
];

export function getBundleBySlug(slug: string): EbookBundle | undefined {
  return CURATED_BUNDLES.find(b => b.slug === slug);
}
