import dynamicBooks from '@/data/books_registry.json';

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
  format: string; // PDF, EPUB, MOBI, etc.
  fileSize: string;
  category: string;
  badge?: string;
  rating: number;
  reviewCount: number;
  readingTime: string;
  edition: string;
  coverImage: string;
  sampleExcerpt: string[];
  tableOfContents: string[];
  fileName: string;
  // Metadata & Telegram Publishing extensions:
  primaryResourceType?: string;
  coverStatus?: string;
  isCustomGenerated?: boolean;
  identificationConfidence?: number;
  topic?: string;
  sha256?: string;
  sourceTelegram?: string;
  telegramMessageId?: number;
  telegramLink?: string;
  publicationYear?: string;
  publisher?: string;
  isbn?: string;
  language?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED';
  importedAt?: string;
}

export const INITIAL_BOOK_CATALOG: Book[] = [
  {
    "id": "book-android-hackers-handbook",
    "slug": "android-hackers-handbook",
    "title": "Android Hacker's Handbook",
    "subtitle": "The Definitive Guide to Android Security Architecture & Exploitation",
    "author": "Joshua J. Drake, Zach Lanier & Collin Mulliner",
    "description": "The Definitive Guide to Android Security Architecture & Exploitation. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 199.0,
    "originalPriceInInr": 799.0,
    "pages": 577,
    "format": "PDF (DRM-Free)",
    "fileSize": "9.0 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Bestseller",
    "rating": 4.9,
    "reviewCount": 412,
    "readingTime": "12.8 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/android-hackers-handbook.jpg",
    "sampleExcerpt": [
      "Joshua J. Drake Pau Oliva Fora Zach Lanier Collin Mulliner Stephen A. Ridley Georg Wicherski Android™ Hacker’s Handbook"
    ],
    "tableOfContents": [
      "Chapter 1 Looking at the Ecosystem",
      "Understanding Android Roots",
      "Company History",
      "Version History"
    ],
    "fileName": "Android Hacker's Handbook ( @LearnExploit ).pdf",
    "status": "PUBLISHED"
  },
  {
    "id": "book-startupology",
    "slug": "startupology",
    "title": "Startupology",
    "subtitle": "Your Day One Startup Manual: From Idea to Thriving Business",
    "author": "Vivek Chadha",
    "description": "The definitive guide that takes first-time founders from idea to thriving business using proven frameworks, practical strategies, and real-world case studies from India's most successful startups.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 412,
    "format": "PDF (DRM-Free)",
    "fileSize": "144.3 MB",
    "category": "Business & Startups",
    "badge": "Founder Manual",
    "rating": 5.0,
    "reviewCount": 680,
    "readingTime": "9.2 hrs",
    "edition": "First Edition (Zebra Learn)",
    "coverImage": "/covers/startupology.jpg",
    "sampleExcerpt": [
      "Startupology by Vivek Chadha - Zebra Learn New Book. Your Day One Startup Manual."
    ],
    "tableOfContents": [
      "Part 1: Ideation & Validation",
      "Part 2: Product & Market Fit",
      "Part 3: Growth & Scaling",
      "Part 4: Capital & Governance"
    ],
    "fileName": "Startupology by Vivek Chadha.pdf",
    "sourceTelegram": "DollarPremium Answer 2",
    "telegramMessageId": 90346,
    "status": "PUBLISHED"
  },
  {
    "id": "book-the-money-guide",
    "slug": "the-money-guide",
    "title": "The Money Guide",
    "subtitle": "How to Manage Your Taxes, Investments, and Wealth",
    "author": "Anushka Rathod",
    "description": "A comprehensive, actionable personal finance playbook by Anushka Rathod covering tax optimization, mutual funds, equity allocation, insurance, and long-term financial independence.",
    "priceInInr": 149.0,
    "originalPriceInInr": 990.0,
    "pages": 284,
    "format": "PDF (DRM-Free)",
    "fileSize": "42.8 MB",
    "category": "Personal Finance",
    "badge": "Essential",
    "rating": 4.9,
    "reviewCount": 512,
    "readingTime": "6.5 hrs",
    "edition": "2026 Edition (Zebra Learn)",
    "coverImage": "/covers/the-money-guide.jpg",
    "sampleExcerpt": [
      "The Money Guide by Anushka Rathod: How to Manage Your Taxes, Investments, and Build Sustainable Wealth."
    ],
    "tableOfContents": [
      "Chapter 1: Budgeting Without Pain",
      "Chapter 2: Tax Saving Legal Frameworks",
      "Chapter 3: Asset Allocation Strategies",
      "Chapter 4: Compounding & Early Retirement"
    ],
    "fileName": "The_Money_Guide_by_Anushka_Rathod_How_to_Manage_Your_Taxes,_Investments.pdf",
    "sourceTelegram": "DollarPremium Answer 2",
    "telegramMessageId": 95626,
    "status": "PUBLISHED"
  },
  {
    "id": "book-startup-finance-360",
    "slug": "startup-finance-360",
    "title": "Startup Finance 360°",
    "subtitle": "The Definitive CFO & Founder Financial Playbook",
    "author": "Rahul Saria",
    "description": "Complete financial architecture for startups: unit economics, runway management, cap table structuring, MIS dashboards, and investor reporting.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 356,
    "format": "PDF (DRM-Free)",
    "fileSize": "84.7 MB",
    "category": "Finance & Accounting",
    "badge": "Executive",
    "rating": 4.9,
    "reviewCount": 384,
    "readingTime": "8.0 hrs",
    "edition": "Zebra Learn Master Edition",
    "coverImage": "/covers/startup-finance-360.jpg",
    "sampleExcerpt": [
      "Startup Finance 360 by Rahul Saria: Unit economics, financial modeling, and venture debt."
    ],
    "tableOfContents": [
      "Unit Economics & Contribution Margin",
      "Burn Rate & Cash Runway Modeling",
      "Working Capital Optimizations",
      "Term Sheet Financial Covenants"
    ],
    "fileName": "startup finance 360 ebook  original pdf.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3646,
    "status": "PUBLISHED"
  },
  {
    "id": "book-51-trading-strategies",
    "slug": "51-trading-strategies",
    "title": "51 Trading Strategies",
    "subtitle": "Quantitative Setups, Price Action Models & Risk Protocols",
    "author": "Aseem Singhal",
    "description": "51 field-tested algorithmic and discretionary trading strategies across equities, futures, and options with precise entry, exit, and stop-loss logic.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 448,
    "format": "PDF (DRM-Free)",
    "fileSize": "91.9 MB",
    "category": "FinTech & Trading",
    "badge": "Top Rated",
    "rating": 4.9,
    "reviewCount": 490,
    "readingTime": "10.5 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/51-trading-strategies.jpg",
    "sampleExcerpt": [
      "51 Trading Strategies by Aseem Singhal: Tested technical indicators and execution models."
    ],
    "tableOfContents": [
      "Momentum Breakout Systems",
      "Mean Reversion Setups",
      "Volatility Compression Trades",
      "Position Sizing & Maximum Drawdown Limits"
    ],
    "fileName": "51-Trading-Strategies.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3645,
    "status": "PUBLISHED"
  },
  {
    "id": "book-the-trading-mastermind",
    "slug": "the-trading-mastermind",
    "title": "The Trading Mastermind",
    "subtitle": "Become a Trading Expert from Scratch",
    "author": "Zebra Learn",
    "description": "A comprehensive primer to technical market structure, chart patterns, order flow analysis, and trading psychology for modern retail investors.",
    "priceInInr": 149.0,
    "originalPriceInInr": 990.0,
    "pages": 312,
    "format": "PDF (DRM-Free)",
    "fileSize": "18.9 MB",
    "category": "FinTech & Trading",
    "badge": "Bestseller",
    "rating": 4.8,
    "reviewCount": 320,
    "readingTime": "7.2 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/the-trading-mastermind.jpg",
    "sampleExcerpt": [
      "The Trading Mastermind: Become a Trading Expert from Scratch by Zebra Learn."
    ],
    "tableOfContents": [
      "Market Microstructure & Liquidity",
      "Candlestick Anatomy & Support-Resistance",
      "Trading Plan Creation",
      "Risk to Reward Ratio Optimization"
    ],
    "fileName": "Zebralearn-The Trading Mastermind.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3637,
    "status": "PUBLISHED"
  },
  {
    "id": "book-stock-investing-mastermind",
    "slug": "stock-investing-mastermind",
    "title": "Stock Investing Mastermind",
    "subtitle": "Fundamental Analysis, Moats, and Value Investing",
    "author": "Zebra Learn",
    "description": "Uncover multi-bagger businesses using fundamental equity research, economic moat evaluation, financial ratio deep-dives, and management quality audits.",
    "priceInInr": 149.0,
    "originalPriceInInr": 990.0,
    "pages": 380,
    "format": "PDF (DRM-Free)",
    "fileSize": "39.3 MB",
    "category": "FinTech & Trading",
    "badge": "Core Reading",
    "rating": 4.9,
    "reviewCount": 275,
    "readingTime": "8.8 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/stock-investing-mastermind.jpg",
    "sampleExcerpt": [
      "Stock Investing Mastermind by Zebra Learn: Mastering business models and valuations."
    ],
    "tableOfContents": [
      "Identifying Durable Competitive Advantages",
      "Financial Statement Forensic Checks",
      "Discounted Cash Flow Basics",
      "Portfolio Construction Rules"
    ],
    "fileName": "Zebralearn-Stock Investing Mastermind.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3636,
    "status": "PUBLISHED"
  },
  {
    "id": "book-fundraising-decoded",
    "slug": "fundraising-decoded",
    "title": "Fundraising Decoded",
    "subtitle": "The Complete Playbook for Raising Venture Capital & Angel Funds",
    "author": "Zebra Learn",
    "description": "Step-by-step guidance for early-stage and growth founders on pitch deck structuring, investor outreach, valuation mechanics, term sheet negotiation, and closing rounds.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 328,
    "format": "PDF (DRM-Free)",
    "fileSize": "72.2 MB",
    "category": "Business & Startups",
    "badge": "Founder Essential",
    "rating": 4.9,
    "reviewCount": 310,
    "readingTime": "7.5 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/fundraising-decoded.jpg",
    "sampleExcerpt": [
      "Fundraising Decoded: How to Raise Your First Crore and Pitch to Top Tier Angels."
    ],
    "tableOfContents": [
      "Angel Syndicates vs Institutional VC",
      "The 12-Slide Pitch Deck Formula",
      "Dilution, Pre-Money vs Post-Money Math",
      "Closing the Deal & SHA Clauses"
    ],
    "fileName": "Zebra Learn – Fundraising Decoded.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3641,
    "status": "PUBLISHED"
  },
  {
    "id": "book-mindful-marketing",
    "slug": "mindful-marketing",
    "title": "Mindful Marketing",
    "subtitle": "Ethical Brand Building & Sustainable Consumer Trust",
    "author": "Rajesh Srinivasan",
    "description": "How to scale high-impact brands through authenticity, ethical positioning, organic retention loops, and high-trust storytelling.",
    "priceInInr": 149.0,
    "originalPriceInInr": 990.0,
    "pages": 264,
    "format": "PDF (DRM-Free)",
    "fileSize": "65.8 MB",
    "category": "Marketing & Growth",
    "badge": "Bestseller",
    "rating": 4.8,
    "reviewCount": 240,
    "readingTime": "6.0 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/mindful-marketing.jpg",
    "sampleExcerpt": [
      "Mindful Marketing by Rajesh Srinivasan: Building enduring brand equity."
    ],
    "tableOfContents": [
      "The Trust Deficit in Modern Advertising",
      "Positioning with Purpose",
      "Content Led Organic Distribution",
      "Measuring Long-Term Brand Affinity"
    ],
    "fileName": "Mindfull Marketing.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3644,
    "status": "PUBLISHED"
  },
  {
    "id": "book-financial-modelling-handbook",
    "slug": "financial-modelling-handbook",
    "title": "Financial Modelling Handbook",
    "subtitle": "Excel Architecture, DCF, M&A, and LBO Models",
    "author": "Zebra Learn",
    "description": "Master professional spreadsheet modeling: three-statement models, dynamic scenario toggles, debt schedules, sensitivity analysis, and corporate valuation templates.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 298,
    "format": "PDF (DRM-Free)",
    "fileSize": "22.1 MB",
    "category": "Finance & Accounting",
    "badge": "Practical",
    "rating": 4.9,
    "reviewCount": 395,
    "readingTime": "7.0 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/financial-modelling-handbook.jpg",
    "sampleExcerpt": [
      "Financial Modelling Handbook: Building professional three-statement dynamic models."
    ],
    "tableOfContents": [
      "Model Hygiene & Best Practice Standards",
      "Integrating Balance Sheet, P&L, and Cash Flow",
      "Scenario & Sensitivity Analysis Matrix",
      "Valuation via DCF and Relative Multiples"
    ],
    "fileName": "Financial Modelling Handbook Zebra Learn.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3635,
    "status": "PUBLISHED"
  },
  {
    "id": "book-residential-real-estate",
    "slug": "residential-real-estate",
    "title": "Master Residential Real Estate",
    "subtitle": "Market Cycles, Valuation, Title Due Diligence, and Investment",
    "author": "Ashwinder R Singh",
    "description": "The definitive Indian residential real estate guide by veteran industry leader Ashwinder R Singh. Covers market timing, legal due diligence, RERA protections, rental yields, and wealth creation.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 372,
    "format": "PDF (DRM-Free)",
    "fileSize": "39.6 MB",
    "category": "Real Estate",
    "badge": "Bestseller",
    "rating": 4.9,
    "reviewCount": 340,
    "readingTime": "8.5 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/residential-real-estate.jpg",
    "sampleExcerpt": [
      "Master Residential Real Estate by Ashwinder R Singh: Due diligence and investment playbooks."
    ],
    "tableOfContents": [
      "Macro Real Estate Cycles in India",
      "RERA Safeguards & Title Scrutiny Checklist",
      "Evaluating Under-Construction vs Ready-to-Move",
      "Maximizing Rental Yields and Capital Appreciation"
    ],
    "fileName": "Zebra Learn Residential Real Estate_Watermark_Watermark.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3642,
    "status": "PUBLISHED"
  },
  {
    "id": "book-industry-handbook",
    "slug": "industry-handbook",
    "title": "The Industry Handbook",
    "subtitle": "Analysis of Key Indian Sectors: FMCG, Banking, IT, Auto, and Pharma",
    "author": "Zebra Learn",
    "description": "Sector-by-sector breakdown of Indian industry dynamics: revenue drivers, margin structures, regulatory moats, and key performance indicators for equity researchers and professionals.",
    "priceInInr": 199.0,
    "originalPriceInInr": 990.0,
    "pages": 420,
    "format": "PDF (DRM-Free)",
    "fileSize": "50.9 MB",
    "category": "Business & Strategy",
    "badge": "Institutional",
    "rating": 4.9,
    "reviewCount": 410,
    "readingTime": "9.5 hrs",
    "edition": "Zebra Learn Edition",
    "coverImage": "/covers/the-industry-handbook.jpg",
    "sampleExcerpt": [
      "The Industry Handbook by Zebra Learn: Comprehensive sectoral analysis and KPIs."
    ],
    "tableOfContents": [
      "Banking & NBFCs: NIM, GNPA, and PCR",
      "FMCG & Consumer: Distribution and Gross Margins",
      "Information Technology: Utilization and Attrition",
      "Automotive & Ancillary Value Chains"
    ],
    "fileName": "Zebralearn-Industry Handbook.pdf",
    "sourceTelegram": "CourseDollarStock Answer",
    "telegramMessageId": 3640,
    "status": "PUBLISHED"
  }
];

// Combine initial catalog with dynamic registry
function compileBookCatalog(): Book[] {
  const idMap = new Map<string, Book>();
  for (const b of INITIAL_BOOK_CATALOG) {
    idMap.set(b.id, b);
  }
  if (Array.isArray(dynamicBooks)) {
    for (const b of (dynamicBooks as unknown as Book[])) {
      idMap.set(b.id, b);
    }
  }
  return Array.from(idMap.values());
}

export const BOOK_CATALOG: Book[] = compileBookCatalog();

export function getBookById(id: string): Book | undefined {
  return BOOK_CATALOG.find((b) => b.id === id);
}

export function getBookBySlug(slug: string): Book | undefined {
  return BOOK_CATALOG.find((b) => b.slug === slug || b.id === `book-${slug}`);
}

export function getBookCatalog(): Book[] {
  return BOOK_CATALOG;
}
