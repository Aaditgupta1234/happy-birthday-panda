from PIL import Image, ImageFilter

src_path = r"C:/Users/GANESH GUPTA/.gemini/antigravity/brain/d2f0c23a-a0c1-473c-a96c-ef88fb49ef39/.user_uploaded/media_1795427285452_9a1cbbdc.jpg"
dest_path = r"f:/birthday/assets/panda-showcase.jpg"

img = Image.open(src_path)
w, h = img.size

# Region containing top of hair down to bottom of cake plate
crop_top = 40
crop_bottom = 940
cropped = img.crop((0, crop_top, w, crop_bottom))
crop_w, crop_h = cropped.size

# Square dimension with comfortable padding so neither hair nor cake get clipped by circular border
padding = 60
square_dim = crop_h + (padding * 2)

# Ambient blurred background
bg = img.resize((square_dim, square_dim), Image.Resampling.LANCZOS)
bg = bg.filter(ImageFilter.GaussianBlur(radius=35))

# Paste sharp cropped photo centered horizontally and vertically
offset_x = (square_dim - crop_w) // 2
offset_y = padding
bg.paste(cropped, (offset_x, offset_y))

bg.save(dest_path, "JPEG", quality=96)
print(f"Perfect circle composite saved: {dest_path} ({bg.size})")
