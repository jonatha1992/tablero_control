from PIL import Image, ImageDraw, ImageFilter
import os

def remove_background_floodfill(input_path, output_path):
    print(f"Aggressive cleaning: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Creamos una máscara de transparencia
    # Empezamos con todo opaco
    mask = Image.new('L', (width, height), 255)
    
    # Flood fill desde las esquinas para detectar el fondo (blanco)
    # Tolerancia para variaciones de color (sombras/glows)
    tolerance = 50
    
    # Rellenamos la máscara con 0 (transparente) empezando desde los bordes
    # Esto detectará todo lo conectado a los bordes que sea "casi blanco"
    target_color = (255, 255, 255, 255)
    
    # Intentamos flood fill en los 4 bordes
    for x in [0, width-1]:
        for y in [0, height-1]:
            # Solo si el pixel de origen es claro
            p = img.getpixel((x, y))
            if p[0] > 200 and p[1] > 200 and p[2] > 200:
                ImageDraw.floodfill(img, (x, y), (255, 255, 255, 0), thresh=tolerance)

    # Ahora convertimos todos los pixeles que quedaron con Alpha 0 a la máscara
    img.save(output_path, "PNG")
    
    # Recorte final para que el logo se vea "más grande" (quita espacio vacío)
    img_cropped = Image.open(output_path)
    bbox = img_cropped.getbbox()
    if bbox:
        img_cropped = img_cropped.crop(bbox)
        img_cropped.save(output_path, "PNG")
        print(f"Final crop: {bbox}")

    print(f"Cleanup finished. Saved to: {output_path}")

# Paths
user_upload = "C:/Users/PC-ASUS/.gemini/antigravity/brain/fa0df81f-a0f4-4ae1-aec1-13845e8f2adb/media__1776872093866.png"
logo_path = "e:/tablero_control/public/logo.png"
app_icon_path = "e:/tablero_control/src/app/icon.png"

if os.path.exists(user_upload):
    remove_background_floodfill(user_upload, logo_path)
    remove_background_floodfill(user_upload, app_icon_path)
else:
    print(f"Error: {user_upload} not found")
