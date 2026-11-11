# Contributor & requester guide

## For readers (requests)

1. Visit **Request an ebook** (`/request-ebook`).
2. Enter title, optional author/ISBN, and your email.
3. Browse the **Community** board (`/community`) to upvote existing requests (one vote per request per browser key).
4. When AnonTrove adds a title, buy it through the normal storefront checkout—same FamGateway UPI flow as any other book.

You do not need a password. For request status, use the email magic link when prompted.

## For contributors (submissions)

### 1. Sign in with magic link

1. Open **Submit an ebook** (`/submit-ebook`).
2. Enter your email; you receive a one-time link (requires `COMMUNITY_ACCESS_TOKEN_SECRET` on the server).
3. Click the link—your session is stored in an **httpOnly** cookie.

### 2. Prepare your submission

- **Metadata:** title, author, ISBN if known, category, short description.
- **Pricing:** verified **retail price** (e.g. Kindle/list price) and **suggested list price** on AnonTrove. List price must be **≤ 10% of retail** and greater than zero (validated server-side).
- **License:** declare license type and a **source URL** proving you may redistribute commercially if applicable.
- **Proof:** upload evidence admins use during license review (stored privately).

Save as **draft** anytime; **submit** when complete.

### 3. After you submit

Statuses progress through admin review (`under_review`, `license_pending`, etc.). You’ll see updates on the contributor dashboard—not instant publication.

### 4. When published

- Your book receives a catalog reference; shoppers can buy it like any AnonTrove title.
- On each **paid** order containing your listing, you earn a **credit** per platform reward settings (default: 60% of list price to contributor, 40% platform share).
- Credits appear under **Earnings** on `/contributor-dashboard`.

### 5. Withdraw earnings

1. Add a valid **UPI ID** on your profile.
2. Open the payouts tab; request withdrawal (full balance or a custom amount).
3. Minimum withdrawal is set in admin settings (default **₹100**).
4. Admin sends UPI manually and marks the request paid with a reference—you’ll see status `paid` and a matching ledger debit.

There is no automatic instant payout; allow time for admin review.

## Pricing rule (why it exists)

AnonTrove prices community titles far below retail to stay student-friendly while respecting rights. The server rejects submissions where suggested price exceeds 10% of the retail price you declare.

## Support

Questions: contact the address in `NEXT_PUBLIC_SUPPORT_EMAIL` (see site footer).

## Privacy

- Magic links expire; do not share session links.
- Purchase and payout records are tied to your email and contributor id for ledger integrity.
