"""
Icon Generator for TempMail Extension

This script generates extension icons in multiple sizes from a source image.

Usage:
    python generate_icons.py [source_image_path]

If no source image is provided, it will try to use '../tempmail.png'
"""

import sys
import os
from PIL import Image, ImageDraw, ImageFont

def create_default_icon(size):
    """Create a default icon if no source image is available"""
    # Create a gradient background
    img = Image.new('RGB', (size, size), color='#6366f1')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple envelope icon
    margin = size // 6
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        outline='white',
        width=max(1, size // 32)
    )
    
    # Draw envelope flap
    mid_x = size // 2
    top_y = margin
    bottom_y = size - margin
    draw.line([margin, top_y, mid_x, (top_y + bottom_y) // 2], fill='white', width=max(1, size // 32))
    draw.line([size - margin, top_y, mid_x, (top_y + bottom_y) // 2], fill='white', width=max(1, size // 32))
    
    return img

def generate_icons(source_path=None):
    """Generate icons in multiple sizes"""
    sizes = [16, 32, 48, 128]
    output_dir = os.path.join(os.path.dirname(__file__), 'icons')
    
    # Create icons directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Try to load source image
    source_img = None
    if source_path and os.path.exists(source_path):
        try:
            source_img = Image.open(source_path)
            print(f"✓ Loaded source image: {source_path}")
        except Exception as e:
            print(f"✗ Error loading source image: {e}")
    
    # If no source image, try default paths
    if not source_img:
        default_paths = ['../tempmail.png', 'tempmail.png', '../favicon.ico']
        for path in default_paths:
            if os.path.exists(path):
                try:
                    source_img = Image.open(path)
                    print(f"✓ Loaded source image: {path}")
                    break
                except Exception as e:
                    continue
    
    # Generate icons for each size
    for size in sizes:
        output_path = os.path.join(output_dir, f'icon{size}.png')
        
        if source_img:
            # Resize source image
            try:
                # Convert to RGBA if needed
                if source_img.mode != 'RGBA':
                    img = source_img.convert('RGBA')
                else:
                    img = source_img.copy()
                
                # Resize with high-quality resampling
                img = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Save as PNG
                img.save(output_path, 'PNG')
                print(f"✓ Generated icon{size}.png")
            except Exception as e:
                print(f"✗ Error generating icon{size}.png: {e}")
        else:
            # Create default icon
            try:
                img = create_default_icon(size)
                img.save(output_path, 'PNG')
                print(f"✓ Generated default icon{size}.png")
            except Exception as e:
                print(f"✗ Error generating default icon{size}.png: {e}")
    
    print("\n✓ Icon generation complete!")
    print(f"Icons saved to: {output_dir}")

if __name__ == '__main__':
    source_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    print("=" * 50)
    print("TempMail Extension - Icon Generator")
    print("=" * 50)
    print()
    
    try:
        generate_icons(source_path)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        sys.exit(1)
    
    print("\nNext steps:")
    print("1. Review the generated icons in the icons/ folder")
    print("2. Replace with custom icons if needed")
    print("3. Load the extension in your browser to test")
