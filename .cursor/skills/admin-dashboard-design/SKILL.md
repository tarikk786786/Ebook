---
name: admin-dashboard-design
description: Build premium Ebook Intelligence admin UI extending existing cover-recovery admin. Use when creating dashboards, cover review, or duplicate comparison screens.
---

# Admin dashboard design

## Routes

- Extend `/admin/cover-recovery`
- Target hub: `/admin/ebook-intelligence`
- Covers: `/admin/ebook-intelligence/covers`
- Duplicates: `/admin/ebook-intelligence/duplicates`
- Settings: `/admin/ebook-intelligence/settings`

## UX

- Real DB metrics only
- Server-side pagination for tables
- Side-by-side cover compare with approve/reject
- Confirm dialogs for merges; toast for soft actions
- WCAG 2.2 AA; keyboard navigation
- Auth via existing admin secret header/middleware

## Visual

Modern Research Library + Enterprise Operations — reuse Tailwind admin tokens; avoid purple-glow generic AI themes.
