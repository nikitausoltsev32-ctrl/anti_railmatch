"""
Railmatch Anti - Pre-deployment gap testing
Tests all major user flows and surfaces broken UI, console errors, missing features
"""
import sys
import json
import time
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3001"
results = []

def log(category, status, message, detail=""):
    icon = "✓" if status == "PASS" else ("⚠" if status == "WARN" else "✗")
    print(f"  {icon} [{category}] {message}" + (f"\n      → {detail}" if detail else ""))
    results.append({"category": category, "status": status, "message": message, "detail": detail})

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        console_errors = []
        network_errors = []

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))
        page.on("response", lambda r: network_errors.append(f"{r.status} {r.url}") if r.status >= 400 and "supabase" not in r.url else None)

        # ── 1. Landing / Auth page ──
        print("\n[1] Landing & Auth")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=15000)
        page.screenshot(path="C:/Users/HomePc/Railmatch Anti/scripts/01_landing.png", full_page=True)

        if page.title():
            log("Landing", "PASS", f"Page loaded: {page.title()}")
        else:
            log("Landing", "FAIL", "Page title missing")

        # Check for login/auth screen
        auth_visible = page.locator("input[type='email'], input[type='text']").count() > 0
        if auth_visible:
            log("Auth", "PASS", "Auth form visible")
        else:
            log("Auth", "WARN", "No auth form found on landing")

        # ── 2. Check for broken images/icons ──
        print("\n[2] Assets & Images")
        broken_imgs = page.evaluate("""
            () => Array.from(document.images)
                .filter(img => !img.complete || img.naturalWidth === 0)
                .map(img => img.src)
        """)
        if broken_imgs:
            log("Assets", "FAIL", f"{len(broken_imgs)} broken images", str(broken_imgs[:3]))
        else:
            log("Assets", "PASS", "All images loaded")

        # ── 3. Mobile responsiveness ──
        print("\n[3] Mobile Responsiveness")
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)
        page.screenshot(path="C:/Users/HomePc/Railmatch Anti/scripts/02_mobile.png", full_page=True)

        # Check for horizontal overflow
        overflow = page.evaluate("""
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        """)
        if overflow:
            log("Mobile", "WARN", "Horizontal overflow on mobile (375px)")
        else:
            log("Mobile", "PASS", "No horizontal overflow on mobile")

        page.set_viewport_size({"width": 1280, "height": 800})

        # ── 4. Console errors check ──
        print("\n[4] Console Errors")
        pre_auth_errors = list(console_errors)
        if pre_auth_errors:
            log("Console", "FAIL", f"{len(pre_auth_errors)} JS errors before auth", pre_auth_errors[0][:120])
        else:
            log("Console", "PASS", "No console errors on load")

        # ── 5. Check critical UI elements ──
        print("\n[5] Critical UI Elements")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=15000)

        checks = [
            ("button", "Buttons exist"),
            ("form, input", "Form inputs exist"),
        ]
        for selector, label in checks:
            count = page.locator(selector).count()
            if count > 0:
                log("UI", "PASS", f"{label} ({count} found)")
            else:
                log("UI", "WARN", f"{label} — none found")

        # ── 6. Try Demo flow if exists ──
        print("\n[6] Demo Mode")
        demo_btn = page.locator("text=Демо, text=Demo, button:has-text('demo'), button:has-text('Демо')").first
        if demo_btn.count() > 0:
            try:
                demo_btn.click()
                page.wait_for_load_state("networkidle", timeout=10000)
                page.screenshot(path="C:/Users/HomePc/Railmatch Anti/scripts/03_demo.png", full_page=True)
                log("Demo", "PASS", "Demo mode accessible")

                # Check dashboard loads
                dashboard_visible = page.locator("[class*='dashboard'], [class*='request'], main").count() > 0
                if dashboard_visible:
                    log("Demo", "PASS", "Dashboard content visible in demo")
                else:
                    log("Demo", "WARN", "Dashboard content unclear in demo")
            except Exception as e:
                log("Demo", "FAIL", "Demo click failed", str(e)[:80])
        else:
            log("Demo", "WARN", "No demo button found on landing")

        # ── 7. Network errors ──
        print("\n[7] Network Requests")
        if network_errors:
            log("Network", "FAIL", f"{len(network_errors)} HTTP errors", network_errors[0][:100])
        else:
            log("Network", "PASS", "No HTTP 4xx/5xx errors")

        # ── 8. Check for undefined/NaN in visible text ──
        print("\n[8] Data Rendering")
        page_text = page.locator("body").inner_text()
        issues = []
        for bad in ["undefined", "NaN", "[object Object]", "null"]:
            if bad in page_text:
                issues.append(bad)
        if issues:
            log("Data", "WARN", f"Suspicious values in DOM: {issues}")
        else:
            log("Data", "PASS", "No undefined/NaN in visible text")

        # ── 9. Check env vars / config not exposed ──
        print("\n[9] Security (client-side)")
        src_text = page.evaluate("() => document.documentElement.innerHTML")
        security_issues = []
        if "VITE_SUPABASE_KEY" in src_text or "service_role" in src_text:
            security_issues.append("Supabase service key exposed in HTML")
        if security_issues:
            log("Security", "FAIL", "Sensitive data in HTML", str(security_issues))
        else:
            log("Security", "PASS", "No obvious secrets in rendered HTML")

        # ── 10. Page load performance ──
        print("\n[10] Performance")
        start = time.time()
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=20000)
        load_time = time.time() - start
        if load_time < 3:
            log("Perf", "PASS", f"Page loaded in {load_time:.1f}s")
        elif load_time < 6:
            log("Perf", "WARN", f"Slow load: {load_time:.1f}s")
        else:
            log("Perf", "FAIL", f"Very slow load: {load_time:.1f}s")

        # Final console error tally
        total_errors = len(console_errors)
        if total_errors > 0:
            print(f"\n  All JS errors ({total_errors}):")
            for e in console_errors[:5]:
                print(f"    - {e[:120]}")

        browser.close()

    # ── Summary ──
    print("\n" + "="*55)
    passed = sum(1 for r in results if r["status"] == "PASS")
    warned = sum(1 for r in results if r["status"] == "WARN")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print(f"  PASS: {passed}  WARN: {warned}  FAIL: {failed}  Total: {len(results)}")
    print("="*55)
    print("Screenshots: C:/Users/HomePc/Railmatch Anti/scripts/01_landing.png, C:/Users/HomePc/Railmatch Anti/scripts/02_mobile.png, C:/Users/HomePc/Railmatch Anti/scripts/03_demo.png")

    if failed > 0:
        print("\nFAILS to fix before deploy:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  ✗ [{r['category']}] {r['message']}")
                if r["detail"]:
                    print(f"      {r['detail'][:100]}")

    if warned > 0:
        print("\nWARNINGS (review before deploy):")
        for r in results:
            if r["status"] == "WARN":
                print(f"  ⚠ [{r['category']}] {r['message']}")

if __name__ == "__main__":
    run_tests()
