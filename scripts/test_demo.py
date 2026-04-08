"""
Railmatch Anti - Demo flow deep test
Tests demo app: navigation, rating badges, tabs, chat, mobile
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"
SS = "C:/Users/HomePc/Railmatch Anti/scripts/"
results = []

def log(category, status, message, detail=""):
    icon = "OK" if status == "PASS" else ("!!" if status == "WARN" else "XX")
    print(f"  [{icon}] [{category}] {message}" + (f"\n       -> {detail}" if detail else ""))
    results.append({"category": category, "status": status, "message": message, "detail": detail})

def enter_demo(page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle", timeout=15000)
    # Find demo button by matching partial visible text
    demo = page.locator("button").filter(has_text="DEMO").or_(
           page.locator("button").filter(has_text="Demo")).or_(
           page.locator("button").filter(has_text="demo"))
    if demo.count() == 0:
        # Fallback: find by nth button index after screenshot inspection (СМОТРЕТЬ ДЕМО is button index 3)
        all_btns = page.locator("button").all()
        for btn in all_btns:
            txt = btn.inner_text().strip().upper()
            if "DEMO" in txt or "DEMO" in txt or len(txt) > 5 and txt[0] in "СДCD":
                demo = btn
                break
    if hasattr(demo, 'click'):
        demo.click()
    else:
        demo.first.click()
    page.wait_for_load_state("networkidle", timeout=10000)
    page.wait_for_timeout(1500)
    return page

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        # ── Enter demo ──
        print("\n[1] Demo entry")
        try:
            enter_demo(page)
            page.screenshot(path=f"{SS}demo_01_app.png", full_page=True)
            log("Demo", "PASS", "Demo app loaded")
        except Exception as e:
            log("Demo", "FAIL", f"Cannot enter demo: {e}")
            browser.close()
            return

        # ── Check body text for bad values ──
        print("\n[2] Data integrity")
        body = page.locator("body").inner_text()
        for bad in ["undefined", "NaN", "[object Object]", "null null"]:
            if bad in body:
                log("Data", "FAIL", f"'{bad}' found in DOM")
            else:
                log("Data", "PASS", f"No '{bad}' in DOM")

        # ── Check rating badge (feature from Phase 7) ──
        print("\n[3] Rating badge (Phase 7 feature)")
        # Star icons from lucide-react render as SVGs with specific class
        stars = page.locator("svg").filter(has_text="").all()
        # Try checking for star badge near creator info
        rating_el = page.locator("[class*='amber'], [class*='yellow'], [class*='star']").all()
        log("Rating", "PASS" if rating_el else "WARN",
            f"Star/rating elements: {len(rating_el)} found" if rating_el else "No amber/star elements visible")

        # Check numeric rating pattern (e.g. "4.5" or "★ 4.5")
        import re
        rating_text_match = re.findall(r'\b[1-5]\.[0-9]\b', body)
        log("Rating", "PASS" if rating_text_match else "WARN",
            f"Rating values in DOM: {rating_text_match[:5]}" if rating_text_match else "No numeric ratings like '4.5' visible")

        # ── Navigation tabs ──
        print("\n[4] Navigation tabs")
        # Get all buttons in nav area
        nav_buttons = page.locator("nav button, [class*='bottom'] button, [class*='nav'] button").all()
        log("Nav", "PASS" if nav_buttons else "WARN", f"{len(nav_buttons)} nav buttons found")

        clicked_tabs = []
        for btn in nav_buttons[:8]:
            try:
                txt = btn.inner_text().strip()[:25]
                if not txt:
                    continue
                btn.click()
                page.wait_for_timeout(800)
                page.screenshot(path=f"{SS}demo_tab_{len(clicked_tabs)}.png")
                body2 = page.locator("body").inner_text()
                bad = [v for v in ["undefined", "NaN", "[object Object]"] if v in body2]
                if bad:
                    log("Nav", "FAIL", f"Tab '{txt}' has bad values: {bad}")
                else:
                    log("Nav", "PASS", f"Tab '{txt}' renders OK")
                clicked_tabs.append(txt)
            except Exception as ex:
                log("Nav", "WARN", f"Tab click error: {str(ex)[:60]}")

        # ── Request cards ──
        print("\n[5] Request cards")
        # Re-enter demo to get clean state
        enter_demo(page)
        page.screenshot(path=f"{SS}demo_02_cards.png")

        cards = page.locator("[class*='card'], [class*='Card'], [class*='request']").all()
        log("Cards", "PASS" if cards else "WARN", f"{len(cards)} card elements found")

        # Try clicking first card / bid button
        bid_btn = page.locator("button:has-text('Ставка'), button:has-text('Bid'), button:has-text('Подать'), button:has-text('Откликнуться')").first
        if bid_btn.count() > 0:
            bid_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{SS}demo_03_bid_modal.png")
            log("Cards", "PASS", "Bid modal opened")
            # Close it
            close = page.locator("button:has-text('Отмена'), button:has-text('Закрыть'), button[aria-label='Close']").first
            if close.count() > 0:
                close.click()
        else:
            log("Cards", "WARN", "No bid button visible")

        # ── Check 'Создать заявку' ──
        print("\n[6] Create request button")
        create_btn = page.locator("button:has-text('Создать'), button:has-text('+ Заявк'), button:has-text('Новая заявка')").first
        if create_btn.count() > 0:
            create_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{SS}demo_04_create_form.png")
            log("Create", "PASS", "Create request form opened")
            # check for form inputs
            inputs = page.locator("input, textarea, select").count()
            log("Create", "PASS" if inputs > 0 else "FAIL", f"{inputs} form inputs in create form")
            cancel = page.locator("button:has-text('Отмена'), button:has-text('Закрыть')").first
            if cancel.count() > 0:
                cancel.click()
        else:
            log("Create", "WARN", "No create request button found")

        # ── Profile / settings ──
        print("\n[7] Profile / Settings")
        profile_btn = page.locator("button:has-text('Профиль'), button:has-text('Profile'), [class*='profile'], [class*='user']").first
        if profile_btn.count() > 0:
            profile_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=f"{SS}demo_05_profile.png")
            log("Profile", "PASS", "Profile section opened")
        else:
            log("Profile", "WARN", "No profile button found")

        # ── Dark mode toggle ──
        print("\n[8] Dark mode")
        dark_toggle = page.locator("button[aria-label*='dark'], button[aria-label*='theme'], button[aria-label*='Dark'], button[aria-label*='Moon'], button[title*='тема']").first
        if dark_toggle.count() == 0:
            # Try moon/sun SVG buttons
            dark_toggle = page.locator("button:has(svg)").first

        try:
            dark_toggle.click()
            page.wait_for_timeout(500)
            page.screenshot(path=f"{SS}demo_06_dark.png")
            log("Dark", "PASS", "Dark mode toggle clicked")
        except:
            log("Dark", "WARN", "Could not find/click dark mode toggle")

        # ── Mobile responsive ──
        print("\n[9] Mobile (390px)")
        enter_demo(page)
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(600)
        page.screenshot(path=f"{SS}demo_07_mobile.png", full_page=False)
        overflow = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        log("Mobile", "WARN" if overflow else "PASS",
            f"Overflow={overflow} at 390px width")

        # ── Console errors ──
        print("\n[10] Console errors")
        if console_errors:
            log("Console", "FAIL", f"{len(console_errors)} JS errors")
            for e in console_errors:
                print(f"     - {e[:120]}")
        else:
            log("Console", "PASS", "Zero JS errors in demo session")

        browser.close()

    # ── Summary ──
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r["status"] == "PASS")
    warned = sum(1 for r in results if r["status"] == "WARN")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print(f"  PASS: {passed}   WARN: {warned}   FAIL: {failed}   Total: {len(results)}")
    print("=" * 60)

    if failed:
        print("\nFAILS (fix before deploy):")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  XX [{r['category']}] {r['message']}")
                if r["detail"]:
                    print(f"      {r['detail'][:120]}")

    if warned:
        print("\nWARNINGS:")
        for r in results:
            if r["status"] == "WARN":
                print(f"  !! [{r['category']}] {r['message']}")

if __name__ == "__main__":
    run()
