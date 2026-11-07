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
}

export const BOOK_CATALOG: Book[] = [
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
      "Cover\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Title Page\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Copyright\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Contents\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Chapter 1 Looking at the Ecosystem\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Understanding Android’s Roots\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Company History\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
      "Version History\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000"
    ],
    "fileName": "Android Hacker's Handbook ( @LearnExploit ).pdf"
  },
  {
    "id": "book-the-web-application-hackers-handbook",
    "slug": "the-web-application-hackers-handbook",
    "title": "The Web Application Hacker's Handbook",
    "subtitle": "Finding and Exploiting Web Security Flaws (2nd Edition)",
    "author": "Dafydd Stuttard & Marcus Pinto",
    "description": "Finding and Exploiting Web Security Flaws (2nd Edition). In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 199.0,
    "originalPriceInInr": 899.0,
    "pages": 914,
    "format": "PDF (DRM-Free)",
    "fileSize": "14.7 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Classic",
    "rating": 5.0,
    "reviewCount": 680,
    "readingTime": "20.3 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/the-web-application-hackers-handbook.jpg",
    "sampleExcerpt": [
      "The Web Application Hacker’s Handbook Second Edition Finding and Exploiting Security Flaws Dafydd Stuttard Marcus Pinto",
      "The Web Application Hacker’s Handbook: Finding and Exploiting Security Flaws, Second Edition Published by John Wiley & Sons, Inc. 10475 Crosspoint Boulevard Indianapolis, IN 46256 www.wiley.com Copyright © 2011 by Dafydd Stuttard and Marcus Pinto Published by John Wiley & Sons, I...",
      "iii Dafydd Stuttard is an independent security consultant, author, and software developer. With more than 10 years of experience in security consulting, he specializes in the penetration testing of web applications and compiled soft- ware. Dafydd has worked with numerous banks, r..."
    ],
    "tableOfContents": [
      "Contents",
      "Introduction",
      "Chapter 1 Web Application (In)security",
      "The Evolution of Web Applications",
      "Common Web Application Functions",
      "Benefits of Web Applications",
      "Web Application Security",
      "\"This Site Is Secure\""
    ],
    "fileName": "The_Web_Application_Hacker's_Handbook_2nd_Edition.pdf"
  },
  {
    "id": "book-mastering-kali-linux-for-web-penetration-testing",
    "slug": "mastering-kali-linux-for-web-penetration-testing",
    "title": "Mastering Kali Linux for Web Penetration Testing",
    "subtitle": "Comprehensive Arsenal for Advanced Offensive Security & Auditing",
    "author": "OffSec Engineering Group",
    "description": "Comprehensive Arsenal for Advanced Offensive Security & Auditing. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 599.0,
    "pages": 332,
    "format": "PDF (DRM-Free)",
    "fileSize": "34.5 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Trending",
    "rating": 4.9,
    "reviewCount": 288,
    "readingTime": "7.4 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/mastering-kali-linux-for-web-penetration-testing.jpg",
    "sampleExcerpt": [
      "Mastering Kali Linux for Web Penetration Testing Test and evaluate all aspects of the design and implementation Michael McPhee BIRMINGHAM - MUMBAI",
      "Mastering Kali Linux for Web Penetration Testing Copyright © 2017 Packt Publishing All rights reserved. No part of this book may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, without the prior written permission of the publisher, except ...",
      "Credits Author Michael McPhee Copy Editor Yesha Gangani Reviewers Aamir Lakhani Dave Frohnapfel Project Coordinator Judie Jose Commissioning Editor Vijin Boricha Proofreader Safis Editing Acquisition Editor Rahul Nair Indexer Tejal Daruwale Soni Content Development Editor Devika ...",
      "About the Author Michael McPhee is a systems engineer at Cisco in New York, where he has worked for the last 4 years and has focused on cyber security, switching, and routing. Mike’s current role sees him consulting on security and network infrastructures, and he frequently runs ..."
    ],
    "tableOfContents": [
      "Cover",
      "Copyright",
      "Credits",
      "About the Author",
      "About the Reviewers",
      "www.PacktPub.com",
      "Customer Feedback",
      "Table of Contents"
    ],
    "fileName": "Mastering Kali Linux for Web Penetration Testing.pdf"
  },
  {
    "id": "book-linux-essentials-for-cybersecurity",
    "slug": "linux-essentials-for-cybersecurity",
    "title": "Linux Essentials for Cybersecurity",
    "subtitle": "Core CLI, Kernel Boundaries & Hardening Techniques",
    "author": "William Rothwell",
    "description": "Core CLI, Kernel Boundaries & Hardening Techniques. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 99.0,
    "originalPriceInInr": 499.0,
    "pages": 1966,
    "format": "PDF (DRM-Free)",
    "fileSize": "39.8 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Essential",
    "rating": 4.8,
    "reviewCount": 195,
    "readingTime": "43.7 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/linux-essentials-for-cybersecurity.jpg",
    "sampleExcerpt": [
      "About This E-Book EPUB is an open, industry-standard format for e-books. However, support for EPUB and its many features varies across reading devices and applications. Use your device or app settings to customize the presentation to your liking. Settings that you can customize o...",
      "Linux Essentials for Cybersecurity William “Bo” Rothwell Denise Kinsey |||||||||||||||||||| ||||||||||||||||||||",
      "Library of Congress Control Number: 2018941152 1 18 Trademarks All terms mentioned in this book that are known to be trademarks or service marks have been appropriately capitalized. Pearson IT Certification cannot attest to the accuracy of this information. Use of a term in this ...",
      "Copy Editor: Bart Reed Indexer: Ken Johnson Proofreader: Debbie Williams Technical Editors: Casey Boyles, Andrew Hurd, Ph.D. Publishing Coordinator: Vanessa Evans Designer: Chuti Prasertsith Composition: Studio Galou |||||||||||||||||||| ||||||||||||||||||||"
    ],
    "tableOfContents": [
      "About This E-Book",
      "Title Page",
      "Copyright Page",
      "Contents at a Glance",
      "Table of Contents",
      "About the Authors",
      "Dedications",
      "Acknowledgments"
    ],
    "fileName": "Linux Essentials for Cybersecurity.pdf"
  },
  {
    "id": "book-black-hat-graphql-pentesting-apis",
    "slug": "black-hat-graphql-pentesting-apis",
    "title": "Black Hat GraphQL & Pentesting APIs",
    "subtitle": "Breaking and Securing Modern REST, GraphQL and Webhook Endpoints",
    "author": "Corey J. Ball",
    "description": "Breaking and Securing Modern REST, GraphQL and Webhook Endpoints. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 599.0,
    "pages": 290,
    "format": "PDF (DRM-Free)",
    "fileSize": "21.8 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Hot",
    "rating": 4.9,
    "reviewCount": 234,
    "readingTime": "6.4 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/black-hat-graphql-pentesting-apis.jpg",
    "sampleExcerpt": [
      "Pentesting APIs A practical guide to discovering, fingerprinting, and exploiting APIs Maurício Harley",
      "Pentesting APIs Copyright © 2024 Packt Publishing All rights reserved. No part of this book may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, without the prior written permission of the publisher, except in the case of brief quotations e...",
      "My special dedication goes to my uncle Maurício, whose name was given to me by my father (his brother) as a tribute to him. Rest in peace, dear uncle. This book has been a dream for several years. Its publication aligns with my 30th professional anniversary. My father’s father wr...",
      "Contributors About the author Maurício Harley holds an MSc in cybersecurity, a Bachelor of Science in electrical engineering, and a technologist degree in telematics. He’s CISSP and double CCIE certified. He has written offensive security articles for some magazines. He has 30 ye..."
    ],
    "tableOfContents": [
      "Cover",
      "Title page",
      "Copyright and credits",
      "Contributors",
      "Table of Contents",
      "Preface",
      "Part 1: \nIntroduction to API Security",
      "Chapter 1: Understanding APIs and \ntheir Security Landscape"
    ],
    "fileName": "Pentesting_APIs.pdf"
  },
  {
    "id": "book-python-for-osint-threat-intelligence",
    "slug": "python-for-osint-threat-intelligence",
    "title": "Python for OSINT & Threat Intelligence",
    "subtitle": "Automating Reconnaissance, Social Graphing & Passive Intelligence",
    "author": "OffSec Open Source Intelligence",
    "description": "Automating Reconnaissance, Social Graphing & Passive Intelligence. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 129.0,
    "originalPriceInInr": 499.0,
    "pages": 137,
    "format": "PDF (DRM-Free)",
    "fileSize": "19.0 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Popular",
    "rating": 4.8,
    "reviewCount": 178,
    "readingTime": "3.0 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/python-for-osint-threat-intelligence.jpg",
    "sampleExcerpt": [
      "2 Who Is This Course For? I'm primarily doing a course for followers of my Twitter account (https://twitter.com/cyb_detective), in which I post tweets about OSINT (Open Source Intelligence). For those who are professionally involved or just interested in open data investigations ...",
      "3 Who should avoid this course? For those who have never done OSINT and are going to do OSINT. This course consists for the most part of specialized topics related to investigation and data collection. For those who want to learn Python in order to: - become a really good develop...",
      "4 How to take this course The first thing I advise you to do is to look at the table of contents, flip through the pages of the book, and clearly decide if this course will be useful to you. If you've made a clear decision, read one lesson each day thoughtfully and try every day ...",
      "5 But to strengthen your discipline and motivate you to take it to the end, I recommend you make a small donation. Free courses people often don't finish until the end, and paying will help you take learning seriously. Also, every donation will motivate me to make new OSINT cours..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Python_for_OSINT_21_day_course_for_beginners.pdf"
  },
  {
    "id": "book-rootkits-and-bootkits",
    "slug": "rootkits-and-bootkits",
    "title": "Rootkits and Bootkits",
    "subtitle": "Reversing Modern Malware and Next-Generation Stealth Threats",
    "author": "Alex Matrosov, Eugene Rodionov & Sergey Bratus",
    "description": "Reversing Modern Malware and Next-Generation Stealth Threats. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 199.0,
    "originalPriceInInr": 849.0,
    "pages": 450,
    "format": "PDF (DRM-Free)",
    "fileSize": "15.3 MB",
    "category": "Cybersecurity & Hacking",
    "badge": "Advanced",
    "rating": 4.9,
    "reviewCount": 215,
    "readingTime": "10.0 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/rootkits-and-bootkits.jpg",
    "sampleExcerpt": [
      "Rootkits and Bootkits Reversing Modern Malware and Next Generation Threats Alex Matrosov, Eugene Rodionov, and Sergey Bratus Foreword by Rodrigo Rubira Branco",
      "Rootkits and bootkits Reversing Modern Malware and Next Generation Threats by Alex Matrosov, Eugene Rodionov, and Sergey Bratus San Francisco"
    ],
    "tableOfContents": [
      "Brief Contents",
      "Contents in Detail",
      "Foreword",
      "Acknowledgments",
      "Abbreviations",
      "Introduction",
      "Why Read This Book?",
      "What’s in the Book?"
    ],
    "fileName": "Rootkits_and_Bootkits (@LearnExploit).pdf"
  },
  {
    "id": "book-data-analysis-with-llms-manning-2025",
    "slug": "data-analysis-with-llms-manning-2025",
    "title": "Data Analysis with LLMs (Manning 2025)",
    "subtitle": "Text, Tables, Images and Multimodal AI in Modern Production",
    "author": "Manning AI Publishing Group",
    "description": "Text, Tables, Images and Multimodal AI in Modern Production. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 199.0,
    "originalPriceInInr": 999.0,
    "pages": 233,
    "format": "PDF (DRM-Free)",
    "fileSize": "23.7 MB",
    "category": "AI & Data Science",
    "badge": "2025 Edition",
    "rating": 4.9,
    "reviewCount": 340,
    "readingTime": "5.2 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/data-analysis-with-llms-manning-2025.jpg",
    "sampleExcerpt": [
      "Overview of Mini-Projects Data Project Audio Transcribing speech recordings to text Answering voice queries about tabular data Translating speech to another language Graphs Translating questions about graphs to Cypher queries Images Answering arbitrary questions about images Reco...",
      "Data Analysis with LLMs Text, tables, images and sound Immanuel Trummer M A N N I N G SHELTER ISLAND",
      "For online information and ordering of this and other Manning books, please visit www.manning.com. The publisher offers discounts on this book when ordered in quantity. For more information, please contact Special Sales Department Manning Publications Co. 20 Baldwin Road PO Box 7..."
    ],
    "tableOfContents": [
      "brief contents",
      "contents",
      "preface",
      "acknowledgments",
      "about this book",
      "Who should read this book?",
      "How this book is organized: A road map",
      "About the code"
    ],
    "fileName": "Data_Analysis_with_LLMs_Text,_tables,_images_and_sound_2025,_Manning.pdf"
  },
  {
    "id": "book-funnel-marketing-mastery",
    "slug": "funnel-marketing-mastery",
    "title": "Funnel Marketing Mastery",
    "subtitle": "Architecting High-Conversion Acquisition & Retention Engines",
    "author": "Zebra Learn Publishing",
    "description": "Architecting High-Conversion Acquisition & Retention Engines. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 699.0,
    "pages": 84,
    "format": "PDF (DRM-Free)",
    "fileSize": "93.4 MB",
    "category": "Marketing & Growth",
    "badge": "Bestseller",
    "rating": 4.9,
    "reviewCount": 420,
    "readingTime": "1.9 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/funnel-marketing-mastery.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2025 All Rights Reserved ISBN - 978-93-49299-46-7 The right of ZebraLearn to be identified as the author of this work has been applied in accordance with the Copyright, Act, 1957. No part of this publication may be reproduced, stored in a retrieval s...",
      "DISCLAIMER This book and its contents, information, figures, statistics and financial data are being provided “as is” by the Publisher and the Author. This book’s information is solely intended for educational and illustrative purposes. Without the publisher’s and author’s writte...",
      "CONT 1 2 3 Introduction to Funnels What are Marketing Funnels? 2.1 Top of the Funnel 2.2 Middle of the Funnel 2.3 Bottom of the Funnel 1.1 Funnel Optimisation For Effective Marketing 06 11 19 32 11 32 07 25 38 3.1 Unveiling the Factors which influence Marketing Funnels 3.2 Unders...",
      "TENTS 4 5 6 Marketing Activities and How do They Affect the Funnel? 4.1 Examples of Different Companies’ Marketing Activities and Contributions to the Marketing Funnel 4.2 Marketing Activities by Local Stores and Malls 5.1 Implementation Factor 1: The Business Stage 5.2 Implement..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Funnel Marketing Mastery By Zebra Learn.pdf"
  },
  {
    "id": "book-breaking-into-b2b-marketing",
    "slug": "breaking-into-b2b-marketing",
    "title": "Breaking into B2B Marketing",
    "subtitle": "Account-Based Marketing, Pipeline Generation & Enterprise Sales",
    "author": "Zebra Learn Publishing",
    "description": "Account-Based Marketing, Pipeline Generation & Enterprise Sales. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 599.0,
    "pages": 100,
    "format": "PDF (DRM-Free)",
    "fileSize": "66.9 MB",
    "category": "Marketing & Growth",
    "badge": "Featured",
    "rating": 4.8,
    "reviewCount": 190,
    "readingTime": "2.2 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/breaking-into-b2b-marketing.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2025 All Rights Reserved ISBN: 978-93-49299-56-6 www.zebralearn.com The right of Rajesh Kumar to be identified as the author of this work has been applied in accordance with the Copyright, Act, 1957. No part of this publication may be reproduced, sto...",
      "DISCLAIMER This book and its contents, information, figures, statistics and financial data are being provided “as is” by the Publisher and the Author. This book’s information is solely intended for educational and illustrative purposes. Without the publisher’s and author’s writte...",
      "CONTENT 05 Navigating a Career in B2B Marketing 07 Top Motives to Go for a B2B Marketing Career 12 Financial Rewards in B2B Marketing Jobs 14 What type of organisations can be your potential employers? 22 What Types of Roles Exist in B2B Marketing? 48 Jobs in B2B Marketing Ecosys...",
      "Navigating a Career in We are seeing a remarkable opportunity for those aspiring to build a career in the B2B marketing field than ever before. B2B businesses are maturing, they are realising the power of positioning themselves and their businesses uniquely around their strengths..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Breaking into B2B Marketing By Zebra Learn.pdf"
  },
  {
    "id": "book-10-proven-trading-strategies",
    "slug": "10-proven-trading-strategies",
    "title": "10 Proven Trading Strategies",
    "subtitle": "Algorithmic Setups, Risk Management & Quantitative Market Models",
    "author": "Aseem Singhal",
    "description": "Algorithmic Setups, Risk Management & Quantitative Market Models. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 599.0,
    "pages": 94,
    "format": "PDF (DRM-Free)",
    "fileSize": "10.1 MB",
    "category": "FinTech & Trading",
    "badge": "Top Rated",
    "rating": 4.9,
    "reviewCount": 380,
    "readingTime": "2.1 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/10-proven-trading-strategies.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2025 All Rights Reserved ISBN: 978-93-49299-44-3 www.zebralearn.com The right of Aseem Singhal to be identiЃed as the author of this work has been applied in accordance with the Copyright, Act, 1957. No part of this publication may be reproduced, sto...",
      "DISCLAIMER The information contained in this book is intended for general informational purposes only. The author(s) of this book have made efforts to ensure the accuracy and reliability of the information provided. However, they make no representations or warranties of any kind,...",
      "INDEX Positional Trading— Patience Pays O> Advanced Strategy – The Triple Convergence Setup Intraday Trading:How to Trade Smartly During the Day Swing Trading – Catching the Waves, Not the Ripples 04 03 02 01 07 15 25 33"
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "10 Trading Strategies BY ASEEM SINGHAL.pdf"
  },
  {
    "id": "book-taxation-simplified-part-1",
    "slug": "taxation-simplified-part-1",
    "title": "Taxation Simplified (Part 1)",
    "subtitle": "Direct Tax, Deductions, Capital Gains & Business Structuring",
    "author": "CA Rishita Motwani",
    "description": "Direct Tax, Deductions, Capital Gains & Business Structuring. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 129.0,
    "originalPriceInInr": 499.0,
    "pages": 112,
    "format": "PDF (DRM-Free)",
    "fileSize": "93.8 MB",
    "category": "FinTech & Trading",
    "badge": "Practical",
    "rating": 4.9,
    "reviewCount": 295,
    "readingTime": "2.5 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/taxation-simplified-part-1.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2024 Rishita Motwani 2024 All Rights Reserved www.zebralearn.com The right of Rishita Motwani to be identified as the author of this work has been asserted in accordance with the Copyright Act, 1957. No part of this publication may be reproduced, sto...",
      "Disclaimer The content, information, figures, statistics and financial data in this book are offered solely for educational and illustrative purposes; it is not meant to serve as a source of credit analysis or as a source of advice regarding the material covered. This Book’s mate...",
      "Your money works harder when you understand the tax game. Smart tax planning isn’t an expense; it’s an investment in your future. CA Rishita Advocate, Finance Educa­ tor, Ex-IIM Faculty 5 Rishita Motwani"
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Taxation Simplified - Part 1 by Rishita Motwani.pdf"
  },
  {
    "id": "book-taxation-simplified-part-2",
    "slug": "taxation-simplified-part-2",
    "title": "Taxation Simplified (Part 2)",
    "subtitle": "GST Compliance, Corporate Filings & Cross-Border Invoicing",
    "author": "CA Rishita Motwani",
    "description": "GST Compliance, Corporate Filings & Cross-Border Invoicing. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 129.0,
    "originalPriceInInr": 499.0,
    "pages": 71,
    "format": "PDF (DRM-Free)",
    "fileSize": "62.6 MB",
    "category": "FinTech & Trading",
    "badge": "Practical",
    "rating": 4.9,
    "reviewCount": 280,
    "readingTime": "1.6 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/taxation-simplified-part-2.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2024 Rishita Motwani 2024 All Rights Reserved www.zebralearn.com The right of Rishita Motwani to be identified as the author of this work has been asserted in accordance with the Copyright Act, 1957. No part of this publication may be reproduced, sto...",
      "Disclaimer The content, information, figures, statistics and financial data in this book are offered solely for educational and illustrative purposes; it is not meant to serve as a source of credit analysis or as a source of advice regarding the material covered. This Book’s mate...",
      "Your money works harder when you understand the tax game. Smart tax planning isn’t an expense; it’s an investment in your future. CA Rishita Advocate, Finance Educator, Ex-IIM Faculty 5 Rishita Motwani"
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Taxation Simplified - Part 2 by Rishita Motwani.pdf"
  },
  {
    "id": "book-101-linux-commands-handbook",
    "slug": "101-linux-commands-handbook",
    "title": "101 Linux Commands Handbook",
    "subtitle": "A Practical Developer's Visual Manual for Everyday Shell Mastery",
    "author": "Flavio Copes",
    "description": "A Practical Developer's Visual Manual for Everyday Shell Mastery. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 79.0,
    "originalPriceInInr": 299.0,
    "pages": 300,
    "format": "PDF (DRM-Free)",
    "fileSize": "765.9 KB",
    "category": "Developer & Engineering",
    "badge": "Handbook",
    "rating": 4.9,
    "reviewCount": 510,
    "readingTime": "6.7 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/101-linux-commands-handbook.jpg",
    "sampleExcerpt": [
      "Table of Contents 101 Linux commands Open-source eBook 16 .................................. Hacktoberfest 17 .............................................................................. About me 18 ..................................................................................",
      "The df command 51 ............................................................................. The help command 55 ......................................................................... Syntax 56 ...................................................................................",
      "Compress a directory: 77 ................................................................. Decompress a directory: 78 ............................................................. Verbose (detailed) output while compressing: 79 ............................ The whatis command 80 ....",
      "The man command 103 ....................................................................... The passwd command 105 ................................................................. Example 106 .................................................................................... Th..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "101 Linux Commands .pdf"
  },
  {
    "id": "book-a2z-amazon-advertising-mastery",
    "slug": "a2z-amazon-advertising-mastery",
    "title": "A2Z Amazon Advertising Mastery",
    "subtitle": "PPC Campaigns, Bidding Algorithms & Sponsored Brand Scaling",
    "author": "Ecom Growth Labs",
    "description": "PPC Campaigns, Bidding Algorithms & Sponsored Brand Scaling. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 129.0,
    "originalPriceInInr": 499.0,
    "pages": 33,
    "format": "PDF (DRM-Free)",
    "fileSize": "71.8 MB",
    "category": "Marketing & Growth",
    "badge": "Scale",
    "rating": 4.7,
    "reviewCount": 165,
    "readingTime": "1.5 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/a2z-amazon-advertising-mastery.jpg",
    "sampleExcerpt": [
      "What is Amazon Ads? Amazon Ads ek paid promotion system hai jisme aap apne product ko Amazon search results, product pages aur shopping journey me top visibility dilate hain. ------------A2ZGrowth.com------------",
      "Who Needs Amazon Ads? When You Should Run Amazon Ads ? ------------A2ZGrowth.com------------"
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "A2z Amazon Ads .pdf"
  },
  {
    "id": "book-careers-in-supply-chain-global-logistics",
    "slug": "careers-in-supply-chain-global-logistics",
    "title": "Careers in Supply Chain & Global Logistics",
    "subtitle": "Procurement, ERP Architecture & Lean Operations Playbook",
    "author": "Sandeep Chatterjee",
    "description": "Procurement, ERP Architecture & Lean Operations Playbook. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 99.0,
    "originalPriceInInr": 399.0,
    "pages": 102,
    "format": "PDF (DRM-Free)",
    "fileSize": "21.8 MB",
    "category": "Business & Strategy",
    "badge": "Executive",
    "rating": 4.8,
    "reviewCount": 140,
    "readingTime": "2.3 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/careers-in-supply-chain-global-logistics.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2025 All Rights Reserved ISBN: 978-93-49299-53-5 www.zebralearn.com The right of Sandeep Chatterjee to be identiɭed as the author of this work has been applied in accordance with the Copyright, Act, 1957. No part of this publication may be reproduced...",
      "DISCLAIMER This book and its contents, information, ɭgures, statistics and ɭnancial data are being provided “as is” by the Publisher and the Author. This book’s information is solely intended for educational and illustrative purposes. Without the publisher’s and author’s written ...",
      "ABOUT THE AUTHOR Sandeep is a Supply Chain and Sustainability Leader with IBM Consulting with responsibility for engagements in supply chain, sustainability leveraging technology. Prior to IBM Consulting, he has worked with Deloitte, KPMG, Tata Motors, Lafarge, Infosys and Oracle..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "Careers In Supply Chain BY SANDEEP CHATTERJEE.pdf"
  },
  {
    "id": "book-the-startup-fundraising-framework",
    "slug": "the-startup-fundraising-framework",
    "title": "The Startup Fundraising Framework",
    "subtitle": "Pitch Decks, Cap Tables, Term Sheets & Angel Syndicate Negotiations",
    "author": "Zebra Learn Publishing",
    "description": "Pitch Decks, Cap Tables, Term Sheets & Angel Syndicate Negotiations. In-depth manual covering core architecture, end-to-end frameworks, and actionable playbooks for practitioners and founders.",
    "priceInInr": 149.0,
    "originalPriceInInr": 699.0,
    "pages": 72,
    "format": "PDF (DRM-Free)",
    "fileSize": "21.9 MB",
    "category": "Business & Strategy",
    "badge": "Founder Pack",
    "rating": 4.9,
    "reviewCount": 320,
    "readingTime": "1.6 hrs",
    "edition": "2026 Verified Edition",
    "coverImage": "/covers/the-startup-fundraising-framework.jpg",
    "sampleExcerpt": [
      "First Published by ZebraLearn 2024 All Rights Reserved No part of this publication may be reproduced, stored in a retrieval system, or transmitted, in any form or by any means (electronic, mechanical, photocopying, recording or otherwise), without the prior written permission of ...",
      "Our content is intended to be used and must be used for educational purposes only. The readers must conduct their analysis before making any decision based on their circumstances. Readers should take independent financial advice, depend on independent research, or verify any info...",
      "ACKNOWLEDGEMENT I want to thank my parents and my family, my partners, especially Mehul Shah and Sharad Todi and my friends for their unconditional and selfless support. Thank you to my peers and the publishing team for making this dream come true. They have been my backbone The ..."
    ],
    "tableOfContents": [
      "1. Architecture & Theoretical Foundations",
      "2. Core Concepts, Tooling & Environment Setup",
      "3. Step-by-Step Implementation Workflows",
      "4. Production Hardening & Security Best Practices",
      "5. Advanced Case Studies & Live Playbooks",
      "6. Troubleshooting & Reference Appendix"
    ],
    "fileName": "FUNDRAISING FRAMEWORK By Zebra Learn.pdf"
  }
];

export function getBookById(id: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.id === id);
}

export function getBookBySlug(slug: string): Book | undefined {
  return BOOK_CATALOG.find(b => b.slug === slug);
}
