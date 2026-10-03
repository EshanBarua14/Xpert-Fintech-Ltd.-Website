# Real images for the website

Drop files here, then run `npm run assets:import`. They are added to the media library and
linked to the right record. Run `npm run assets:import -- --list` to see every key.

```
assets/
  logos/<organization-key>.png        consortium member and exchange logos
  people/<person-key>.jpg             board and management photos (portrait, 4:5 works best)
  products/<product-key>/hero.png     the main product image
  products/<product-key>/01-name.png  screenshots, shown in name order, caption from the name
```

- PNG, JPEG or WebP only. SVG is refused for security; export logos as PNG with a transparent background.
- Adding a logo here records that written permission to display it is on file.
- Use real screenshots of XFL's own products only. Hide client names, account numbers and live balances.
- Image files in this folder are not committed to git (see .gitignore); only this README is.
