"""
Generador de imagen placeholder para instructions.png
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_instructions_placeholder():
    """Crea una imagen placeholder para instructions.png"""
    
    # Crear imagen (300x400 pixels)
    img = Image.new('RGB', (300, 400), color='#f8f9fa')
    draw = ImageDraw.Draw(img)
    
    # Intentar cargar una fuente
    try:
        font_large = ImageFont.truetype("arial.ttf", 16)
        font_medium = ImageFont.truetype("arial.ttf", 12)
        font_small = ImageFont.truetype("arial.ttf", 10)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Dibujar bordes
    draw.rectangle([10, 10, 290, 390], outline='#dee2e6', width=2)
    
    # Título
    draw.text((150, 30), "CONFIGURACIÓN", anchor="mm", fill='#495057', font=font_large)
    draw.text((150, 50), "DE MACROS", anchor="mm", fill='#495057', font=font_large)
    
    # Icono Excel (simulado)
    draw.rectangle([125, 80, 175, 130], fill='#217346', outline='#1e6f42', width=2)
    draw.text((150, 105), "XL", anchor="mm", fill='white', font=font_large)
    
    # Pasos visuales
    steps = [
        ("1. Abrir Excel", 160),
        ("2. Archivo > Opciones", 180),
        ("3. Centro de confianza", 200),
        ("4. Configuración", 220),
        ("5. Habilitar macros", 240),
        ("6. Aceptar", 260),
        ("7. Cerrar Excel", 280)
    ]
    
    for step, y in steps:
        draw.text((20, y), step, fill='#495057', font=font_small)
        # Pequeño checkbox
        draw.rectangle([15, y-2, 18, y+1], outline='#6c757d')
    
    # Mensaje importante
    draw.text((150, 320), "⚠️ IMPORTANTE", anchor="mm", fill='#dc3545', font=font_medium)
    draw.text((150, 340), "Configurar ANTES de", anchor="mm", fill='#dc3545', font=font_small)
    draw.text((150, 355), "ejecutar valorización", anchor="mm", fill='#dc3545', font=font_small)
    
    return img

if __name__ == "__main__":
    # Crear y guardar la imagen
    img = create_instructions_placeholder()
    output_path = os.path.join(os.path.dirname(__file__), "instructions.png")
    img.save(output_path)
    print(f"✅ Imagen placeholder creada: {output_path}")