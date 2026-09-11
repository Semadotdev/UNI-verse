import os
import sys
from collections import deque

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-source", "Arthur.gif")
OUT_GIF = os.path.join(ROOT, "public", "themes", "arthur.gif")
OUT_POSTER = os.path.join(ROOT, "public", "themes", "arthur-poster.png")
QA_OUT = os.path.join(ROOT, ".qa", "out")

N_FRAMES = 18
SIZE = 360
PALETTE_COLORS = 240
ALPHA_CUTOFF = 158
ISLAND_MAX = 5
TP_INDEX = 254
DISPOSAL = int(os.environ.get("ARTHUR_DISPOSAL", "2"))
KEY = (0, 255, 0)


os.makedirs(QA_OUT, exist_ok=True)

def median(v):
    v.sort()
    return v[len(v) // 2]

def chroma_of(a):
    return (a[0], a[1], a[2])

def remove_islands(a):
    """Zero-out opaque pixels in connected components smaller than ISLAND_MAX."""
    w, h = a.size
    px = a.load()
    seen = bytearray(w * h)
    orig = []
    for y in range(h):
        for x in range(w):
            orig.append(px[x, y])
    opaque = [(x, y) for y in range(h) for x in range(w) if orig[y * w + x][3] == 255]
    opaque_set = set(opaque)
    for start in opaque:
        x0, y0 = start
        if seen[y0 * w + x0]:
            continue
        comp = deque([start])
        seen[y0 * w + x0] = 1
        pixels = []
        while comp:
            cx, cy = comp.popleft()
            pixels.append((cx, cy))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nxp, nyp = cx + dx, cy + dy
                if 0 <= nxp < w and 0 <= nyp < h and not seen[nyp * w + nxp] and (nxp, nyp) in opaque_set:
                    seen[nyp * w + nxp] = 1
                    comp.append((nxp, nyp))
        if len(pixels) < ISLAND_MAX:
            for (ix, iy) in pixels:
                r, g, b, al = px[ix, iy]
                px[ix, iy] = (r, g, b, 0)
    return a

def zero_edge_ring(a, ring=2):
    w, h = a.size
    px = a.load()
    for y in range(h):
        for x in range(w):
            if x < ring or y < ring or x >= w - ring or y >= h - ring:
                r, g, b, al = px[x, y]
                px[x, y] = (r, g, b, 0)
    return a

def process_frame(fr, box):
    c = fr.crop(box)
    pw, ph = c.size
    px = c.load()
    for y in range(ph):
        for x in range(pw):
            r, g, b, a = px[x, y]
            aa = a / 255.0
            px[x, y] = (int(r * aa), int(g * aa), int(b * aa), a)
    scale = SIZE / ph
    nw = max(1, int(round(pw * scale)))
    small = c.resize((nw, SIZE), Image.LANCZOS)
    spx = small.load()
    for y in range(SIZE):
        for x in range(nw):
            r, g, b, a = spx[x, y]
            if a >= 32:
                aa = a / 255.0
                r = max(0, min(255, round(r / aa)))
                g = max(0, min(255, round(g / aa)))
                b = max(0, min(255, round(b / aa)))
                spx[x, y] = (r, g, b, 255 if a >= ALPHA_CUTOFF else 0)
            else:
                spx[x, y] = (0, 0, 0, 0)
    small = remove_islands(small)
    small = zero_edge_ring(small)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(small, ((SIZE - nw) // 2, 0))
    return canvas

def build_palette(frames, med):
    mosaic = Image.new("RGB", (SIZE * len(frames), SIZE), (128, 128, 128))
    for i, f in enumerate(frames):
        mosaic.paste(f.convert("RGB"), (i * SIZE, 0))
    pal = mosaic.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT)
    pl = list(pal.getpalette()[: PALETTE_COLORS * 3])
    # pad unused slots with the median matte tone (never pure black) so dithering
    # and naive renderers can't produce a black backdrop at transparent edges
    big = pl + list(med) * (256 - PALETTE_COLORS)
    pal.putpalette(big)
    pal.info["transparency"] = TP_INDEX
    return pal

def main():
    src = Image.open(SRC)
    total = getattr(src, "n_frames", 1)
    idxs = sorted(set(int(round(i * (total - 1) / (N_FRAMES - 1))) for i in range(N_FRAMES)))
    raw = []
    for f in idxs:
        src.seek(f)
        raw.append(src.convert("RGBA"))
    bboxes = [fr.getbbox() for fr in raw]
    box = (
        min(b[0] for b in bboxes),
        min(b[1] for b in bboxes),
        max(b[2] for b in bboxes),
        max(b[3] for b in bboxes),
    )
    wc, hc = box[2] - box[0], box[3] - box[1]
    rs, gs, bs = [], [], []
    for fr in raw:
        cc = fr.crop(box).load()
        for y in range(0, hc, 3):
            for x in range(0, wc, 3):
                r, g, b, a = cc[x, y]
                if a > 200:
                    rs.append(r); gs.append(g); bs.append(b)
    med = (median(rs), median(gs), median(bs))
    print("content bbox %s  median chroma %s  sampled-frames %d/%d" % (box, med, len(idxs), total))

    frames = [process_frame(fr, box) for fr in raw]

    pal = build_palette(frames, med)
    pals = []
    tp_img = Image.new("P", (SIZE, SIZE), TP_INDEX)
    for f in frames:
        rgb = f.convert("RGB")
        p = rgb.quantize(palette=pal, dither=Image.Dither.NONE)
        transp = f.split()[3].point(lambda a: 255 if a == 0 else 0)
        p.paste(tp_img, (0, 0), transp)
        pals.append(p)

    pals[0].info["transparency"] = TP_INDEX
    pals[0].info["background"] = TP_INDEX
    pals[0].save(
        OUT_GIF,
        save_all=True,
        append_images=pals[1:],
        duration=130,
        loop=0,
        disposal=DISPOSAL,
        optimize=False,
        transparency=TP_INDEX,
        background=TP_INDEX,
    )

    # poster: fullest frame, feather alpha, rounded mask
    fullest = max(range(len(frames)), key=lambda i: frames[i].split()[3].point(lambda a: 255 if a else 0).getbbox()[3])
    poster = frames[fullest].convert("RGBA")
    al = poster.split()[3]
    al = al.filter(ImageFilter.GaussianBlur(2.5))
    r = 40
    mask = Image.new("L", (SIZE, SIZE), 0)
    mpx = mask.load()
    from PIL import ImageDraw
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([2, 2, SIZE - 3, SIZE - 3], radius=r, fill=255)
    final_a = al.point(lambda v: min(v, 0)) if False else Image.new("L", (SIZE, SIZE))
    fa = final_a.load(); aa = al.load(); mk = mask.load()
    for y in range(SIZE):
        for x in range(SIZE):
            fa[x, y] = min(aa[x, y], mk[x, y])
    poster.putalpha(final_a)
    poster.save(OUT_POSTER)
    frames[0].save(os.path.join(QA_OUT, "frame0.png"))
    poster.save(os.path.join(QA_OUT, "poster.png"))

    # light sky-gradient backdrop for eyeball previews (character reads on-light)
    def sky_backdrop(scale):
        sx = SIZE // scale
        sy = SIZE // scale
        bg = Image.new("RGB", (sx, sy), (240, 228, 200))
        bpx = bg.load()
        top = (143, 165, 187)
        mid = (243, 217, 168)
        bot = (234, 174, 91)
        for y in range(sy):
            t = y / max(sy - 1, 1)
            if t < 0.52:
                k = t / 0.52
                c = tuple(int(top[i] + (mid[i] - top[i]) * k) for i in range(3))
            else:
                k = (t - 0.52) / 0.48
                c = tuple(int(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
            for x in range(sx):
                bpx[x, y] = c
        return bg

    ref = Image.open(OUT_GIF)
    cols, rows = 6, 3
    cell = 120
    sheet = Image.new("RGB", (cols * cell, rows * cell), (240, 228, 200))
    sb = sky_backdrop(3).resize((cols * cell, rows * cell), Image.LANCZOS)
    sheet.paste(sb, (0, 0))
    for f in range(ref.n_frames):
        ref.seek(f)
        fr = ref.convert("RGBA")
        fr.thumbnail((cell - 6, cell - 6))
        x = (f % cols) * cell + (cell - fr.size[0]) // 2
        y = (f // cols) * cell + (cell - fr.size[1]) // 2
        sheet.paste(fr, (x, y), fr)
    sheet.save(os.path.join(QA_OUT, "arthur_frames.png"))
    ref.seek(0)
    big = ref.convert("RGBA")
    hero = sb.resize((600, 300), Image.LANCZOS)
    ch = big.resize((int(big.size[0] * 180 / big.size[1]), 180), Image.LANCZOS)
    hero.paste(ch, ((600 - ch.size[0]) // 2, 300 - ch.size[1]), ch)
    hero.save(os.path.join(QA_OUT, "arthur_on_sky.png"))

    # assertions
    import time
    gif_size = os.path.getsize(OUT_GIF)
    poster_size = os.path.getsize(OUT_POSTER)
    print("processed frames %d -> %d  gif %d KB  poster %d KB" % (len(idxs), len(pals), gif_size // 1024, poster_size // 1024))

    check = Image.open(OUT_GIF)
    facts = []
    facts.append(("frame count", check.n_frames, None))
    facts.append(("size square", check.size == (SIZE, SIZE), check.size))
    worst_green = 0
    worst_corner = None
    minsize = []
    for f in range(check.n_frames):
        check.seek(f)
        fg = check.convert("RGBA")
        px = fg.load()
        n = sum(1 for y in range(SIZE) for x in range(SIZE) if px[x, y][3] == 255)
        minsize.append(n)
        for y in range(SIZE):
            for x in range(SIZE):
                r, g, b, a = px[x, y]
                if a > 0 and (g - r > 60) and (g - b > 60) and g > 140:
                    worst_green += 1
        c = [px[z] for z in [(0, 0), (SIZE - 1, 0), (0, SIZE - 1), (SIZE - 1, SIZE - 1)]]
        worst_corner = c if worst_corner is None else worst_corner
    facts.append(("opaque px min", min(minsize), None))
    facts.append(("green residue 0", worst_green == 0, f"{worst_green}px"))

    def gce_transparency(path):
        data = open(path, "rb").read()
        gct_n = 2 ** ((data[10] & 7) + 1)
        i = 13 + 3 * gct_n
        res = []
        while i < len(data) - 1:
            if data[i] == 0x21 and data[i + 1] == 0xF9:
                res.append((bool(data[i + 3] & 1), data[i + 6]))
                i += 8
            elif data[i] == 0x2C:
                lc = data[i + 9]
                lsz = 3 * (2 ** ((lc & 7) + 1)) if (lc & 0x80) else 0
                i += 10 + lsz + 1
                while i < len(data) and data[i] != 0:
                    i += 1 + data[i]
                i += 1
            elif data[i] == 0x3B:
                break
            else:
                i += 1
        return res

    gces = gce_transparency(OUT_GIF)
    ok_transp = len(gces) == check.n_frames and all(t == 254 for _, t in gces)
    facts.append(("every-frame GCE transparency", ok_transp, gces[:3]))
    pc = Image.open(OUT_POSTER).convert("RGBA")
    pcs = [pc.getpixel(z) for z in [(0, 0), (SIZE - 1, 0), (0, SIZE - 1), (SIZE - 1, SIZE - 1)]]
    facts.append(("poster corners alpha0", all(p[3] == 0 for p in pcs), pcs))
    allok = True
    for name, ok, extra in facts:
        print("  [%s] %s%s" % ("PASS" if ok else "FAIL", name, " " + str(extra) if extra is not None else ""))
        if not ok:
            allok = False
    print("GIF corners:", [c[:3] for c in (worst_corner or [])])
    print("RESULT:", "OK" if allok else "FAILED")
    sys.exit(0 if allok else 1)

if __name__ == "__main__":
    main()