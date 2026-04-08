import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle", timeout=15000)

    btns = page.locator("button").all()
    for i, btn in enumerate(btns[:25]):
        try:
            txt = btn.inner_text().strip().replace('\n', ' ')[:45]
            if txt:
                print(f"{i}: {txt}")
        except:
            pass
    browser.close()
