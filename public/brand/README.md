# Brand Assets Directory

This directory contains client-specific brand assets. These files are protected from upstream merges via `.gitattributes`.

## Required Files

Place your client's branding files here:

- **`logo.png`** - Main logo (transparent PNG recommended, ~200-400px wide)
- **`favicon.ico`** - Browser icon (16×16, 32×32, or 48×48 pixels)
- **`og-image.jpg`** - Social media preview image (1200×630px recommended)

## Optional Files

You can also include:
- Alternative logo variations (light/dark themes)
- Touch icons for mobile devices
- Additional marketing images

## Configuration

Update the paths in `src/config/site.ts` to reference these files:

```typescript
brand: {
  logo: "/brand/logo.png",
  logoAlt: "Your Restaurant Name logo",
  favicon: "/brand/favicon.ico",
  // ...
}
```

## Important

⚠️ This entire directory is protected by `.gitattributes` with `merge=ours`. When pulling updates from the core repository, your brand assets will **never be overwritten**.
