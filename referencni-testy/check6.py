import asyncio, sys
from playwright.async_api import async_playwright
P = sys.argv[1]

async def passgate(pg, phone=''):
    if await pg.locator('#gate').is_visible():
        await pg.fill('#gf-name', 'Jana Testovací'); await pg.fill('#gf-email', 'jana@example.com')
        if phone: await pg.fill('#gf-phone', phone)
        await pg.check('#gf-consent'); await pg.click('#gf-submit'); await pg.wait_for_timeout(250)
        return True
    return False
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); out = []
        for (w, h) in [(390, 844), (1366, 768)]:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            pg.on('pageerror', lambda e: out.append(f'PAGEERROR {w}: {e}'))
            sw = lambda: pg.evaluate('document.documentElement.scrollWidth')
            await pg.goto('file://' + P + '#kyber'); await pg.wait_for_timeout(300)
            await passgate(pg)
            mx = await sw()
            for sel in ['[data-cmd="grep"]','[data-cmd="count"]','[data-q1="0"]','[data-cmd="ufw"]','[data-cmd="last"]','[data-q2="1"]']:
                await pg.click(sel); await pg.wait_for_timeout(700); mx = max(mx, await sw())
            await pg.check('#s-k1'); await pg.check('#s-k2'); await pg.click('[data-act="deploy"]'); await pg.wait_for_timeout(2400)
            out.append(f'{w}px kyber max width {mx}, claim visible {await pg.is_visible("#s-done")}')
            await pg.evaluate("location.hash='hry'"); await pg.wait_for_timeout(400)
            bb = await pg.locator('#g-canvas').bounding_box(); pb = await pg.locator('#g-play').bounding_box()
            out.append(f'{w}px canvas {bb["width"]:.0f}x{bb["height"]:.0f}, play button bottom {pb["y"]+pb["height"]:.0f} (viewport {h})')
            await pg.click('#g-play'); await pg.wait_for_timeout(300)
            out.append(f'{w}px during play: jump visible {await pg.is_visible("#g-jump")}, play hidden {not await pg.is_visible("#g-play")}')
            if w == 390:
                await pg.evaluate("location.hash='data'"); await pg.wait_for_timeout(300)
                await pg.click('[data-dview="produkty"]'); await pg.wait_for_timeout(400)
                out.append(f'fab visible after 2 views (options off-screen): {await pg.is_visible("#d-fab")}')
                await pg.click('#d-fab'); await pg.wait_for_timeout(700)
                out.append(f'fab hidden after scroll to options: {not await pg.is_visible("#d-fab")}')
                await pg.evaluate("location.hash='ai'"); await pg.wait_for_timeout(200)
                await pg.click('[data-idea="navyky"]'); await pg.wait_for_timeout(4800)
                cell = await pg.locator('.hcell').first.bounding_box()
                out.append(f'habit cell size {cell["width"]:.0f}px')
            await pg.close()
        await b.close(); print('\n'.join(out))
asyncio.run(main())
