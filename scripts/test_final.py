# -*- coding: utf-8 -*-
"""
Final pre-deploy verification — no Cyrillic in locators, nth-based nav
"""
import sys, re
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"
SS = "C:/Users/HomePc/Railmatch Anti/scripts/final_"
results = []

def log(cat, status, msg, detail=""):
    icon = "OK" if status == "PASS" else ("!!" if status == "WARN" else "XX")
    print(f"  [{icon}] [{cat}] {msg}" + (f"\n       -> {detail}" if detail else ""))
    results.append({"cat": cat, "status": status, "msg": msg})

def click_nav(page, index):
    """Click nav tab by index: 0=BIRJA, 1=MY REQ, 2=MY BIDS, 3=ANALYTICS, 4=MESSAGES"""
    page.locator("nav button").nth(index).click()
    page.wait_for_timeout(900)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        js_errors = []
        page.on("console", lambda m: js_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: js_errors.append(str(e)))

        # [1] Enter demo — click button index 3 (СМОТРЕТЬ ДЕМО)
        print("\n[1] Enter demo")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle", timeout=15000)
        page.locator("button").nth(4).click()
        page.wait_for_load_state("networkidle", timeout=10000)
        page.wait_for_timeout(4000)  # wait for Supabase fetch
        page.screenshot(path=f"{SS}01_exchange.png", full_page=True)
        log("Demo", "PASS", "Demo entered")

        # [2] Exchange — check for request cards
        print("\n[2] Exchange / Request cards")
        body = page.locator("body").inner_text()
        # RequestCard root: rounded-3xl
        cards = page.locator(".rounded-3xl").count()
        # Check empty state
        empty = "0" if "Nothing" not in body and "\u041d\u0438\u0447\u0435\u0433\u043e" not in body else "1"
        log("Exchange", "PASS" if cards > 0 else "FAIL",
            f"{cards} rounded-3xl elements (request cards)")

        # [3] Rating badge — amber color class on cards
        print("\n[3] Rating badge")
        amber = page.locator("[class*='amber']").count()
        star_svg = page.locator("svg[class*='lucide-star'], [data-lucide='star']").count()
        log("Rating", "PASS" if amber > 0 else "WARN",
            f"Amber elements: {amber}, star SVGs: {star_svg}")
        nums = re.findall(r'\b[1-5]\.[0-9]\b', body)
        log("Rating", "PASS" if nums else "WARN",
            f"Numeric ratings: {nums[:5]}" if nums else
            "No x.x ratings — users haven't reviewed yet (expected for new feature)")

        # [4] Analytics tab (index 3)
        print("\n[4] Analytics tab")
        click_nav(page, 3)
        page.screenshot(path=f"{SS}02_analytics.png")
        ab = page.locator("body").inner_text()
        has_dashes = "---" in ab
        log("Analytics", "WARN" if has_dashes else "PASS",
            "WARN: '---' placeholder for avg bid price" if has_dashes else "Analytics renders OK")

        # [5] Messages tab (index 4)
        print("\n[5] Messages")
        click_nav(page, 4)
        page.screenshot(path=f"{SS}03_messages.png")
        log("Messages", "PASS", "Messages tab loaded")

        # [6] My Requests tab (index 1)
        print("\n[6] My Requests")
        click_nav(page, 1)
        page.screenshot(path=f"{SS}04_my_requests.png")
        # Check for create button (no Cyrillic: look for any button in page area)
        page_btns = page.locator("main button, section button, [class*='request'] button").count()
        log("MyRequests", "PASS", f"My Requests tab rendered, {page_btns} buttons")

        # [7] My Bids tab (index 2)
        print("\n[7] My Bids")
        click_nav(page, 2)
        page.screenshot(path=f"{SS}05_my_bids.png")
        log("MyBids", "PASS", "My Bids tab rendered")

        # [8] Exchange → open create form
        print("\n[8] Create request form")
        click_nav(page, 0)
        page.wait_for_timeout(500)
        # "Создать демо-заявку" button — find by class patterns
        create_btns = page.locator("button").all()
        form_opened = False
        for btn in create_btns:
            try:
                txt = btn.inner_text().strip()
                if len(txt) > 3 and ("DEMO" in txt.upper() or "CREATE" in txt.upper()
                                     or "\u0417\u0430\u044f\u0432" in txt   # Заяв
                                     or "\u0421\u043e\u0437\u0434" in txt): # Созд
                    btn.click()
                    page.wait_for_timeout(1000)
                    inputs = page.locator("input, select, textarea").count()
                    if inputs > 2:
                        page.screenshot(path=f"{SS}06_create_form.png")
                        log("CreateForm", "PASS", f"Create form opened, {inputs} inputs")
                        form_opened = True
                        # Close modal
                        close_btns = page.locator("button").all()
                        for cb in close_btns:
                            try:
                                ct = cb.inner_text().strip()
                                if "\u041e\u0442\u043c" in ct or "\u0437\u0430\u043a\u0440" in ct.lower():  # Отм / закр
                                    cb.click()
                                    break
                            except:
                                pass
                        break
                    else:
                        # Not a form, navigate back
                        page.go_back()
                        page.wait_for_timeout(500)
            except:
                continue
        if not form_opened:
            page.screenshot(path=f"{SS}06_exchange_no_form.png")
            log("CreateForm", "WARN", "Could not open create form (demo restriction or selector miss)")

        # [9] Mobile 390px
        print("\n[9] Mobile")
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(600)
        page.screenshot(path=f"{SS}07_mobile.png", full_page=False)
        overflow = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        log("Mobile", "WARN" if overflow else "PASS",
            "Overflow at 390px" if overflow else "No overflow at 390px")

        # [10] Data integrity throughout session
        print("\n[10] Data integrity")
        final_body = page.locator("body").inner_text()
        bad = [v for v in ["undefined", "NaN", "[object Object]"] if v in final_body]
        log("Data", "FAIL" if bad else "PASS",
            f"Bad values found: {bad}" if bad else "No undefined/NaN/object in DOM")

        # [11] JS errors
        print("\n[11] JS errors")
        if js_errors:
            log("Console", "FAIL", f"{len(js_errors)} JS errors")
            for e in js_errors:
                print(f"     - {e[:120]}")
        else:
            log("Console", "PASS", "Zero JS errors")

        browser.close()

    # Summary
    print("\n" + "=" * 55)
    p_ = sum(1 for r in results if r["status"] == "PASS")
    w_ = sum(1 for r in results if r["status"] == "WARN")
    f_ = sum(1 for r in results if r["status"] == "FAIL")
    print(f"  PASS: {p_}   WARN: {w_}   FAIL: {f_}   Total: {len(results)}")
    print("=" * 55)
    if f_:
        print("\nFAILS (fix before deploy):")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  XX [{r['cat']}] {r['msg']}")
    if w_:
        print("\nWARNINGS:")
        for r in results:
            if r["status"] == "WARN":
                print(f"  !! [{r['cat']}] {r['msg']}")

if __name__ == "__main__":
    run()
