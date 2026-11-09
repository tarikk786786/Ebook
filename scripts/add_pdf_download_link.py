with open('app/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """              <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
                Curated study guides, technical manuals, and reference materials across our digital collection.
              </p>
            </div>"""

replacement = """              <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
                Curated study guides, technical manuals, and reference materials across our digital collection.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="/AnonTrove_Complete_86k_Ebooks_Directory.pdf"
                  download="AnonTrove_Complete_86k_Ebooks_Directory.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors shadow-sm"
                  title="Download complete 86,260 ebook catalog directory in PDF format"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📥 Download 86k PDF Directory (786 Pages)</span>
                </a>
                <a
                  href="/all_ebooks_catalog.csv"
                  download="all_ebooks_catalog.csv"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EDE6] text-[#24231F] border border-[#E8E4DC] text-xs font-medium transition-colors"
                >
                  <span>📊 86k CSV Directory</span>
                </a>
              </div>
            </div>"""

if target in c:
    c = c.replace(target, replacement)
    with open('app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Successfully added 86k PDF download link to app/page.tsx!")
else:
    print("Target not found in app/page.tsx")
