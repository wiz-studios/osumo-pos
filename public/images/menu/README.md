# Menu Images Directory

This directory contains all menu item images for your POS system.

## Image Naming Convention

All images should match the filenames used in the database `image_url` field:

- `maharagwe.jpg`
- `vegetable-pilau.jpg`
- `ugali-pumpkin-leaves.jpg`
- `ndengu-stew.jpg`
- `goat-chops.jpg`
- `kachumbari.jpg`
- `extra-ugali.jpg`
- `chips.jpg`
- `beef-sambusa.jpg`
- `coke-500ml.jpg`
- `mango-juice.jpg`
- `chai.jpg`
- `stoney-tangawizi.jpg`
- `mandazi-chai.jpg`
- `chapati-beans.jpg`
- `boiled-eggs-bread.jpg`
- `beef-stew-rice.jpg`
- `githeri.jpg`
- `pilau.jpg`
- `ugali-sukuma.jpg`
- `fish-curry-chapati.jpg`

## How to Add Images

1. Copy your image files into this directory (`public/images/menu/`)
2. Make sure the filenames match exactly (case-sensitive)
3. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
4. Recommended size: 800x600px or similar aspect ratio
5. After adding images, restart your Next.js dev server if needed

## Image URLs in Database

The database stores image URLs in the format: `/images/menu/{filename}`

Next.js automatically serves files from the `public` directory, so `/images/menu/maharagwe.jpg` will be accessible at `http://your-domain/images/menu/maharagwe.jpg`

## Verification

After adding images and running the SQL update script (`scripts/012_update_menu_item_images.sql`), you can verify images are working by:

1. Going to the Menu Management page (`/dashboard/menu`)
2. Checking that menu items display their images
3. If images don't show, check:
   - Filenames match exactly (including case)
   - Images are in this directory
   - Database `image_url` field matches the filename
   - Browser console for 404 errors

