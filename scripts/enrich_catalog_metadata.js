const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../data/books_registry.json');
const rawData = fs.readFileSync(REGISTRY_PATH, 'utf8');
const books = JSON.parse(rawData);

console.log(`Starting enrichment for ${books.length} items...`);

let enrichedCount = 0;
const categoryStats = {};
const typeStats = {};

const enrichedBooks = books.map((book) => {
  let { title, fileName, category, primaryResourceType, author, subtitle, description, badge } = book;
  const fullText = `${title || ''} ${fileName || ''}`.toLowerCase();

  // 1. Culinary Arts & MasterClass
  if (/gordon|recipe|poached egg|duck with|steak|roasted|chicken|kitchen layout|knife skills|pasta dough|souffl|minestrone|culinary|chef|cooking/i.test(fullText)) {
    category = 'Culinary Arts & Cooking';
    primaryResourceType = 'culinary_guide';
    author = author && !author.includes('Unknown') ? author : 'Gordon Ramsay';
    badge = 'MasterClass';
    enrichedCount++;
  }
  // 2. Fitness, Health & Nutrition
  else if (/bodybuilder|workout|gut mechanic|supplement|fitness|diet|nutrition|muscle|hypertrophy|nippard|fat loss|recomposition|wimhof/i.test(fullText)) {
    category = 'Health, Fitness & Nutrition';
    primaryResourceType = /workbook|manual|guide/i.test(fullText) ? 'workbook' : 'published_ebook';
    badge = 'Health & Wellness';
    enrichedCount++;
  }
  // 3. Exam Preparation, Crackers & Study Materials
  else if (/mains level|mixed questions|exam|crack|question paper|syllabus|notes|handbook.*annotat|prelims|mock test/i.test(fullText)) {
    category = 'Exam Preparation & Study Notes';
    primaryResourceType = 'study_notes';
    badge = 'Exam Prep';
    enrichedCount++;
  }
  // 4. Project Codebases, Assignments & Developer Assets
  else if (/project codebase|apis list|team spy|js part|css part|socketio|assignment|cheatsheet|quick reference|oops.*qs/i.test(fullText)) {
    category = 'Programming & Developer Assets';
    primaryResourceType = 'code_template';
    badge = 'Source Code & Project';
    enrichedCount++;
  }
  // 5. Cybersecurity & Ethical Hacking
  else if (/hack|security|pentest|bug bounty|cyber|malware|wi-fi|injection|exploit|recon/i.test(fullText)) {
    category = 'Cybersecurity & Ethical Hacking';
    primaryResourceType = /handbook|101|guide/i.test(fullText) ? 'technical_manual' : 'published_ebook';
    badge = 'Cybersecurity';
    enrichedCount++;
  }
  // 6. Trading, Investing & Financial Analysis
  else if (/trade|stock|invest|equity|market|crypto|option|forex|candlestick|nifty|hurst|profit magic|taxation|zebra learn/i.test(fullText)) {
    category = 'Trading, Finance & Investing';
    primaryResourceType = 'published_ebook';
    badge = 'Finance & Wealth';
    if (/zebra learn/i.test(fullText)) {
      author = 'Zebra Learn';
      badge = 'Zebra Learn Edition';
    }
    enrichedCount++;
  }
  // 7. Business, Marketing & Monetization
  else if (/money models|marketing|sales|lead magnet|linkedin|copywriting|hormozi|monetize|client acquisition|agency/i.test(fullText)) {
    category = 'Business, Sales & Marketing';
    primaryResourceType = 'published_ebook';
    if (/hormozi/i.test(fullText) || /\$100m/i.test(fullText)) {
      author = 'Alex Hormozi';
      badge = 'Business Bestseller';
    }
    enrichedCount++;
  }
  // 8. Workbooks, Prompts & Checklists
  else if (/worksheet|workbook|checklist|prompt|templates/i.test(fullText)) {
    category = category || 'Professional Guides & Tools';
    primaryResourceType = 'workbook';
    badge = 'Action Workbook';
    enrichedCount++;
  }

  // Title Cleanup: Remove spam prefixes
  let cleanTitle = title || '';
  cleanTitle = cleanTitle.replace(/^(www\.[a-z0-9.-]+\.[a-z]{2,}\s*[-–—:]*\s*)/i, '');
  cleanTitle = cleanTitle.replace(/[-_]team[-_\s]spy/gi, '');
  cleanTitle = cleanTitle.replace(/password\s+abcd/gi, '');
  cleanTitle = cleanTitle.replace(/[-_]team[-_\s]cyberx/gi, '');
  cleanTitle = cleanTitle.replace(/\.docx?$/gi, '');
  cleanTitle = cleanTitle.trim();
  if (cleanTitle.length > 2) {
    title = cleanTitle;
  }

  // Collect statistics
  categoryStats[category] = (categoryStats[category] || 0) + 1;
  typeStats[primaryResourceType] = (typeStats[primaryResourceType] || 0) + 1;

  return {
    ...book,
    title,
    category,
    primaryResourceType,
    author: author || 'AnonTrove Curators',
    badge: badge || book.badge,
  };
});

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(enrichedBooks, null, 2), 'utf8');

console.log(`Enrichment complete! Total enriched: ${enrichedCount}`);
console.log('Categories summary:', categoryStats);
console.log('Resource types summary:', typeStats);
