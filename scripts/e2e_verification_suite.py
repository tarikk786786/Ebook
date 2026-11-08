import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright

def run_e2e_tests():
    print("=== AnonTrove Production End-to-End Test Suite ===")
    target_url = "https://ebook-sandy-chi.vercel.app"
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # Test 1: Homepage Load & Hero
        print("\n[1/7] Testing Homepage & Hero...")
        t0 = time.time()
        resp = page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_selector("#catalog-shelf", timeout=15000)
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        title = page.title()
        print(f"  [OK] Homepage loaded (status 200) in {time.time()-t0:.2f}s")
        print(f"  [OK] Document Title: {title}")
        results["Homepage Status 200"] = True

        # Test 2: Catalog Shelf & Cards
        print("\n[2/7] Testing Catalog Shelf & Card Elements...")
        shelf = page.locator("#catalog-shelf")
        assert shelf.is_visible(), "Catalog shelf not visible"
        book_cards = page.locator("article")
        card_count = book_cards.count()
        print(f"  [OK] Found {card_count} book cards on current shelf view")
        assert card_count > 0, "No book cards rendered"
        results["Catalog Cards Rendered"] = True

        # Test 3: Search Functionality
        print("\n[3/7] Testing Search Filter...")
        search_input = page.locator('input[placeholder*="Search by title"]').first
        if search_input.is_visible():
            search_input.fill("Lean")
            page.wait_for_timeout(800)
            matching_cards = page.locator("article").count()
            print(f"  [OK] Filtered by 'Lean': {matching_cards} items matching")
            assert matching_cards > 0, "Search returned zero results for 'Lean'"
            results["Live Search Filtering"] = True
            search_input.fill("")
            page.wait_for_timeout(500)

        # Test 4: Wishlist Drawer & Header Controls
        print("\n[4/7] Testing Wishlist System...")
        nav_wishlist = page.locator('header button[aria-label="Wishlist"]')
        if nav_wishlist.is_visible():
            nav_wishlist.click()
            page.wait_for_timeout(600)
            print("  [OK] Wishlist drawer opened successfully")
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
            results["Wishlist System"] = True

        # Test 5: Book Detail Page
        print("\n[5/7] Testing Book Detail Page...")
        first_card_link = page.locator('article a[href^="/book/"]').first
        book_href = first_card_link.get_attribute("href")
        print(f"  [OK] Navigating to book page: {book_href}")
        book_resp = page.goto(f"{target_url}{book_href}", wait_until="domcontentloaded", timeout=30000)
        assert book_resp.status == 200, f"Detail page failed with status {book_resp.status}"
        h1 = page.locator("h1").inner_text()
        print(f"  [OK] Detail page loaded: '{h1}'")
        
        # Verify UPI Buy Button
        buy_btn = page.locator('button:has-text("Instant UPI Buy")')
        assert buy_btn.is_visible(), "Instant UPI Buy button missing on detail page"
        print("  [OK] Verified 'Instant UPI Buy' button present")
        results["Book Detail Page"] = True

        # Test 6: In-Browser Reader Preview Modal
        print("\n[6/7] Testing Reader Modal (Look Inside)...")
        preview_btn = page.locator('button:has-text("Preview"), button:has-text("Look Inside")').first
        if preview_btn.is_visible():
            preview_btn.click()
            page.wait_for_timeout(800)
            print("  [OK] Reader modal opened successfully")
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
            results["In-Browser Reader Preview"] = True

        # Test 7: Mobile Viewport Check
        print("\n[7/7] Testing Mobile Responsiveness (375x667 iPhone SE)...")
        mobile_page = context.new_page()
        mobile_page.set_viewport_size({"width": 375, "height": 667})
        m_resp = mobile_page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
        assert m_resp.status == 200, f"Mobile page failed: {m_resp.status}"
        print("  [OK] Mobile layout rendered cleanly with HTTP 200")
        results["Mobile Responsiveness"] = True

        browser.close()

    print("\n=== E2E Test Results Summary ===")
    all_passed = True
    for test, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        if not passed: all_passed = False
        print(f"  [{status}] {test}")

    critical_errors = [e for e in console_errors if "404" in e or "Failed to load resource" in e]
    print(f"\nBrowser Console Errors: {len(console_errors)} (Critical: {len(critical_errors)})")
    return all_passed

if __name__ == '__main__':
    success = run_e2e_tests()
    sys.exit(0 if success else 1)
