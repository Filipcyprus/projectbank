"""
Generate app icons from the final Nisos logo (already has navy background and transparency).
"""
from PIL import Image
import os

SRC = "branding/ChatGPT Image Aug 16, 2026, 04_41_48 AM.png"
OUT_DIR = "public/icons"

MASTER_SIZE = 1024
SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]

os.makedirs(OUT_DIR, exist_ok=True)

# Load logo (already has transparency)
logo = Image.open(SRC).convert("RGBA")
print(f"Source: {logo.size}")

# Resize to master size
master = logo.resize((MASTER_SIZE, MASTER_SIZE), Image.LANCZOS)

# Generate regular icons
for size in SIZES:
    resized = master.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f"icon-{size}.png"))
    print(f"  icon-{size}.png")

# apple-touch-icon
master.save(os.path.join(OUT_DIR, "apple-touch-icon.png"))
print("  apple-touch-icon.png")

# Maskable icons: scale to 72% and pad with white
SAFE_SCALE = 0.72
for size in MASKABLE_SIZES:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    inner = int(size * SAFE_SCALE)
    art = master.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(art, (offset, offset), art)
    canvas.save(os.path.join(OUT_DIR, f"maskable-{size}.png"))
    print(f"  maskable-{size}.png")

# favicon.ico
favicon_sizes = [16, 32, 48]
master.save(
    os.path.join("public", "favicon.ico"),
    sizes=[(s, s) for s in favicon_sizes],
)
print("  favicon.ico")

print("Done!")
