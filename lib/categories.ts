import { BOOK_CATALOG, Book } from '@/lib/catalog';

export interface CategoryDefinition {
  slug: string;
  name: string;
  iconName: string;
  badge: string;
  description: string;
  longDescription: string;
  metaTitle: string;
  metaDescription: string;
  matchedCatalogCategories: string[];
  subcategories: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export const AUTHORITATIVE_CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'programming',
    name: 'Programming & Software Engineering',
    iconName: 'Code',
    badge: 'Popular',
    description: 'Practical guides, design pattern manuals, system architecture playbooks, and coding reference books.',
    longDescription: 'Explore comprehensive, DRM-free software engineering ebooks covering full-stack development, algorithms, system design, modern JavaScript/TypeScript, Python, Go, Rust, and API engineering.',
    metaTitle: 'Programming & Software Engineering eBooks | AnonTrove',
    metaDescription: 'Download verified, DRM-free programming ebooks and software engineering manuals in PDF. Modern web dev, backend architectures, Python, Rust, and systems design.',
    matchedCatalogCategories: [
      'Programming & Software Engineering',
      'Programming & Developer Assets',
      'Programming, Web & APIs'
    ],
    subcategories: ['Python Guides', 'TypeScript & JavaScript', 'System Design', 'Algorithms & Data Structures', 'Rust & Systems Programming'],
    faqs: [
      {
        question: 'Are these programming ebooks suitable for self-taught developers?',
        answer: 'Yes. Our catalog includes both beginner-friendly foundations and advanced practitioner-level architectures with working code samples and cheat sheets.'
      },
      {
        question: 'What format are the programming books delivered in?',
        answer: 'All titles are delivered in universal DRM-free PDF formats, allowing you to read on any laptop, tablet, or mobile device without proprietary software.'
      },
      {
        question: 'Can I read the books directly in my browser without downloading?',
        answer: 'Yes. AnonTrove provides a zero-install in-browser reader with bookmarking, dark/sepia themes, and zoom controls accessible immediately after purchase.'
      }
    ]
  },
  {
    slug: 'cybersecurity',
    name: 'Cybersecurity & Ethical Hacking',
    iconName: 'Shield',
    badge: 'Defensive',
    description: 'Penetration testing methodologies, malware reverse engineering, network defense, and bug bounty guides.',
    longDescription: 'Deep-dive security handbooks covering offensive security operations, OWASP ASVS compliance, network protocol exploitation, exploit development, and enterprise threat modeling.',
    metaTitle: 'Cybersecurity & Ethical Hacking eBooks | AnonTrove',
    metaDescription: 'Download DRM-free cybersecurity ebooks, ethical hacking manuals, reverse engineering guides, and network defense blueprints in PDF format.',
    matchedCatalogCategories: [
      'Cybersecurity & Hacking',
      'Cybersecurity & Ethical Hacking',
      'Hacking & Defense'
    ],
    subcategories: ['Penetration Testing', 'Reverse Engineering', 'Web Application Security', 'Malware Analysis', 'Network Security'],
    faqs: [
      {
        question: 'Do these security books include hands-on lab exercises?',
        answer: 'Most guides cover real-world command lines, tool usage (Wireshark, Metasploit, Burp Suite), and step-by-step reproduction environments.'
      },
      {
        question: 'Is ethical hacking legal to study using these books?',
        answer: 'Yes. All instructional guides are designed for authorized defensive security testing, educational research, and infrastructure hardening.'
      }
    ]
  },
  {
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence & Machine Learning',
    iconName: 'Cpu',
    badge: 'Trending',
    description: 'Deep learning foundations, LLM engineering, neural network architectures, and prompt design frameworks.',
    longDescription: 'Master modern artificial intelligence, Retrieval-Augmented Generation (RAG), fine-tuning architectures, computer vision, and mathematical foundations for AI engineering.',
    metaTitle: 'AI & Machine Learning eBooks | AnonTrove',
    metaDescription: 'Comprehensive AI & Machine Learning ebooks, LLM engineering blueprints, and PyTorch deep learning guides. Verified DRM-free PDF downloads.',
    matchedCatalogCategories: [
      'Artificial Intelligence & Machine Learning',
      'AI & Machine Learning',
      'AI & Data Science',
      'Artificial Intelligence',
      'Technology, Digital Business, Software & AI'
    ],
    subcategories: ['Large Language Models (LLMs)', 'Deep Learning', 'PyTorch & TensorFlow', 'RAG & Vector Databases', 'Prompt Engineering'],
    faqs: [
      {
        question: 'What math background is needed for these AI books?',
        answer: 'Titles range from conceptual guides requiring basic algebra and Python to advanced mathematical treatments of tensor calculus and linear algebra.'
      }
    ]
  },
  {
    slug: 'trading-and-finance',
    name: 'Trading, Stocks & Quantitative Finance',
    iconName: 'TrendingUp',
    badge: 'Finance',
    description: 'Price action blueprints, algorithmic trading setups, options hedging strategies, and wealth accumulation guides.',
    longDescription: 'Disciplined technical analysis, swing trading playbooks, futures & options risk management, and quantitative finance methods curated for Indian and global financial markets.',
    metaTitle: 'Trading, Stocks & Options eBooks | AnonTrove',
    metaDescription: 'Download verified trading ebooks, price action guides, stock market investing blueprints, and options hedging manuals in DRM-free PDF format.',
    matchedCatalogCategories: [
      'Trading, Stocks & Quantitative Finance',
      'Trading & Wealth',
      'Trading, Stocks & Options',
      'Trading, Finance & Investing',
      'Trading, Equity & Finance',
      'FinTech & Trading',
      'Finance & Accounting',
      'Investing, Markets & Capital Allocation',
      'Business Finance, Accounting & Cash Flow'
    ],
    subcategories: ['Price Action & Candlesticks', 'Options Strategies', 'Risk Management', 'Value Investing', 'Algorithmic Trading'],
    faqs: [
      {
        question: 'Are these trading books applicable to the Indian Stock Market (NSE/BSE)?',
        answer: 'Yes. The underlying price action, market structure, risk-reward frameworks, and psychology apply directly to Indian and international equities, futures, and indices.'
      }
    ]
  },
  {
    slug: 'cloud-and-devops',
    name: 'Cloud Architecture & DevOps',
    iconName: 'Cloud',
    badge: 'Infrastructure',
    description: 'Kubernetes orchestration, Docker containerization, AWS/GCP cloud patterns, and CI/CD automation.',
    longDescription: 'Reliable cloud engineering literature covering microservices design, infrastructure as code (Terraform), site reliability engineering (SRE), and observability pipelines.',
    metaTitle: 'Cloud Architecture & DevOps eBooks | AnonTrove',
    metaDescription: 'Download cloud computing ebooks, Kubernetes administration guides, AWS architecture blueprints, and Docker containerization manuals.',
    matchedCatalogCategories: [
      'Cloud Architecture & DevOps',
      'DevOps & Infrastructure'
    ],
    subcategories: ['Kubernetes & Docker', 'Terraform & IaC', 'AWS & Cloud Systems', 'SRE & Observability', 'CI/CD Automation'],
    faqs: [
      {
        question: 'Do these books cover certification curricula like CKA or AWS Solutions Architect?',
        answer: 'Many guides align directly with core competency areas required for industry certifications including CKA, CKAD, and AWS Certified Solutions Architect.'
      }
    ]
  },
  {
    slug: 'business-and-startups',
    name: 'Business, Startups & Entrepreneurship',
    iconName: 'Briefcase',
    badge: 'Founders',
    description: 'Zero-to-one validation, startup financial modeling, pitch deck construction, and product-market fit playbooks.',
    longDescription: 'Actionable founder manuals and business leadership textbooks, including Zebra Learn startup frameworks, operational accounting, and scaling playbooks.',
    metaTitle: 'Business & Startup eBooks | AnonTrove',
    metaDescription: 'Download verified startup manuals, entrepreneurship guides, product-market fit playbooks, and venture strategy textbooks in PDF format.',
    matchedCatalogCategories: [
      'Business & Solopreneurship',
      'Business & Startups',
      'Business, Startups & Careers',
      'Business & Strategy',
      'Startups & Entrepreneurship',
      'Small Business, Solopreneurship & Business Models',
      'Innovation, Product Management & Design',
      'Business Strategy & Competitive Advantage',
      'Leadership & Executive Development',
      'Management, Organization & Company Culture',
      'Marketing, Branding & Positioning',
      'Copywriting, Advertising, Content & Growth',
      'Sales, Selling & Customer Acquisition',
      'Negotiation, Communication & Influence',
      'Business Finance, Accounting & Cash Flow',
      'Investing, Markets & Capital Allocation',
      'Personal Finance, Wealth & Financial Freedom',
      'Economics, Business History & Economic Systems',
      'Psychology, Decision-Making & Behavioral Science',
      'Productivity, Focus, Habits & Execution',
      'Operations, Process, Quality & Supply Chain',
      'Technology, Digital Business, Software & AI',
      'Ecommerce, Retail, DTC & Digital Commerce',
      'Customer Experience, Service & Customer Success',
      'Founder Biographies & Business Memoirs',
      'Corporate Case Studies, Business Stories & Failure',
      'Global Business, International Markets & Emerging Economies',
      'Sustainability, Social Enterprise, Ethics & Impact',
      'Talent, Teams, Hiring & Workplace'
    ],
    subcategories: ['Startup Ideation', 'Fundraising & Pitching', 'Unit Economics', 'Growth Marketing', 'Product Management'],
    faqs: [
      {
        question: 'Are Zebra Learn startup books included in this collection?',
        answer: 'Yes, our collection features curated Zebra Learn titles including Startupology, Financial Modeling, and Visual Learning manuals.'
      }
    ]
  },
  {
    slug: 'exam-preparation',
    name: 'Academic & Exam Preparation Notes',
    iconName: 'GraduationCap',
    badge: 'Academics',
    description: 'Concise revision booklets, topic-wise practice question sets, and handwritten engineering notes.',
    longDescription: 'Focused study companions, solved papers, formula sheets, and competitive exam preparation materials covering engineering, commerce, and technical certifications.',
    metaTitle: 'Exam Preparation & Study Notes eBooks | AnonTrove',
    metaDescription: 'Download verified study notes, exam preparation booklets, solved question banks, and concise revision notes in DRM-free PDF format.',
    matchedCatalogCategories: [
      'Academic & Exam Preparation Notes',
      'Exam Preparation & Study Notes',
      'Course Notes & Exam Prep',
      'Academic & Exam Preparation'
    ],
    subcategories: ['Engineering Notes', 'Competitive Exam Guides', 'Formula Sheets', 'Commerce & Accounts Notes', 'Solved Papers'],
    faqs: [
      {
        question: 'Can I print these study notes for offline revision?',
        answer: 'Yes. Because our files are DRM-free PDFs, you can print them or annotate them on tablets with Apple Pencil or stylus.'
      }
    ]
  },
  {
    slug: 'educational-guides',
    name: 'Technical & Educational Guides',
    iconName: 'BookMarked',
    badge: 'Comprehensive',
    description: 'Curated technical reference manuals, software walkthroughs, and practical educational handbooks.',
    longDescription: 'The broadest library of instructional ebooks, software manuals, technical tutorials, and skill-building guides spanning multiple vocational and digital domains.',
    metaTitle: 'Technical & Educational eBooks | AnonTrove',
    metaDescription: 'Explore thousands of verified technical guides, educational reference manuals, and skill-building ebooks. Instant access in PDF format.',
    matchedCatalogCategories: [
      'Technical & Educational Guides',
      'Educational Guides'
    ],
    subcategories: ['Software Reference', 'Vocational Manuals', 'Data Literacy', 'Digital Tools', 'Practical Handbooks'],
    faqs: [
      {
        question: 'How often is this educational collection updated?',
        answer: 'New verified titles and revised editions are indexed and verified regularly into our digital catalog.'
      }
    ]
  },
  {
    slug: 'personal-development',
    name: 'Personal Development & Psychology',
    iconName: 'Brain',
    badge: 'Growth',
    description: 'Cognitive models, productivity frameworks, behavioral psychology, and peak performance guides.',
    longDescription: 'Evidence-based psychology manuals, habit engineering frameworks, and leadership development literature designed to enhance cognitive clarity and executive performance.',
    metaTitle: 'Personal Development & Psychology eBooks | AnonTrove',
    metaDescription: 'Download personal development ebooks, behavioral psychology guides, and productivity frameworks in DRM-free PDF format.',
    matchedCatalogCategories: [
      'Self-Improvement & Psychology',
      'Personal Development'
    ],
    subcategories: ['Productivity Systems', 'Behavioral Psychology', 'Leadership Mindset', 'Habit Engineering', 'Decision Making'],
    faqs: [
      {
        question: 'Are these books actionable or purely theoretical?',
        answer: 'The titles in this collection focus heavily on practical frameworks, worksheets, and actionable habits you can implement immediately.'
      }
    ]
  },
  {
    slug: 'professional-textbooks',
    name: 'Professional Guides & Textbooks',
    iconName: 'Library',
    badge: 'Reference',
    description: 'Rigorous reference texts, industry standard practices, compliance handbooks, and collegiate manuals.',
    longDescription: 'Authoritative, in-depth reference textbooks designed for corporate practitioners, legal consultants, accountants, and senior technical leads.',
    metaTitle: 'Professional Guides & Textbooks | AnonTrove',
    metaDescription: 'Download verified professional textbooks, industry reference manuals, and advanced technical literature in DRM-free PDF format.',
    matchedCatalogCategories: [
      'Professional Guides & Textbooks',
      'AutoCAD & Engineering Design',
      'Design & Creative Arts'
    ],
    subcategories: ['Engineering Standards', 'Corporate Accounting', 'CAD & Design Systems', 'Legal & Compliance', 'Industry Handbooks'],
    faqs: [
      {
        question: 'Are full table of contents available before purchasing?',
        answer: 'Yes. Every title on AnonTrove includes a preview of its table of contents and sample excerpt on the product page.'
      }
    ]
  }
];

export function getAllCategories(): CategoryDefinition[] {
  return AUTHORITATIVE_CATEGORIES;
}

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return AUTHORITATIVE_CATEGORIES.find((c) => c.slug === slug);
}

export function getBooksForCategory(categorySlug: string): Book[] {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return [];

  return BOOK_CATALOG.filter((b) => {
    if (b.status === 'DRAFT' || b.id === 'book-master-bundle') return false;
    return cat.matchedCatalogCategories.includes(b.category);
  });
}
