-- Update beer image URLs to use local images from /images/menu/
-- Matching exact filenames from D:\Wiz dev\Osumo\public\images\menu

UPDATE menu_items
SET image_url = CASE name
    -- Tusker variants
    WHEN 'Tusker Lager' THEN '/images/menu/tusker-lager.jpg'
    WHEN 'Tusker Lite' THEN '/images/menu/tusker-lite.jpg'
    WHEN 'Tusker Malt' THEN '/images/menu/tusker-malt.jpg'
    WHEN 'Tusker Safari' THEN '/images/menu/tusker-safari.jpg'
    WHEN 'Tusker Cider' THEN '/images/menu/tusker-cider.jpg'
    
    -- Guinness variants (using guinness-fes for Foreign Extra Stout)
    WHEN 'Guinness Foreign Extra Stout' THEN '/images/menu/guinness-fes.jpg'
    WHEN 'Guinness Smooth' THEN '/images/menu/guinness-smooth.jpg'
    
    -- White Cap (using white-cap-lager, note: white-cap-can also exists)
    WHEN 'White Cap Lager' THEN '/images/menu/white-cap-lager.jpg'
    
    -- Pilsner variants
    WHEN 'Pilsner Lager' THEN '/images/menu/pilsner-lager.jpg'
    WHEN 'Pilsner Ice' THEN '/images/menu/pilsner-ice.jpg'
    
    -- Senator
    WHEN 'Senator Cold' THEN '/images/menu/senator-cold.jpg'
    
    -- Bell Lager
    WHEN 'Bell Lager' THEN '/images/menu/bell-lager.jpg'
    
    -- International brands
    WHEN 'Heineken' THEN '/images/menu/heineken.jpg'
    WHEN 'Budweiser' THEN '/images/menu/budweiser.jpg'
    
    -- Note: Corona and Smirnoff Ice images not found in directory
    -- These will keep their current Unsplash URLs unless you add the images
    WHEN 'Corona' THEN '/images/menu/corona.jpg'
    WHEN 'Smirnoff Ice' THEN '/images/menu/smirnoff-ice.jpg'
END
WHERE name IN (
    'Tusker Lager', 'Tusker Lite', 'Tusker Malt', 'Tusker Safari', 'Tusker Cider',
    'Guinness Foreign Extra Stout', 'Guinness Smooth',
    'White Cap Lager', 'Pilsner Lager', 'Pilsner Ice',
    'Senator Cold', 'Bell Lager',
    'Heineken', 'Budweiser', 'Corona', 'Smirnoff Ice'
);

-- Verify the update
SELECT 
    name, 
    image_url,
    CASE 
        WHEN image_url LIKE '/images/menu/%' THEN '✓ Local'
        ELSE '⚠ External'
    END as image_source
FROM menu_items
WHERE name IN (
    'Tusker Lager', 'Tusker Lite', 'Tusker Malt', 'Tusker Safari', 'Tusker Cider',
    'Guinness Foreign Extra Stout', 'Guinness Smooth',
    'White Cap Lager', 'Pilsner Lager', 'Pilsner Ice',
    'Senator Cold', 'Bell Lager',
    'Heineken', 'Budweiser', 'Corona', 'Smirnoff Ice'
)
ORDER BY name;
