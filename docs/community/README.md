# AnonTrove Community Marketplace

The community layer lets readers **request** titles, contributors **submit** licensed ebooks, and admins **review, publish, and pay out** rewards—without changing the FamGateway storefront checkout.

| Doc | Audience |
|-----|----------|
| [Environment variables](./environment-variables.md) | Developers / DevOps |
| [Admin manual](./admin-manual.md) | Store operators |
| [Contributor guide](./contributor-guide.md) | Submitters & requesters |

## Architecture snapshot

- **Database:** `data/community_marketplace.sqlite` (isolated from the 86k enrichment DB).
- **Shopper checkout:** unchanged FamGateway UPI → webhook/poll → download tokens.
- **Rewards:** server ledger credits on paid orders for **published** community listings; payouts are **manual UPI** with an admin reference (no FamGateway payout API).

## Key routes

| Surface | Path |
|---------|------|
| Submit ebook | `/submit-ebook` |
| Request ebook | `/request-ebook` |
| Community board | `/community` |
| Contributor dashboards | `/contributor-dashboard/*` |
| Admin queues | `/admin/contributions`, `/admin/requests`, `/admin/earnings`, `/admin/payouts`, `/admin/community-settings` |

## Verification

```bash
node --experimental-strip-types --test tests/community_marketplace_suite.mjs
node --experimental-strip-types --test tests/master_system_verification.mjs
node --experimental-strip-types --test tests/security_regression_suite.mjs
```
