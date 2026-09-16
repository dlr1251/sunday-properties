-- Example: seed nearby POIs for another listing later.
-- Copy this pattern; do not invent a dedicated table unless you need shared POIs.
--
-- UPDATE public.properties
-- SET nearby_places = '[
--   {
--     "id": "example-park",
--     "name": "Parque ejemplo",
--     "category": "parks",
--     "lat": 6.2458,
--     "lng": -75.5942,
--     "note": "8 min a pie"
--   }
-- ]'::jsonb
-- WHERE slug = 'casa-lauret';
--
-- Valid categories: parks, transit, health, commerce, universities, landmarks.

SELECT id, slug, jsonb_array_length(nearby_places) AS poi_count
FROM public.properties
WHERE jsonb_array_length(nearby_places) > 0
ORDER BY slug;
