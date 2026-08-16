"""
Generate app icons from the transparent logo version.
Adds a white background behind the transparent logo for app icon formats that need it.
"""
from PIL import Image
import os

SRC = "branding/nisos-logo-transparent.png"
OUT_DIR = "public/icons"

MASTER_SIZE = 1024
SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]

os.makedirs(OUT_DIR, exist_ok=True)

# Load transparent logo
transparent = Image.open(SRC).convert("RGBA")
print(f"Source: {transparent.size} {transparent.mode}")

# For regular app icons: put the transparent logo on a WHITE background
# (so it works on any home screen)
background_color = (255, 255, 255)  # White

# Create master icon
background = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), background_color + (255,))
logo = transparent.resize((MASTER_SIZE, MASTER_SIZE), Image.LANCZOS)
background.paste(logo, (0, 0), logo)  # Paste using logo's alpha as mask
master = background.convert("RGB")  # Remove alpha for storage

for size in SIZES:
    resized = master.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f"icon-{size}.png"))
    print(f"  icon-{size}.png")

# apple-touch-icon: white background
master.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

# Maskable icons: transparent logo on its own (no background)
# Scales to 72% with white padding
SAFE_SCALE = 0.72
for size in MASKABLE_SIZES:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    inner = int(size * SAFE_SCALE)
    # Use the transparent logo directly
    art = transparent.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(art, (offset, offset), art)
    canvas.convert("RGB").save(os.path.join(OUT_DIR, f"maskable-{size}.png"))
    print(f"  maskable-{size}.png")

# favicon.ico: white background
favicon_sizes = [16, 32, 48]
master.save(
    os.path.join("public", "favicon.ico"),
    sizes=[(s, s) for s in favicon_sizes],
)
print("favicon.ico")

print("Done!")
