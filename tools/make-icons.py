"""Draws the app logo: a white Tibetan A (ཨ) in a five-coloured thigle on night blue.
Run from the repo root:  python tools/make-icons.py   (needs Pillow: python -m pip install pillow)
Writes ngondro/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png, favicon-32.png,
and ngondro/icon-preview-*.png (other designs, for choosing; not linked anywhere)."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ngondro')
FONT = os.path.join(ROOT, 'fonts', 'noto-serif-tibetan.woff2')
RAINBOW = ['#f2c94c', '#4caf6e', '#4a7fd4', '#e2574c', '#f4f1ea']   # outside → in: yellow, green, blue, red, white
S = 1024  # draw large, then scale down for smooth edges


def radial(size, inner, outer, cy=0.45):
    """Night-blue radial background."""
    img = Image.new('RGB', (size, size), outer)
    d = ImageDraw.Draw(img)
    steps = 120
    for i in range(steps, 0, -1):
        t = i / steps
        r = int(size * 0.75 * t)
        c = tuple(int(a + (b - a) * t) for a, b in zip(inner, outer))
        d.ellipse((size / 2 - r, size * cy - r, size / 2 + r, size * cy + r), fill=c)
    return img


def logo(mask=False):
    img = radial(S, (31, 44, 88), (8, 12, 30)).convert('RGBA')
    k = 0.78 if mask else 1.0          # maskable icons keep everything in the middle 80%
    c, R = S / 2, S * 0.35 * k
    d = ImageDraw.Draw(img)
    # soft glow behind the thigle
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((c - R - 30, c - R - 30, c + R + 30, c + R + 30), fill=(255, 255, 255, 70))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(40)))
    d = ImageDraw.Draw(img)
    w = 26 * k
    for i, col in enumerate(RAINBOW):          # the five-coloured rings
        r = R + 52 * k - i * w
        d.ellipse((c - r, c - r, c + r, c + r), fill=col)
    inner = R + 52 * k - 5 * w
    disc = radial(int(inner * 2), (54, 66, 110), (18, 24, 52), cy=0.42).convert('RGBA')
    m = Image.new('L', disc.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, disc.size[0] - 1, disc.size[1] - 1), fill=255)
    img.paste(disc, (int(c - inner), int(c - inner)), m)
    # the white A, with a glow
    font = ImageFont.truetype(FONT, int(560 * k))
    l, t, r2, b = font.getbbox('ཨ')
    pos = (c - (l + r2) / 2, c - (t + b) / 2 + 6 * k)
    halo = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(halo).text(pos, 'ཨ', font=font, fill=(255, 255, 255, 230))
    img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(22)))
    ImageDraw.Draw(img).text(pos, 'ཨ', font=font, fill=(255, 255, 255, 255))
    return img


def rounded(img, radius_frac=0.22):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius=int(img.size[0] * radius_frac), fill=255)
    out = img.copy(); out.putalpha(m); return out


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, name), optimize=True)
    print('wrote', name, size)


full = logo()
save(rounded(full), 'icon-512.png', 512)
save(rounded(full), 'icon-192.png', 192)
save(rounded(full), 'favicon-32.png', 32)
save(logo(mask=True).convert('RGB'), 'icon-512-maskable.png', 512)
save(full.convert('RGB'), 'apple-touch-icon.png', 180)   # iPhone rounds the corners itself

# Social preview (what WhatsApp, Facebook etc. show for a shared link): 1200 x 630
card = radial(1200, (31, 44, 88), (8, 12, 30)).crop((0, 285, 1200, 915)).convert('RGBA')
card.alpha_composite(rounded(full).resize((400, 400), Image.LANCZOS), (90, 115))
d = ImageDraw.Draw(card)
UI = os.path.join(ROOT, 'fonts', 'atkinson-latin.woff2'); DISP = os.path.join(ROOT, 'fonts', 'fraunces-latin.woff2')
d.text((560, 200), 'Sliced Dharma', font=ImageFont.truetype(DISP, 76), fill=(243, 233, 215))
d.text((562, 305), 'Free, simple tools for daily', font=ImageFont.truetype(UI, 40), fill=(203, 187, 159))
d.text((562, 355), 'Buddhist practice', font=ImageFont.truetype(UI, 40), fill=(203, 187, 159))
d.text((562, 440), 'Meditation timer · mala counter · calendar', font=ImageFont.truetype(UI, 28), fill=(151, 135, 112))
card.convert('RGB').save(os.path.join(ROOT, 'og-image.png'), optimize=True); print('wrote og-image.png')
