"""
Cleans marketing claims, aligns title counts with verified numbers, and removes ungrounded publisher claims.
"""
with open('projects/anon-trove-ebooks/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace conflicting title counts
content = content.replace('86,269+ Verified Documents & Titles', '18,100+ Books & Study Guides')
content = content.replace('Explore 86,269+ Titles', 'Explore 18,100+ Titles')
content = content.replace('View All 12,192+ Titles', 'View All 18,100+ Titles')
content = content.replace('href="#catalog"', 'href="#catalog-shelf"')
content = content.replace('Direct UPI & Card Settlement', 'Direct Instant UPI Delivery')
content = content.replace('Top Demanded Literature • Highest Rated by Founders & Engineers', 'Curated Academic & Professional Literature • Instant PDF Delivery')

with open('projects/anon-trove-ebooks/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx text and claims!')
