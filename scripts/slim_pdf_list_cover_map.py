import json
from pathlib import Path

src = Path("data/catalog/cover_map_from_pdf_list.json")
data = json.loads(src.read_text(encoding="utf-8"))
m = data.get("map") or {}
slim = {}
for k, v in m.items():
    if not v or not v.get("coverVerified"):
        continue
    img = v.get("coverImage")
    if not img or not str(img).startswith("/covers/"):
        continue
    entry = {
        "coverImage": img,
        "coverVerified": True,
        "catalogNum": v.get("catalogNum"),
        "title": v.get("title"),
        "author": v.get("author"),
        "category": v.get("category"),
    }
    if k.startswith("ref:") or (not str(k).isdigit()):
        slim[k] = entry
    else:
        slim.setdefault(f"ref:{k}", entry)

out = {"map": slim, "count": len(slim)}
src.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
print("keys", len(slim), "mb", round(src.stat().st_size / 1e6, 2))
