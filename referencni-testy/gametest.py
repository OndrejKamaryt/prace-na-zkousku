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
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: out.append(f'pageerror: {e}'))
        await pg.goto('file://' + P + '#hry'); await pg.wait_for_timeout(400)
        await passgate(pg)
        await pg.click('#g-play'); await pg.wait_for_timeout(2600)
        s1 = await pg.inner_text('#g-status')
        out.append('1st death: ' + s1)
        out.append(f'  play button: "{await pg.inner_text("#g-play")}", visible {await pg.is_visible("#g-play")}, disabled {await pg.is_disabled("#g-play")}, jump visible {await pg.is_visible("#g-jump")}')
        await pg.wait_for_timeout(3000)
        s2 = await pg.inner_text('#g-status')
        out.append(f'  after 3 more seconds still stopped: {s1 == s2}, disabled now {await pg.is_disabled("#g-play")}')
        for i in (2, 3):
            await pg.click('#g-play'); await pg.wait_for_timeout(2600)
            out.append(f'{i}. death: ' + (await pg.inner_text('#g-status'))[:90])
        out.append('editor unlocked: ' + str(await pg.is_visible('#g-tools')))
        box = await pg.locator('#g-canvas').bounding_box()
        for (c, r) in [(4,6),(5,6)]:
            await pg.mouse.click(box['x'] + (c+0.5)/12*box['width'], box['y'] + (r+0.5)/7*box['height'])
        await pg.click('[data-tool="0"]')
        await pg.mouse.click(box['x'] + 8.5/12*box['width'], box['y'] + 5.5/7*box['height'])
        await pg.wait_for_timeout(1000)
        await pg.click('#g-play'); await pg.wait_for_timeout(3900)
        out.append('own level: ' + await pg.inner_text('#g-status'))
        out.append('claim bar visible: ' + str(await pg.is_visible('#g-done')))
        await b.close(); print('\n'.join(out))
asyncio.run(main())
