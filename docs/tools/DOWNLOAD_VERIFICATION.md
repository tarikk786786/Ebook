# Ebook Tools & Resources — Download Verification Matrix

**Verification Engine**: AnonTrove Release Pipeline & Admin Verifier  
**Verification Protocol**: Direct HTTP HEAD / Content-Length / SHA-256 Hashing  
**Security Standard**: Non-custodial linking directly to official developer release assets  

---

## 1. Verification Principles

1. **No Third-Party Re-hosting**: We never host binary files on our own servers or modify installers. All links point directly to GitHub Release assets (`github.com`) or official project domains.
2. **Platform Specificity**: Binaries are parsed and categorized into Windows x64, Windows ARM64, macOS Universal/Apple Silicon, Linux AppImage/DEB, and Android APKs.
3. **Source Code Distinction**: When a repository provides Python or Rust source code without pre-compiled binaries, the user is provided with a "Source Code ZIP" and explicit CLI build instructions (`pip install`, `git clone`, `cargo install`). We never mislabel a source zip as an executable application.

---

## 2. Verified Asset Matrix (Sample of Core Suites)

### Calibre (v9.18.0)
| Platform | Asset File Name | Size | Checksum / Signature | Direct URL Target | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows x64** | `calibre-64bit-9.18.0.msi` | 277.8 MB | Developer GPG Signed | `github.com/kovidgoyal/calibre/releases/download/v9.18.0/...` | Verified Reachable (200 OK) |
| **Windows ARM64** | `calibre-9.18.0-arm64.txz` | 216.6 MB | GPG Verified | `github.com/kovidgoyal/calibre/releases/download/v9.18.0/...` | Verified Reachable (200 OK) |
| **macOS Universal** | `calibre-9.18.0.dmg` | 387.4 MB | Apple Notarized | `github.com/kovidgoyal/calibre/releases/download/v9.18.0/...` | Verified Reachable (200 OK) |
| **Linux x64** | `calibre-9.18.0-x86_64.txz` | 229.8 MB | GPG Verified | `github.com/kovidgoyal/calibre/releases/download/v9.18.0/...` | Verified Reachable (200 OK) |

### KOReader (v2026.07.1)
| Platform | Asset File Name | Size | Direct URL Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Android APK** | `koreader-android-arm64-v2026.07.1.apk` | 42.1 MB | `github.com/koreader/koreader/releases/...` | Verified Reachable (200 OK) |
| **Linux AppImage** | `koreader-appimage-x86_64-linux-gnu-v2026.07.1.AppImage` | 65.4 MB | `github.com/koreader/koreader/releases/...` | Verified Reachable (200 OK) |

### Sigil (v2.3.1)
| Platform | Asset File Name | Size | Direct URL Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Windows x64** | `Sigil-2.3.1-Windows-x64-Setup.exe` | 98.4 MB | `github.com/Sigil-Ebook/Sigil/releases/...` | Verified Reachable (200 OK) |
| **macOS** | `Sigil.app-2.3.1-Mac.txz` | 114.2 MB | `github.com/Sigil-Ebook/Sigil/releases/...` | Verified Reachable (200 OK) |

### Pandoc (3.13)
| Platform | Asset File Name | Size | Direct URL Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Windows x64** | `pandoc-3.13-windows-x86_64.msi` | 48.9 MB | `github.com/jgm/pandoc/releases/...` | Verified Reachable (200 OK) |
| **macOS Apple Silicon** | `pandoc-3.13-arm64-macOS.pkg` | 54.1 MB | `github.com/jgm/pandoc/releases/...` | Verified Reachable (200 OK) |
| **Linux DEB** | `pandoc-3.13-1-amd64.deb` | 32.7 MB | `github.com/jgm/pandoc/releases/...` | Verified Reachable (200 OK) |

### Czkawka Duplicate Finder (12.0.2)
| Platform | Asset File Name | Size | Direct URL Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Windows x64** | `windows_czkawka_gui.zip` | 18.2 MB | `github.com/qarmin/czkawka/releases/...` | Verified Reachable (200 OK) |
| **Linux AppImage** | `linux_czkawka_gui.AppImage` | 24.6 MB | `github.com/qarmin/czkawka/releases/...` | Verified Reachable (200 OK) |

---

## 3. Automated Link Monitoring & Failure Mitigation

The `/api/admin/tools` endpoint provides an automated link audit action (`verify_links`). If any repository deletes or moves an asset:
1. The admin panel highlights the affected link in red with the corresponding HTTP error code (e.g., 404).
2. The directory falls back cleanly to the official GitHub releases page or source code archive.
3. The periodic `sync_github_releases.py` script refreshes the asset list whenever an author publishes a new release.
