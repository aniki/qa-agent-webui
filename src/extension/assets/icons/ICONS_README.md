# Extension Icons

This folder should contain the following icon files:

- `icon-16.png` - 16x16 pixels (toolbar, favicon)
- `icon-48.png` - 48x48 pixels (extensions page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store, notifications)

## Design Guidelines

- Use a simple, recognizable design
- Works well on both light and dark backgrounds
- Recommended: Use the Accor brand colors or a test-tube/beaker icon

## Quick Generation

You can generate placeholder icons using ImageMagick:

```bash
# Generate placeholder icons with a colored background
convert -size 16x16 xc:#2d2d5f icon-16.png
convert -size 48x48 xc:#2d2d5f icon-48.png
convert -size 128x128 xc:#2d2d5f icon-128.png
```

Or create proper icons using Figma, Sketch, or any design tool.
