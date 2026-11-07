# BLOCKED TASKS & DEPENDENCY REGISTRY

| Task ID | Task Description | Blocker Detail | Workaround In Place | Action Required |
|---|---|---|---|---|
| BLK-001 | Razorpay Production Transactions | Live Key ID & Secret pending user generation | Razorpay Mock/Sandbox mode operational | User to provide live keys in `appinfo11.txt` when ready for real transactions |
| BLK-002 | Cashfree Production Transactions | Live App ID & Secret pending production activation | Cashfree Sandbox operational | User to provide live keys in `appinfo11.txt` |
| BLK-003 | Supabase Cloud PostgreSQL Sync | Live Supabase URL & Service Role Key required for cloud DB sync | Local client-side storage & in-memory session persistence operational | User to provide Supabase project credentials |
| BLK-004 | Listmonk & n8n Live Webhooks | External hosted instance endpoints pending configuration | Safe mock dispatches logging to console | User to provide live webhook URLs |
