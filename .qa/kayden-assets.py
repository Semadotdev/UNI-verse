import json, os, sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
OUT = "/tmp/qa_assets"
os.makedirs(OUT, exist_ok=True)

results = []
def check(name, ok, info=""):
    results.append((name, bool(ok), info))
    mark = "PASS" if ok else "FAIL"
    print(f"[QA] {mark} - {name}" + (f" ({info})" if info else ""))

def log(*a):
    print("[QA]", *a)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    api = p.request.new_context()

    # 1. served GIF sanity
    r = api.get(BASE + "/themes/kayden.gif")
    check("gif served 200", r.status == 200, str(r.status))
    data = r.body()
    check("gif served size == 382796", len(data) == 382796, f"{len(data)}B")
    tmp = Path(OUT) / "served.gif"; tmp.write_bytes(data)
    im = Image.open(tmp)
    frames = getattr(im, "n_frames", 1)
    im.seek(0); f0 = im.convert("RGBA")
    corners = [f0.getpixel(p) for p in [(0, 0), (im.size[0]-1, im.size[1]-1)]]
    check("gif 384x391 18 frames animated", im.size == (384, 391) and frames == 18, f"{frames}f")
    check("gif corners fully transparent", all(a == 0 for _, _, _, a in corners), str(corners))
    worst = 0; body = 10**9
    for f in range(frames):
        im.seek(f); px = im.convert("RGBA").load(); W, H = im.size
        ew = sum(1 for y in range(int(H*0.8), H) for x in range(int(W*0.65), W) if px[x, y][3] and min(px[x, y][:3]) > 225)
        worst = max(worst, ew)
        body = min(body, sum(1 for y in range(H) for x in range(W) if px[x, y][3]))
    check("gif tail-region white residue == 0", worst == 0, f"{worst}")
    check("gif cat body intact (>75k px)", body > 75000, f"{body}")

    # 2. served poster
    rp = api.get(BASE + "/themes/kayden-poster.png")
    check("poster served 200", rp.status == 200, str(rp.status))
    pptmp = Path(OUT) / "served.png"; pptmp.write_bytes(rp.body())
    pp = Image.open(pptmp).convert("RGBA")
    pc = [pp.getpixel(q) for q in [(0, 0), (pp.size[0]-1, pp.size[1]-1)]]
    check("poster corners transparent", all(a == 0 for _, _, _, a in pc), str(pc))

    # 3. SW cache version
    rsw = api.get(BASE + "/sw.js")
    sbody = rsw.body().decode("utf-8", "ignore")
    check("sw cache bumped to v6", 'uni-verse-v6' in sbody and 'uni-verse-v5' not in sbody,
          "v6" if 'uni-verse-v6' in sbody else "not v6")

    # 4. register a fresh viewer, verify sticker + themed card pipeline
    page = browser.new_page()
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    uname = "v_%d" % (os.getpid() % 100000)
    page.goto(BASE + "/register", wait_until="networkidle")
    page.fill("#email", "%s@qa.local" % uname)
    page.fill("#username", uname)
    page.fill("#birthDate", "2000-01-15")
    page.fill("#password", "Passw0rd!qa")
    page.fill("#confirmPassword", "Passw0rd!qa")
    page.click('form button[type="submit"]')
    page.wait_for_timeout(2500)
    log("post-signup url:", page.url)
    page.goto(BASE + "/posts", wait_until="networkidle")
    page.wait_for_timeout(1500)
    fc = page.evaluate("""() => {
      const card = document.querySelector('article.theme-card-webtoon');
      if (!card) return { found: false };
      const body = card.querySelector('.text-zinc-200');
      return { found: true, bodyColor: body ? getComputedStyle(body).color : null,
               rowButtons: card.querySelectorAll('button').length,
               bgGradient: getComputedStyle(card).backgroundImage.includes('gradient') };
    }""")
    check("feed themed card present", bool(fc.get("found")), str(fc.get("rowButtons")) + " action buttons")
    check("feed card gradient bg", bool(fc.get("bgGradient")))
    check("feed caption black", fc.get("bodyColor") == "rgb(0, 0, 0)", str(fc.get("bodyColor")))
    if fc.get("found"):
        folder_info = page.evaluate("""() => {
          const card = document.querySelector('article.theme-card-webtoon');
          const chip = card.querySelector('.folder-attachment');
          if (!chip) return { present: false };
          const name = chip.querySelector('.text-zinc-200');
          const count = chip.querySelector('.text-muted');
          const n = name ? getComputedStyle(name).color : null;
          const c = count ? getComputedStyle(count).color : null;
          const bg = getComputedStyle(chip).backgroundColor;
          return { present: true, name: n, count: c, chipBg: bg, nameText: name ? name.textContent : null };
        }""")
        check("folder chip present on themed card", bool(folder_info.get("present")))
        check("folder name is white on chip", folder_info.get("name") == "rgb(228, 228, 231)", str(folder_info.get("name")) + " " + str(folder_info.get("nameText")))
        check("folder chip dark bg", folder_info.get("chipBg") in ("rgb(17, 17, 24)", "rgb(244, 244, 245)"), str(folder_info.get("chipBg")))
        check("folder item count light", folder_info.get("count") == "rgb(161, 161, 170)", str(folder_info.get("count")))
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        btn = page.locator("article.theme-card-webtoon button").first
        btn.hover()
        page.wait_for_timeout(250)
        hc = page.evaluate("""() => { const b = document.querySelector('article.theme-card-webtoon button');
          const s = getComputedStyle(b);
          return { color: s.color, bg: s.backgroundColor }; }""")
        check("hover icon white + dark bg retained",
              hc.get("color") == "rgb(255, 255, 255)" and hc.get("bg") != "rgba(0, 0, 0, 0)",
              json.dumps(hc))
        page.screenshot(path=f"{OUT}/feed.png", full_page=True)
    page.goto(BASE + "/qa_kayden_ymfkrk", wait_until="networkidle")
    page.wait_for_timeout(1500)
    prof = page.evaluate("""() => {
      const sticker = document.querySelector('.theme-sticker img');
      return { hasTheme: !!document.querySelector('.profile-theme-webtoon'),
               stickerSrc: sticker ? (sticker.currentSrc || sticker.src) : null };
    }""")
    check("webtoon profile shell present", bool(prof.get("hasTheme")))
    check("sticker img points at kayden gif", prof.get("stickerSrc") is not None and "kayden.gif" in prof.get("stickerSrc"), str(prof.get("stickerSrc"))[:80])
    page.screenshot(path=f"{OUT}/profile.png", full_page=True)
    js_errors = [e for e in errs if "favicon" not in e.lower() and "net::" not in e.lower()]
    check("no console errors", len(js_errors) == 0, str(js_errors)[:120])
    page.close()
    browser.close()

failed = [r for r in results if not r[1]]
print(f"\n[QA] RESULT: {'ALL PASS' if not failed else f'{len(failed)} FAILED'}")
for r in failed:
    print("  FAIL:", r[0], r[2])
sys.exit(1 if failed else 0)