"""
Free, authorized cover providers (stdlib only).

Sources:
  - Open Library Search + Covers
  - Internet Archive advancedsearch + services/img
  - Wikimedia Commons file search
  - Library of Congress books JSON API (og:image / image_url when present)
  - Google Books (only when API key provided)

No retailer HTML scraping. Fail soft on timeouts / 429.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from typing import Optional

UA = "AnonTroveFreeCovers/2.0 (mailto:apnix7@gmail.com; educational catalog)"
GENERIC_AUTHORS = {
    "editorial board",
    "anontrove guild",
    "unknown",
    "editorial board & domain experts",
    "anontrove engineering guild",
    "n/a",
    "na",
}


def _http_bytes(url: str, timeout: float = 12) -> Optional[bytes]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
        if not data or len(data) < 1500:
            return None
        if data[:3].upper() == b"GIF" and len(data) < 8000:
            return None
        return data
    except Exception:
        return None


def _http_json(url: str, timeout: float = 12) -> Optional[dict]:
    raw = _http_bytes(url, timeout=timeout)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        return None


def clean_title(title: str) -> str:
    t = title or ""
    t = re.sub(r"\s*[—–-]\s*Volume\s+\d+.*$", "", t, flags=re.I)
    t = re.sub(r"\s+Volume\s+\d+.*$", "", t, flags=re.I)
    t = re.sub(r"\s*\(Vol\.?\s*\d+.*?\)\s*$", "", t, flags=re.I)
    t = re.sub(r"^[\W\d_\s]+", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def usable_author(author: str) -> str:
    a = (author or "").split(",")[0].strip()
    if not a or a.lower() in GENERIC_AUTHORS:
        return ""
    if "anontrove" in a.lower():
        return ""
    return a


def find_open_library(title: str, author: str = "", isbn13: str = "") -> Optional[tuple[str, str]]:
    """Return cover URL candidates without downloading (caller downloads once)."""
    if isbn13:
        return f"https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false", "HIGH"
    core = clean_title(title).split(":")[0].strip()
    if len(core) < 4:
        return None
    attempts = []
    auth = usable_author(author)
    if auth:
        attempts.append({"title": core, "author": auth, "limit": 5})
    attempts.append({"title": core, "limit": 5})
    for params in attempts:
        data = _http_json(
            "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params),
            timeout=8,
        )
        for doc in (data or {}).get("docs") or []:
            cover_i = doc.get("cover_i")
            if cover_i and int(cover_i) > 0:
                return (
                    f"https://covers.openlibrary.org/b/id/{int(cover_i)}-L.jpg?default=false",
                    "MEDIUM",
                )
            ek = doc.get("cover_edition_key")
            if isinstance(ek, list):
                ek = ek[0] if ek else None
            if ek:
                return f"https://covers.openlibrary.org/b/olid/{ek}-L.jpg?default=false", "MEDIUM"
    return None


def find_internet_archive(title: str, author: str = "") -> Optional[tuple[str, str]]:
    core = clean_title(title).split(":")[0].strip()
    if len(core) < 4:
        return None
    auth = usable_author(author)
    queries = []
    if auth:
        queries.append(f'title:("{core}") AND creator:({auth})')
    queries.append(f'title:("{core}") AND mediatype:(texts)')
    queries.append(f'title:({core}) AND mediatype:(texts)')
    for q in queries:
        data = _http_json(
            "https://archive.org/advancedsearch.php?"
            + urllib.parse.urlencode(
                {
                    "q": q,
                    "fl[]": "identifier",
                    "rows": 3,
                    "page": 1,
                    "output": "json",
                }
            ),
            timeout=8,
        )
        docs = (((data or {}).get("response") or {}).get("docs")) or []
        for d in docs:
            ident = d.get("identifier")
            if ident:
                return f"https://archive.org/services/img/{ident}", "MEDIUM"
    return None


def find_wikimedia(title: str, author: str = "") -> Optional[tuple[str, str]]:
    core = clean_title(title).split(":")[0].strip()
    if len(core) < 4:
        return None
    auth = usable_author(author)
    terms = [f'"{core}" book cover', f'"{core}" cover']
    if auth:
        terms.insert(0, f'"{core}" {auth} cover')
    for term in terms[:2]:
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": term,
            "gsrnamespace": "6",
            "gsrlimit": "3",
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "format": "json",
        }
        data = _http_json(
            "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params),
            timeout=8,
        )
        pages = ((data or {}).get("query") or {}).get("pages") or {}
        for page in pages.values():
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            mime = (info.get("mime") or "").lower()
            if mime and not mime.startswith("image/"):
                continue
            url = info.get("url")
            size = int(info.get("size") or 0)
            if url and size >= 5000:
                return url, "MEDIUM"
    return None


def find_library_of_congress(title: str, author: str = "") -> Optional[tuple[str, str]]:
    core = clean_title(title).split(":")[0].strip()
    if len(core) < 4:
        return None
    q = core
    auth = usable_author(author)
    if auth:
        q = f"{core} {auth}"
    url = "https://www.loc.gov/books/?" + urllib.parse.urlencode(
        {"q": q, "fo": "json", "c": 4}
    )
    data = _http_json(url, timeout=8)
    results = (data or {}).get("results") or []
    for item in results:
        for key in ("image_url", "image", "thumbnail"):
            val = item.get(key)
            if isinstance(val, list):
                val = val[0] if val else None
            if isinstance(val, str) and val.startswith("http"):
                return val, "MEDIUM"
        for res in item.get("resources") or []:
            img = res.get("image") or res.get("url")
            if isinstance(img, str) and img.startswith("http"):
                return img, "LOW"
    return None


def find_google_books(
    title: str, author: str = "", isbn13: str = "", api_key: str = ""
) -> Optional[tuple[str, str]]:
    if not api_key:
        return None
    core = clean_title(title).split(":")[0].strip()
    queries = []
    if isbn13:
        queries.append(f"isbn:{isbn13}")
    auth = usable_author(author)
    if core:
        q = f'intitle:"{core}"'
        if auth:
            q += f' inauthor:"{auth}"'
        queries.append(q)
        queries.append(f'intitle:"{core}"')
    for query in queries:
        params = {
            "q": query,
            "maxResults": 3,
            "printType": "books",
            "key": api_key,
        }
        data = _http_json(
            "https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(params)
        )
        for item in (data or {}).get("items") or []:
            links = ((item.get("volumeInfo") or {}).get("imageLinks")) or {}
            for k in ("extraLarge", "large", "medium", "thumbnail", "smallThumbnail"):
                u = links.get(k)
                if u:
                    return (
                        str(u)
                        .replace("http://", "https://")
                        .replace("zoom=1", "zoom=2")
                        .replace("&edge=curl", ""),
                        "HIGH" if isbn13 else "MEDIUM",
                    )
    return None


def discover_free_cover(
    title: str,
    author: str = "",
    isbn13: str = "",
    google_api_key: str = "",
) -> Optional[tuple[str, str, str]]:
    """
    Returns (image_url, source, confidence) or None.
    Order: Google(key) → Open Library → Internet Archive → Wikimedia → LoC.
    """
    hit = discover_free_cover_bytes(title, author, isbn13, google_api_key)
    if not hit:
        return None
    _data, source, conf, url = hit
    return url, source, conf


def discover_free_cover_bytes(
    title: str,
    author: str = "",
    isbn13: str = "",
    google_api_key: str = "",
) -> Optional[tuple[bytes, str, str, str]]:
    """
    Returns (image_bytes, source, confidence, url) or None.
    Avoids a second HTTP download in the batch worker.
    """
    # Fast path: Google with key
    if google_api_key:
        hit = find_google_books(title, author, isbn13, google_api_key)
        if hit:
            url, conf = hit
            data = _http_bytes(url)
            if data:
                return data, "google-books", conf, url

    # Open Library (best free recall)
    hit = find_open_library(title, author, isbn13)
    if hit:
        url, conf = hit
        data = _http_bytes(url)
        if data:
            return data, "open-library", conf, url

    # Internet Archive
    hit = find_internet_archive(title, author)
    if hit:
        url, conf = hit
        data = _http_bytes(url)
        if data:
            return data, "internet-archive", conf, url

    # Wikimedia then LoC — only after primary misses
    hit = find_wikimedia(title, author)
    if hit:
        url, conf = hit
        data = _http_bytes(url)
        if data:
            return data, "wikimedia-commons", conf, url

    hit = find_library_of_congress(title, author)
    if hit:
        url, conf = hit
        data = _http_bytes(url)
        if data:
            return data, "library-of-congress", conf, url

    return None
