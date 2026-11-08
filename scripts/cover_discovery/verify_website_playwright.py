"""
Playwright Live Website Visual Inspector
Inspects live website https://ebook-sandy-chi.vercel.app/, book cards, image rendering, and modal details.
"""
import sys
import os
import json
from playwright.sync_api import sync_playwright

def inspect_live_website():
    target_url = "https://ebook-sandy-chi.vercel.app/"
    print(f"Launching Playwright to inspect {target_url}...")

    results = {
        "url": target_url,
        "page_title": "",
        "images_tested": 0,
        "images_loaded_cleanly": 0,
        "images_broken": 0,
        "broken_srcs": [],
        "sample_rendered_cards": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Track failed image loads
        failed_requests = []
        page.on("requestfailed", lambda req: failed_requests.append(req.url))

        print("Navigating to target...")
        page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(3000)
        results["page_title"] = page.title()
        print(f"Loaded page: {page.title()}")

        # Scroll to catalog shelf
        shelf = page.locator("#catalog-shelf")
        if shelf.count() > 0:
            shelf.scroll_into_view_if_needed()
            page.wait_for_timeout(2000)

        # Inspect all rendered book cover images
        images = page.locator("img")
        count = images.count()
        results["images_tested"] = count
        print(f"Found {count} images on page. Validating render states...")

        for i in range(min(count, 30)):
            img = images.nth(i)
            src = img.get_attribute("src") or ""
            alt = img.get_attribute("alt") or ""
            is_natural = page.evaluate("(el) => el.complete && el.naturalWidth > 0", img.element_handle())

            if is_natural:
                results["images_loaded_cleanly"] += 1
            else:
                results["images_broken"] += 1
                if src:
                    results["broken_srcs"].append(src)

            if i < 10 and src:
                results["sample_rendered_cards"].append({
                    "src": src[:80],
                    "alt": alt[:40],
                    "rendered_ok": is_natural
                })

        # Test Search Box
        search_input = page.locator("input[placeholder*='Search']")
        if search_input.count() > 0:
            print("Testing search input with query: 'Startup'...")
            search_input.fill("Startup")
            page.wait_for_timeout(1000)

        # Take screenshot of catalog shelf
        screenshot_path = "projects/anon-trove-ebooks/scripts/cover_discovery/live_shelf_screenshot.png"
        try:
            page.screenshot(path=screenshot_path, full_page=False, timeout=8000)
            results["screenshot_saved"] = screenshot_path
            print(f"Screenshot saved to {screenshot_path}")
        except Exception as e:
            print(f"Screenshot skipped due to font delay: {e}")
            results["screenshot_saved"] = None

        browser.close()

    print("\n=== Playwright Visual Inspection Results ===")
    print(f"Page Title: {results['page_title']}")
    print(f"Images Tested: {results['images_tested']}")
    print(f"Images Loaded Cleanly: {results['images_loaded_cleanly']}")
    print(f"Images Broken: {results['images_broken']}")
    if results["broken_srcs"]:
        print(f"Broken Image Sources: {results['broken_srcs'][:5]}")

    with open("projects/anon-trove-ebooks/scripts/cover_discovery/playwright_audit.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results

if __name__ == "__main__":
    inspect_live_website()
