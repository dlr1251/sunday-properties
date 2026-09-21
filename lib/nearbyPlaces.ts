export const NEARBY_PLACE_CATEGORIES = [
  'parks',
  'transit',
  'health',
  'commerce',
  'universities',
  'landmarks',
] as const;

export type NearbyPlaceCategory = (typeof NEARBY_PLACE_CATEGORIES)[number];

export interface NearbyPlace {
  id: string;
  name: string;
  category: NearbyPlaceCategory;
  lat: number;
  lng: number;
  note: string;
}

export const CATEGORY_META: Record<
  NearbyPlaceCategory,
  { label: string; color: string }
> = {
  parks: { label: 'Parques', color: '#2f8ac0' },
  transit: { label: 'Transporte', color: '#164a7b' },
  health: { label: 'Salud', color: '#1a2441' },
  commerce: { label: 'Comercio', color: '#f0a80d' },
  universities: { label: 'Universidades', color: '#3d5a80' },
  landmarks: { label: 'Sitios', color: '#c0841a' },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPropertyUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isValidCoordinates(
  coords: { lat: number; lng: number } | null | undefined
): boolean {
  if (!coords) return false;
  return (
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    !Number.isNaN(coords.lat) &&
    !Number.isNaN(coords.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180 &&
    !(coords.lat === 0 && coords.lng === 0)
  );
}

function isCategory(value: unknown): value is NearbyPlaceCategory {
  return typeof value === 'string' && (NEARBY_PLACE_CATEGORIES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseNearbyPlaces(raw: unknown): NearbyPlace[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index): NearbyPlace | null => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const lat = isFiniteNumber(row.lat) ? row.lat : Number(row.lat);
      const lng = isFiniteNumber(row.lng) ? row.lng : Number(row.lng);
      if (
        typeof row.name !== 'string' ||
        !row.name.trim() ||
        !isCategory(row.category) ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return null;
      }

      return {
        id: typeof row.id === 'string' && row.id.trim() ? row.id : `place-${index}`,
        name: row.name.trim(),
        category: row.category,
        lat,
        lng,
        note: typeof row.note === 'string' ? row.note.trim() : '',
      };
    })
    .filter((place): place is NearbyPlace => place !== null);
}

export function groupPlacesByCategory(places: NearbyPlace[]): Array<{
  category: NearbyPlaceCategory;
  places: NearbyPlace[];
}> {
  return NEARBY_PLACE_CATEGORIES
    .map((category) => ({
      category,
      places: places.filter((place) => place.category === category),
    }))
    .filter((group) => group.places.length > 0);
}
