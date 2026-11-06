import asyncio
from playwright.async_api import async_playwright
import os

async def verify_page(browser, url, name_prefix):
    page = await browser.new_page()
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    # Desktop
    await page.set_viewport_size({"width": 1280, "height": 800})
    # Use full path for file protocol
    full_path = "file://" + os.path.abspath(url)
    await page.goto(full_path)
    await page.wait_for_timeout(1000) # Wait for header-loader.js
    await page.screenshot(path=f"verification/{name_prefix}_desktop.png")

    # Mobile
    await page.set_viewport_size({"width": 375, "height": 667})
    await page.goto(f"file://{os.getcwd()}/{url}")
    await page.wait_for_timeout(2000)

    # Debug style
    print(f"Content of #site-header: {await page.locator('#site-header').inner_html()}")
    visibility = await page.evaluate('''() => {
        const el = document.querySelector('.menu-toggle');
        if (!el) return 'NOT FOUND';
        const style = window.getComputedStyle(el);
        return {
            display: style.display,
            width: style.width,
            height: style.height,
            visibility: style.visibility,
            opacity: style.opacity
        };
    }''')
    print(f"Debug menu-toggle for {name_prefix}: {visibility}")

    await page.screenshot(path=f"verification/{name_prefix}_mobile_closed.png")

    # Open Mobile Menu
    menu_toggle = page.locator(".menu-toggle")
    print(f"Checking for menu toggle for {name_prefix}...")
    if await menu_toggle.is_visible():
        print(f"Clicking menu toggle for {name_prefix}...")
        await menu_toggle.click()
        await page.wait_for_timeout(1000) # Wait for transition
        await page.screenshot(path=f"verification/{name_prefix}_mobile_open.png")
    else:
        print(f"Menu toggle NOT visible for {name_prefix}")

    await page.close()

async def main():
    if not os.path.exists("verification"):
        os.makedirs("verification")

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

if __name__ == "__main__":
    asyncio.run(main())
