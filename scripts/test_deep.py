"""
Railmatch Anti - Deep pre-deploy gap testing
Covers: landing → auth → demo app flow + UI state checks
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"
SCREENSHOTS = "C:/Users/HomePc/Railmatch Anti/scripts/"
results = []

def log(category, status, message, detail=""):
    icon = "OK" if status == "PASS" else ("!!" if status == "WARN" else "XX")
    print(f"  [{icon}] [{category}] {message}" + (f"\n       -> {detail}" if detail else ""))
    results.append({"category": category, "status": status, "message": message, "detail": detail})

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()

        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        # ── LANDING ──
        print("\n[1] Landing page")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=15000)
        page.screenshot(path=f"{SCREENSHOTS}10_landing.png", full_page=True)
        log("Landing", "PASS", "Loaded OK")

        # Check key landing CTAs
        btns = page.locator("button").all_inner_texts()
        btn_text = " | ".join(btns[:15])
        log("Landing", "PASS" if btns else "WARN", f"Buttons: {btn_text[:120]}")

        login_btn = page.locator("button:has-text('Войти'), button:has-text('Вход'), button:has-text('Логин')").first
        if login_btn.count() > 0:
            log("Landing", "PASS", "Login button present")
        else:
            log("Landing", "WARN", "No login button visible on landing")

        # ── AUTH SCREEN ──
        print("\n[2] Auth screen")
        # Click login button
        login_btn2 = page.locator("button:has-text('Войти'), button:has-text('Вход'), a:has-text('Войти')").first
        if login_btn2.count() > 0:
            login_btn2.click()
            page.wait_for_load_state("networkidle", timeout=8000)
            page.wait_for_timeout(500)
            page.screenshot(path=f"{SCREENSHOTS}11_auth.png")

            # Check auth form
            email_input = page.locator("input[type='email'], input[placeholder*='почт'], input[placeholder*='Email'], input[placeholder*='email']").first
            if email_input.count() > 0:
                log("Auth", "PASS", "Email field visible")
            else:
                log("Auth", "FAIL", "Email field NOT found on auth screen")

            password_input = page.locator("input[type='password']").first
            if password_input.count() > 0:
                log("Auth", "PASS", "Password field visible")
            else:
                log("Auth", "FAIL", "Password field NOT found on auth screen")

            # Test empty submit
            submit = page.locator("button[type='submit'], button:has-text('Войти'), button:has-text('Вход')").last
            if submit.count() > 0:
                submit.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=f"{SCREENSHOTS}12_auth_empty_submit.png")
                # Check for validation error
                error_visible = page.locator("[class*='red'], [class*='error'], [class*='danger']").count() > 0
                log("Auth", "PASS" if error_visible else "WARN",
                    "Empty form validation" + (" shows error" if error_visible else " — no visible error"))

            # Test wrong credentials
            if email_input.count() > 0:
                email_input.fill("test_invalid@test.com")
                if password_input.count() > 0:
                    password_input.fill("wrongpassword123")
                    submit.click()
                    page.wait_for_timeout(3000)
                    page.screenshot(path=f"{SCREENSHOTS}13_auth_wrong_creds.png")
                    error_msg = page.locator("[class*='red'], [class*='error']").first
                    if error_msg.count() > 0:
                        log("Auth", "PASS", f"Auth error shown: {error_msg.inner_text()[:60]}")
                    else:
                        log("Auth", "WARN", "No error shown for invalid credentials")

            # Back button
            back_btn = page.locator("button:has-text('Назад'), button:has-text('Back'), [aria-label*='back']").first
            if back_btn.count() > 0:
                log("Auth", "PASS", "Back button present")
            else:
                log("Auth", "WARN", "No back button on auth screen")

        else:
            log("Auth", "FAIL", "Could not navigate to auth screen")

        # ── DEMO MODE ──
        print("\n[3] Demo mode")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=10000)

        demo_btn = page.locator("button:has-text('Demo'), button:has-text('Демо'), button:has-text('demo'), a:has-text('демо'), a:has-text('Demo')").first
        if demo_btn.count() > 0:
            demo_btn.click()
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{SCREENSHOTS}20_demo_app.png", full_page=True)
            log("Demo", "PASS", "Demo mode entered")

            # Check main app elements
            nav_items = page.locator("nav, [class*='sidebar'], [class*='menu']").count()
            log("Demo", "PASS" if nav_items > 0 else "WARN",
                f"Navigation: {nav_items} nav elements found")

            request_cards = page.locator("[class*='card'], [class*='request'], [class*='Request']").count()
            log("Demo", "PASS" if request_cards > 0 else "WARN",
                f"Content cards: {request_cards} found")

            # Check for undefined/NaN
            body_text = page.locator("body").inner_text()
            bad_vals = [v for v in ["undefined", "NaN", "[object Object]"] if v in body_text]
            if bad_vals:
                log("Demo", "FAIL", f"Bad values in DOM: {bad_vals}")
            else:
                log("Demo", "PASS", "No undefined/NaN in demo app")

            # Check star rating (recently added feature)
            star_rating = page.locator("[class*='star'], [class*='rating'], svg[class*='star']").count()
            log("Demo", "PASS" if star_rating > 0 else "WARN",
                f"Star ratings visible: {star_rating} elements")

            # ── Navigation tabs ──
            print("\n[4] Demo navigation tabs")
            tabs = page.locator("button[class*='tab'], nav button, [role='tab']").all()
            log("Tabs", "PASS" if tabs else "WARN", f"{len(tabs)} nav tabs found")

            # Click through tabs if any
            for i, tab in enumerate(tabs[:5]):
                try:
                    tab_text = tab.inner_text()[:20]
                    tab.click()
                    page.wait_for_timeout(700)
                    page.screenshot(path=f"{SCREENSHOTS}30_tab_{i}.png")

                    bad = [v for v in ["undefined", "NaN", "[object Object]"] if v in page.locator("body").inner_text()]
                    errs_before = len(console_errors)
                    if bad:
                        log("Tabs", "FAIL", f"Tab '{tab_text}' has bad values: {bad}")
                    else:
                        log("Tabs", "PASS", f"Tab '{tab_text}' — OK")
                except Exception as e:
                    log("Tabs", "WARN", f"Tab {i} error: {str(e)[:60]}")

            # ── Chat window ──
            print("\n[5] Chat / modal interactions")
            chat_btn = page.locator("button:has-text('Чат'), button:has-text('Chat'), [class*='chat']").first
            if chat_btn.count() > 0:
                chat_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=f"{SCREENSHOTS}40_chat.png")
                log("Chat", "PASS", "Chat opened")
                # Close modal if present
                close = page.locator("button:has-text('X'), button[aria-label='Close'], button:has-text('Закрыть')").first
                if close.count() > 0:
                    close.click()
            else:
                log("Chat", "WARN", "No visible chat button in demo")

            # ── Check for broken layout ──
            print("\n[6] Layout checks")
            overflow_x = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
            log("Layout", "WARN" if overflow_x else "PASS",
                "Horizontal overflow" if overflow_x else "No horizontal overflow")

            # Scrollable page check
            page_height = page.evaluate("() => document.documentElement.scrollHeight")
            log("Layout", "PASS", f"Page height: {page_height}px")

        else:
            log("Demo", "WARN", "No demo button on landing — checking text content for demo-like links")
            all_text = page.locator("body").inner_text()[:500]
            log("Demo", "WARN", f"Landing text sample: {all_text[:200]}")

        # ── Console errors final ──
        print("\n[7] Console errors summary")
        if console_errors:
            log("Console", "FAIL", f"{len(console_errors)} JS errors total")
            for e in console_errors[:5]:
                print(f"     - {e[:120]}")
        else:
            log("Console", "PASS", "Zero JS errors throughout session")

        # ── Mobile in demo ──
        print("\n[8] Mobile demo view")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.set_viewport_size({"width": 390, "height": 844})

        demo_btn_m = page.locator("button:has-text('Demo'), button:has-text('Демо')").first
        if demo_btn_m.count() > 0:
            demo_btn_m.click()
            page.wait_for_load_state("networkidle", timeout=8000)
            page.wait_for_timeout(800)
            page.screenshot(path=f"{SCREENSHOTS}50_mobile_demo.png", full_page=True)
            overflow_m = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
            log("Mobile", "WARN" if overflow_m else "PASS",
                "Horizontal overflow on mobile demo" if overflow_m else "No overflow on mobile demo (390px)")
        else:
            log("Mobile", "WARN", "Could not test mobile demo — no demo button")

        browser.close()

    # ── SUMMARY ──
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r["status"] == "PASS")
    warned = sum(1 for r in results if r["status"] == "WARN")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print(f"  PASS: {passed}   WARN: {warned}   FAIL: {failed}   Total: {len(results)}")
    print("=" * 60)

    if failed:
        print("\nFAILS (must fix before deploy):")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  XX [{r['category']}] {r['message']}")
                if r["detail"]:
                    print(f"      {r['detail'][:100]}")

    if warned:
        print("\nWARNINGS (review before deploy):")
        for r in results:
            if r["status"] == "WARN":
                print(f"  !! [{r['category']}] {r['message']}")

if __name__ == "__main__":
    run()
