import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def verify_page(browser, url, name_prefix):
    page = await browser.new_page()
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    # Desktop
    await page.set_viewport_size({"width": 1280, "height": 800})
    await page.goto(f"http://localhost:8000/{url}")
    await page.wait_for_timeout(1000) # Wait for header-loader.js
    await page.screenshot(path=f"verification/{name_prefix}_desktop.png")

    # Mobile
    await page.set_viewport_size({"width": 375, "height": 667})
    await page.goto(f"http://localhost:8000/{url}")
    await page.wait_for_timeout(2000)

    await page.screenshot(path=f"verification/{name_prefix}_mobile_closed.png")

    # Open Mobile Menu
    menu_toggle = page.locator(".menu-toggle")
    if await menu_toggle.is_visible():
        await menu_toggle.click()
        await page.wait_for_timeout(1000) # Wait for transition
        await page.screenshot(path=f"verification/{name_prefix}_mobile_open.png")
    else:
        print(f"Menu toggle NOT visible for {name_prefix}")

    await page.close()

async def main():
    if not os.path.exists("verification"):
        os.makedirs("verification")

    # Start local server
    server = subprocess.Popen(["python3", "-m", "http.server", "8000"])
    time.sleep(2) # Give it time to start

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()

            pages = [
                ("index.html", "home"),
                ("translationcore/index.html", "tc"),
                ("translation-helps/index.html", "helps")
            ]

            for url, name in pages:
                print(f"Verifying {url}...")
                await verify_page(browser, url, name)

            await browser.close()
    finally:
        server.terminate()

if __name__ == "__main__":
    asyncio.run(main())
