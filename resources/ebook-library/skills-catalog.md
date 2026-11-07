# TBOOKS Skills & MCP Server Catalog

**Project ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`  
**Location:** `resources/ebook-library/skills-catalog.md`

---

## 1. Installed Antigravity Skills

| Skill Name | Purpose & Capabilities | License / Origin | Permissions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`python-patterns`** | Idiomatic Python 3.10+ async workflows, Telethon integration, Pydantic data schemas. | MIT / Internal | Filesystem, Process | Active |
| **`api-patterns`** | High-performance REST API contracts, Next.js route handlers, token security. | MIT / Internal | Network, Code | Active |
| **`database-design`** | SQLite FTS5 schemas, JSON registry indexing, ACID transactions. | MIT / Internal | Filesystem, SQLite | Active |
| **`nextjs-best-practices`** | Next.js 14 App Router, dynamic server rendering, streaming responses. | MIT / Internal | Code | Active |
| **`tailwind-patterns`** | Responsive modern UI design tokens, dark mode palette, typography hierarchy. | MIT / Internal | CSS | Active |
| **`lint-and-validate`** | Automated TypeScript typechecking, Next.js build verification, syntax linting. | Internal | Terminal | Active |
| **`systematic-debugging`** | Root cause analysis, crash reproduction, and automated patch verification. | Internal | Terminal | Active |

---

## 2. Connected MCP Servers

| MCP Server Name | Tools Provided | Use Case in TBOOKS Pipeline | Status |
| :--- | :--- | :--- | :--- |
| **`filesystem`** | `read_file`, `write_file`, `edit_file`, `list_directory` | Direct manipulation of books registry, manifests, and covers. | Connected |
| **`github-mcp-server`**| `push_files`, `create_pull_request`, `get_file_contents` | Automated remote synchronization to `tarikk786786/Ebook.git`. | Connected |
| **`chrome-devtools-mcp`**| `navigate_page`, `evaluate_script`, `take_screenshot` | Automated headless testing of live `/book/[slug]` and `/admin` routes. | Connected |
| **`railway_mcp`** | `list-deployments`, `get-logs`, `set-variables` | Worker orchestration and persistent long-running background tasks. | Connected |
| **`sentry_sentry`** | `search_errors`, `get_issue_details` | Production error monitoring and FloodWait telemetry alerts. | Connected |
| **`supabase_mcp`** | `execute_sql`, `list_tables` | Cloud relational backup and PostgreSQL vector search integration. | Connected |

---

## 3. Recommended Open-Source Extensions

1. **`ebook-meta` (Calibre Suite)**: CLI metadata extraction for EPUB, MOBI, AZW3, and FB2 formats.
2. **`OCRmyPDF`**: Multi-core Tesseract OCR layer injection into legacy scanned PDFs.
3. **`Typesense / Meilisearch`**: In-memory typo-tolerant search engine across all 1,772 books.
