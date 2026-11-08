# DEPLOYMENT STATUS: TB BOOKS & MULTI-DOMAIN CLOUD MESH

- **Brand & Platform Short Name**: TB (TroveBooks)
- **Primary Live Gateway (Zero 3rd-Party Branding)**: `https://tarikk786786.github.io` (HTTP 200 OK &bull; Free Global CDN &bull; SSL)
- **GitHub Repositories**:
  - Storefront & Engine: `https://github.com/tarikk786786/Ebook.git`
  - Global Pages Gateway: `https://github.com/tarikk786786/tarikk786786.github.io.git`
  - TB Books Gateway: `https://github.com/tarikk786786/tbbooks-gateway.git`
  - Tarik Gateway: `https://github.com/tarikk786786/tarik-gateway.git`
  - Ebook Gateway: `https://github.com/tarikk786786/ebook-gateway.git`
  - Reader Gateway: `https://github.com/tarikk786786/read-gateway.git`
  - Store Gateway: `https://github.com/tarikk786786/tbstore-gateway.git`
- **Health Status**: 100% Operational (HTTP 200 OK across network)

---

## 🌐 Complete Global Free Domain Network

### 1. Active Live Gateways (HTTP 200 OK &bull; Zero External Branding)
All 5 `devs.surf` domains are active, resolving to their dedicated Anycast CDN gateways with zero "vercel" branding in the URL:

| Domain | Gateway Repository | Target Anycast CDN | Status | Live Content |
|---|---|---|---|---|
| **`tbbooks.devs.surf`** | [`tarikk786786/tbbooks-gateway`](https://github.com/tarikk786786/tbbooks-gateway) | GitHub Anycast CDN | **HTTP 200 OK** | TB Books Official Gateway |
| **`ebook.devs.surf`** | [`tarikk786786/ebook-gateway`](https://github.com/tarikk786786/ebook-gateway) | GitHub Anycast CDN | **HTTP 200 OK** | TB Ebooks Store Gateway |
| **`read.devs.surf`** | [`tarikk786786/read-gateway`](https://github.com/tarikk786786/read-gateway) | GitHub Anycast CDN | **HTTP 200 OK** | TB Reader Portal Gateway |
| **`tbstore.devs.surf`** | [`tarikk786786/tbstore-gateway`](https://github.com/tarikk786786/tbstore-gateway) | GitHub Anycast CDN | **HTTP 200 OK** | TB Storefront Gateway |
| **`tarik.devs.surf`** | [`tarikk786786/tarik-gateway`](https://github.com/tarikk786786/tarik-gateway) | GitHub Anycast CDN | **HTTP 200 OK** | Tarik Personal & Author Hub |

> [!NOTE]
> **Why `cname.vercel-dns.com` returned 404 on `*.devs.surf`:**
> `devs.surf` is a private domain and is not registered in the Mozilla Public Suffix List (PSL). Vercel requires ownership verification of the apex root (`_vercel.devs.surf`), which can only be configured by the registry operator. When pointing `*.devs.surf` to Vercel DNS without apex verification, Vercel refuses routing and returns `404 DEPLOYMENT_NOT_FOUND`.
> Routing the CNAME through GitHub Pages eliminates this bottleneck, providing full edge caching, zero branding, and Let's Encrypt automated TLS certificates.

---

### 2. Edge-Verified PSL Domains on Vercel
Suffixes that are registered in Mozilla PSL are accepted by Vercel edge without apex verification:
- `tarik.thedev.id` &mdash; Verified on Vercel Edge (`thedev-id/thedev.id` [PR #1390](https://github.com/thedev-id/thedev.id/pull/1390)).
- `tb.us.kg`, `book.us.kg`, `tbbooks.us.kg`, `tarik.us.kg`, `ebook.us.kg` &mdash; Pre-Verified on Vercel Edge.

---

### 3. Open Developer Registry Pull Requests (Passing CI & Queued)
| Domain | Registry | PR Link | Status |
|---|---|---|---|
| `tb.is-a.bot` | `free-domains/is-a.bot` | [PR #784](https://github.com/free-domains/is-a.bot/pull/784) | Passing CI (Domain) |
| `book.is-a.bot` | `free-domains/is-a.bot` | [PR #782](https://github.com/free-domains/is-a.bot/pull/782) | Passing CI (Domain) |
| `tarik.is-a.bot` | `free-domains/is-a.bot` | [PR #781](https://github.com/free-domains/is-a.bot/pull/781) | Passing CI (Domain) |
| `ebook.is-a.bot` | `free-domains/is-a.bot` | [PR #785](https://github.com/free-domains/is-a.bot/pull/785) | Passing CI (Domain) |
| `tarik.thedev.id` | `thedev-id/thedev.id` | [PR #1390](https://github.com/thedev-id/thedev.id/pull/1390) | Queued (Edge Verified) |
| `tb.is-cod.in` | `is-cod-in/register` | [PR #34](https://github.com/is-cod-in/register/pull/34) | Queued |
| `book.is-cod.in` | `is-cod-in/register` | [PR #35](https://github.com/is-cod-in/register/pull/35) | Queued |
| `tarik.is-cod.in` | `is-cod-in/register` | [PR #36](https://github.com/is-cod-in/register/pull/36) | Queued |
| `tb.is-not.cool` | `is-not-cool/registration` | [PR #286](https://github.com/is-not-cool/registration/pull/286) | Queued |
| `book.is-not.cool` | `is-not-cool/registration` | [PR #287](https://github.com/is-not-cool/registration/pull/287) | Queued |
| `tarik.is-not.cool` | `is-not-cool/registration` | [PR #288](https://github.com/is-not-cool/registration/pull/288) | Queued |
| `tb.creepers.sbs` | `creepersbs/register` | [PR #167](https://github.com/creepersbs/register/pull/167) | Queued |
| `tarik.creepers.sbs` | `creepersbs/register` | [PR #168](https://github.com/creepersbs/register/pull/168) | Queued |
| **`tb.is-a-good.dev`** | `is-a-good-dev/register` | [PR #1380](https://github.com/is-a-good-dev/register/pull/1380) | **New (Queued)** |
| **`tb.is-amaz.ing`** | `is-amazing/register` | [PR #309](https://github.com/is-amazing/register/pull/309) | **New (Queued)** |
| **`tb.foo.ng`** | `Pokymon/foo.ng` | [PR #378](https://github.com/Pokymon/foo.ng/pull/378) | **New (Queued)** |
| **`tb.cool.fluxcast.dev`** | `IlyaP358/fluxcast-domains` | [PR #141](https://github.com/IlyaP358/fluxcast-domains/pull/141) | **New (Queued)** |

---

## 🔒 Security & Credential Hygiene
- All API keys, tokens (including `DEVS_SURF_API_KEY`), and DNS configurations are centralized and synchronized in `appinfo11.txt`.
- No sensitive keys or tokens committed to public Git repos.
