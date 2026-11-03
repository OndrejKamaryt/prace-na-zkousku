import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); pg = await b.new_page(viewport={'width':390,'height':844})
        for h in ['start','data','ai','hry','kyber','vysledek']:
            await pg.goto('file://' + sys.argv[1] + '#' + h); await pg.wait_for_timeout(300)
            bad = await pg.evaluate("""Array.from(document.querySelectorAll('[hidden]')).filter(e => getComputedStyle(e).display !== 'none' && !e.closest('[hidden]:not(:scope)')).map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className) + ' (' + getComputedStyle(e).display + ')')""")
            print(h, bad)
        await b.close()
asyncio.run(main())
