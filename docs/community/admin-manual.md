# Admin manual — community marketplace

Access admin pages with a valid `ADMIN_ACCESS_SECRET` (`x-admin-token` header, `Authorization: Bearer`, or `admin_session` cookie).

## Queues

### Contributions (`/admin/contributions`)

1. Open the submission queue; filter by status (`submitted`, `under_review`, `license_pending`, etc.).
2. Open a submission detail view for metadata, source URL, and proof storage key.
3. **License review** — verify commercial rights on the linked platform; set license row to `verified` or `rejected` with notes.
4. **Approve** only when license evidence is satisfactory and list price respects the **≤10% of verified retail** rule (enforced server-side).
5. **Publish** — sets `published_catalog_ref` to the catalog book id used at checkout; until published, paid orders do not create contributor credits.
6. **Reject** — document reason in admin notes; contributor sees status update.

Status machine (high level): `draft` → `submitted` → `under_review` / `license_pending` → `approved` → `published` (or `rejected` at any review stage).

### Requests (`/admin/requests`)

1. Review reader requests from `/request-ebook` and the public board.
2. Mark duplicates (`duplicate_of`), fulfil by publishing a matching submission, or close as `rejected` / `closed`.
3. Upvotes are informational; no automatic fulfilment.

### Earnings (`/admin/earnings`)

- Read-only ledger: credits from paid community sales, debits from payouts or refund stubs.
- Credits are written automatically on FamGateway **paid** transition (webhook + poll)—admins do not insert credits manually.
- Filter by contributor or `entry_type` (`credit` / `debit`).

### Payouts (`/admin/payouts`)

Manual UPI workflow (no gateway payout API):

1. Contributor requests withdrawal from their dashboard (minimum amount from **Community settings**).
2. **Approve** or **reject** the payout request.
3. Send UPI to the contributor’s on-file `upi_id` using your bank app.
4. **Mark paid** — enter the UPI / bank **reference ID** (min 4 characters). This posts a ledger debit and closes the request.
5. Never mark paid before funds actually leave your account.

### Community settings (`/admin/community-settings`)

Adjust platform settings stored in `platform_settings`:

- **Reward split** — contributor vs platform share of list price (must sum to 100%).
- **Pricing rules** — max suggested price as a fraction of retail (default 10%).
- **Payout rules** — e.g. `minWithdrawalInr` (default ₹100).

Changes apply to **new** sales and payout validations; they do not rewrite historical ledger rows.

## Refunds (stub)

If a paid order is refunded in the main order system, use the admin refund workflow stub to post matching **debit** ledger rows (`community_sale_refund`). There is no automated FamGateway refund API in phase 1.

## Audit

Sensitive actions write to `audit_logs` (approve, reject, payout marked paid, etc.). Retain exports for compliance as needed.

## Security reminders

- Never expose `ADMIN_ACCESS_SECRET` or `COMMUNITY_ACCESS_TOKEN_SECRET` in client bundles or logs.
- Proof files live under **private** storage paths—not `public/`.
- Do not publish submissions without a completed license check.
