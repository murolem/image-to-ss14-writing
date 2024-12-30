# image-to-ss14-writing
A simple python script for converting images to colored BBCode art. Intended for use in the SS14 writing system.

## Dependencies:
- Python >= 3.10
- Pillow `py -m pip install pillow`

## Usage:
Simply run the following shell command with a filepath to any image file Pillow accepts.

`py converter.py <filepath>`

The text will output to the same directory, under the same filename, appended with .txt

Do not try and use large images, this generator is intended for pixel art - at most 32 wide
