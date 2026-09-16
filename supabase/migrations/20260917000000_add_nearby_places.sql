-- Nearby places (POIs) for public property detail maps.
-- Choice: jsonb column on properties (not a new table).
-- Matches existing coordinates / negotiation_terms jsonb pattern,
-- inherits current properties RLS, and is easy to seed per listing.
-- Empty array = graceful empty state. Seed other slugs later with:
--   UPDATE public.properties SET nearby_places = '[...]'::jsonb WHERE slug = 'other-listing';

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS nearby_places jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.nearby_places IS
  'Array of nearby POIs: [{id, name, category, lat, lng, note}]. Categories: parks, transit, health, commerce, universities, landmarks.';

-- Seed ONLY El Escorial 701 (Amelia Patiño rental, Conquistadores).
UPDATE public.properties
SET nearby_places = $places$
[
  {
    "id": "parques-del-rio",
    "name": "Parques del Río Medellín",
    "category": "parks",
    "lat": 6.24368,
    "lng": -75.57957,
    "note": "8 min a pie"
  },
  {
    "id": "pies-descalzos",
    "name": "Parque de los Pies Descalzos",
    "category": "parks",
    "lat": 6.2442,
    "lng": -75.5768,
    "note": "12 min a pie"
  },
  {
    "id": "metro-exposiciones",
    "name": "Metro Exposiciones",
    "category": "transit",
    "lat": 6.2429,
    "lng": -75.5734,
    "note": "15 min a pie / 6 min en carro"
  },
  {
    "id": "metro-industriales",
    "name": "Metro Industriales",
    "category": "transit",
    "lat": 6.2308,
    "lng": -75.5756,
    "note": "8 min en carro"
  },
  {
    "id": "clinica-conquistadores",
    "name": "Clínica Conquistadores",
    "category": "health",
    "lat": 6.24065,
    "lng": -75.58288,
    "note": "4 min a pie"
  },
  {
    "id": "unicentro-medellin",
    "name": "Unicentro Medellín",
    "category": "commerce",
    "lat": 6.2409,
    "lng": -75.5898,
    "note": "15 min a pie / 6 min en carro"
  },
  {
    "id": "calle-33",
    "name": "Calle 33 (corredor comercial)",
    "category": "commerce",
    "lat": 6.2435,
    "lng": -75.583,
    "note": "3 min a pie"
  },
  {
    "id": "upb-laureles",
    "name": "Universidad Pontificia Bolivariana",
    "category": "universities",
    "lat": 6.2423,
    "lng": -75.5898,
    "note": "15 min a pie / 6 min en carro"
  },
  {
    "id": "universidad-de-medellin",
    "name": "Universidad de Medellín",
    "category": "universities",
    "lat": 6.2315,
    "lng": -75.6103,
    "note": "12 min en carro"
  },
  {
    "id": "cerro-nutibara",
    "name": "Cerro Nutibara",
    "category": "landmarks",
    "lat": 6.2364,
    "lng": -75.5803,
    "note": "15 min a pie / 6 min en carro"
  },
  {
    "id": "plaza-mayor",
    "name": "Plaza Mayor",
    "category": "landmarks",
    "lat": 6.2425,
    "lng": -75.5762,
    "note": "12 min a pie"
  }
]
$places$::jsonb
WHERE id = 'abd51c41-a57f-469f-8601-595d003a35c2'
   OR slug = 'el-escorial-701';
