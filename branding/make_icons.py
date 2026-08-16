"""
Crops the Nisos app-icon mockup down to the flat rounded-square artwork,
then exports the full PWA icon set (regular + maskable) at every size the
manifest and index.html reference.
"""
from PIL import Image
import os

SRC = "branding/ChatGPT Image Aug 16, 2026, 03_04_02 AM.png"
OUT_DIR = "public/icons"

# Bounding box of the flat rounded-square icon within the mockup, found by
# scanning for the hard edge between the mockup's outer background and the
# icon's own (lighter) navy background.
BOX = (203, 184, 1051, 1050)

MASTER_SIZE = 1024

SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]

os.makedirs(OUT_DIR, exist_ok=True)

src = Image.open(SRC).convert("RGB")
cropped = src.crop(BOX)
master = cropped.resize((MASTER_SIZE, MASTER_SIZE), Image.LANCZOS)
master.save(os.path.join(OUT_DIR, "_master.png"))

# Sample the icon's own background colour (just inside a corner, past the
# rounded-corner curve and any bevel highlight) to pad maskable safe zones
# with a matching colour instead of a hard edge.
bg = master.getpixel((60, 60))

for size in SIZES:
    resized = master.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f"icon-{size}.png"))

# apple-touch-icon: iOS wants a fully opaque square, no transparency, no
# pre-rounded corners (the OS applies its own mask) — our master already
# qualifies.
master.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

# Maskable icons: OS-applied masks (circle, squircle, etc.) can crop up to
# ~20% from each edge, so content must sit inside the centre "safe zone".
# Scale the artwork to 72% and centre it on a canvas filled with the icon's
# own background colour, so there's no visible seam.
SAFE_SCALE = 0.72
for size in MASKABLE_SIZES:
    canvas = Image.new("RGB", (size, size), bg)
    inner = int(size * SAFE_SCALE)
    art = master.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(art, (offset, offset))
    canvas.save(os.path.join(OUT_DIR, f"maskable-{size}.png"))

# favicon.ico: a real multi-resolution ICO, not a renamed PNG.
favicon_sizes = [16, 32, 48]
master.save(
    os.path.join("public", "favicon.ico"),
    sizes=[(s, s) for s in favicon_sizes],
)

os.remove(os.path.join(OUT_DIR, "_master.png"))
print("Done. Background colour used for maskable padding:", bg)
