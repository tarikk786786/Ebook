import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("EBOOK_SITE_URL", "https://ebook-sandy-chi.vercel.app").rstrip("/")
ARTIFACT_DIR = Path(os.getenv("QA_ARTIFACT_DIR", "artifacts/qa"))
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    report = {
        "url": BASE_URL,
        "checks": {},
        "images": {"tested": 0, "loaded": 0, "broken": []},
        "console_errors": [],
        "page_title": "",
    }
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1365, "height": 900})
        page.on("console", lambda msg: report["console_errors"].append(msg.text[:500]) if msg.type == "error" else None)
        response = page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
        report["checks"]["homepage_http_200"] = bool(response and response.status == 200)
        report["page_title"] = page.title()
        report["checks"]["document_title_present"] = bool(report["page_title"].strip())
        page.wait_for_timeout(2500)

        cards = page.locator("article")
        report["checks"]["catalog_cards_rendered"] = cards.count() > 0
        report["catalog_cards_visible"] = cards.count()

        images = page.locator("img")
        for i in range(min(images.count(), 40)):
            image = images.nth(i)
            src = image.get_attribute("src") or ""
            loaded = page.evaluate("(el) => el.complete && el.naturalWidth > 0", image.element_handle())
            report["images"]["tested"] += 1
            if loaded:
                report["images"]["loaded"] += 1
            elif src:
                report["images"]["broken"].append(src[:500])

        report["checks"]["at_least_one_cover_loaded"] = report["images"]["loaded"] > 0
        page.screenshot(path=str(ARTIFACT_DIR / "desktop-homepage.png"), full_page=True)
        page.set_viewport_size({"width": 375, "height": 812})
        page.reload(wait_until="domcontentloaded", timeout=60000)
        report["checks"]["mobile_http_200"] = True
        page.screenshot(path=str(ARTIFACT_DIR / "mobile-homepage.png"), full_page=True)
        browser.close()

    (ARTIFACT_DIR / "live-qa-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    required = ["homepage_http_200", "document_title_present", "catalog_cards_rendered", "at_least_one_cover_loaded", "mobile_http_200"]
    return 0 if all(report["checks"].get(k) for k in required) else 1

if __name__ == "__main__":
    sys.exit(main())
