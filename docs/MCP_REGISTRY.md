# AnonTrove Model Context Protocol (MCP) Registry

The platform integrates Model Context Protocol servers to provide standardized agent tool invocation across Claude Code, Cursor, Windsurf, VS Code, and Google Antigravity.

## Configured Servers

### 1. Google Search Console MCP (`@modelcontextprotocol/server-gsc`)
- **Tools**: `search_analytics_query`, `url_inspection_inspect`, `sitemaps_list`, `sitemaps_submit`
- **Security Policy**: Least privilege read-only; service account credentials loaded from `appinfo11.txt`.

### 2. Google Analytics 4 MCP (`@modelcontextprotocol/server-ga4`)
- **Tools**: `run_report`, `run_realtime_report`, `get_metadata`
- **Security Policy**: Read-only reporting API; no customer PII exposed.

### 3. Lighthouse MCP (`@modelcontextprotocol/server-lighthouse`)
- **Tools**: `audit_url`, `extract_core_web_vitals`, `audit_seo_best_practices`
- **Security Policy**: Headless local Chrome auditing with zero persistent cache.

### 4. Playwright MCP (`@modelcontextprotocol/server-playwright`)
- **Tools**: `navigate`, `take_screenshot`, `evaluate_script`, `inspect_dom`
- **Security Policy**: Ephemeral sandboxed sessions for crawler simulation.

### 5. Filesystem MCP (`@modelcontextprotocol/server-filesystem`)
- **Tools**: `read_file`, `write_file`, `list_directory`, `search_files`
- **Security Policy**: Jailed strictly to project workspace directory.

### 6. Supabase PostgreSQL MCP (`@modelcontextprotocol/server-postgres`)
- **Tools**: `query`, `describe_tables`
- **Security Policy**: Read-only database role; row-level security enforced.

### 7. SQLite / DuckDB Cache MCP (`@modelcontextprotocol/server-sqlite`)
- **Tools**: `read_query`, `write_query`
- **Security Policy**: Local analytical store only; fail-closed on corrupted checksums.

### 8. GitHub Actions MCP (`@modelcontextprotocol/server-github`)
- **Tools**: `get_workflow_runs`, `dispatch_workflow`, `create_issue`
- **Security Policy**: Scoped strictly to workflow dispatch and issue reporting.

### 9. n8n Automation MCP (`@modelcontextprotocol/server-n8n`)
- **Tools**: `list_workflows`, `trigger_webhook`, `get_execution_status`
- **Security Policy**: Webhook HMAC authenticated.

### 10. Context7 Documentation MCP (`@upstash/context7-mcp`)
- **Tools**: `resolve-library-id`, `query-docs`
- **Security Policy**: Public developer docs lookup.
