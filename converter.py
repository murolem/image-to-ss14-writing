from PIL import Image
from sys import argv

shadeBlocks = ["░░", "▒▒", "▓▓", "██"]

IMAGEPATH = argv[1]

# Open the image in RGBA mode and output file
with Image.open(IMAGEPATH).convert("RGBA") as image, open(IMAGEPATH + ".txt", "wt", encoding="UTF8") as file:
    lastpixel = (0,0,0)
    for y in range(image.height):
        for x in range(image.width):
            # Get the pixel color
            R, G, B, A = image.getpixel((x, y))

            # If this pixel color is different from the last pixel, it to the new color
            if (R, G, B) != lastpixel:
                print(f"[color=#{R:02X}{G:02X}{B:02X}]", end="", file=file)
                lastpixel = (R, G, B)
            
            # Select a shade that matches
            shadeIndex = int(A / (256 / len(shadeBlocks)))
            print(shadeBlocks[shadeIndex], end="", file=file)
        
        # End each row with a newline
        print(file=file)
    print("[/color]", file=file)
    print("Saved output as", file.name)