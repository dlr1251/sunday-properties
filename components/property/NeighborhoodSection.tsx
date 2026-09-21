'use client';

import { useMemo, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CATEGORY_META,
  NEARBY_PLACE_CATEGORIES,
  groupPlacesByCategory,
  isValidCoordinates,
  parseNearbyPlaces,
  type NearbyPlaceCategory,
} from '@/lib/nearbyPlaces';
import { Bus, Cross, GraduationCap, Landmark, Leaf, MapPin, ShoppingBag } from 'lucide-react';

const NeighborhoodMap = dynamic(
  () => import('@/components/maps/NeighborhoodMap').then((mod) => mod.NeighborhoodMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] sm:h-[360px] lg:h-[420px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Cargando mapa...
      </div>
    ),
  }
);

const CATEGORY_ICONS: Record<NearbyPlaceCategory, ComponentType<{ className?: string }>> = {
  parks: Leaf,
  transit: Bus,
  health: Cross,
  commerce: ShoppingBag,
  universities: GraduationCap,
  landmarks: Landmark,
};

export function NeighborhoodSection({
  title,
  address,
  neighborhood,
  city,
  coordinates,
  nearbyPlaces,
}: {
  title: string;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  nearbyPlaces?: unknown;
}) {
  const [activeCategory, setActiveCategory] = useState<NearbyPlaceCategory | 'all'>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const places = useMemo(() => parseNearbyPlaces(nearbyPlaces), [nearbyPlaces]);
  const visiblePlaces = useMemo(
    () => (activeCategory === 'all' ? places : places.filter((place) => place.category === activeCategory)),
    [activeCategory, places]
  );
  const groupedPlaces = useMemo(() => groupPlacesByCategory(visiblePlaces), [visiblePlaces]);
  const hasCoordinates = isValidCoordinates(coordinates);
  const locationLabel = [neighborhood, city].filter(Boolean).join(', ') || address;

  if (!hasCoordinates && places.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-[#1a2441] mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-[#1a2441]">La zona</h2>
            {locationLabel && <p className="text-sm text-muted-foreground mt-1">{locationLabel}</p>}
            <p className="text-sm text-muted-foreground mt-3">Aún no hay un mapa para esta ficha.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-6 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#2f8ac0] font-medium">Alrededores</p>
            <h2 className="text-2xl font-semibold text-[#1a2441] mt-1">La zona</h2>
            {locationLabel && <p className="text-sm text-muted-foreground mt-1">{locationLabel}</p>}
          </div>
          {places.length > 0 && (
            <Badge variant="secondary">{places.length} lugares</Badge>
          )}
        </div>
      </div>

      {hasCoordinates && (
        <div className="px-4 pt-4 sm:px-6">
          <NeighborhoodMap
            coordinates={coordinates}
            propertyTitle={title}
            places={visiblePlaces}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1a2441]">Cerca de aquí</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Lugares útiles alrededor de la propiedad. Toca un pin o una fila para verlo en el mapa.
          </p>
        </div>

        {places.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#1a2441] text-white border-[#1a2441]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#1a2441]/40'
              }`}
            >
              Todos
            </button>
            {NEARBY_PLACE_CATEGORIES.filter((category) =>
              places.some((place) => place.category === category)
            ).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-[#1a2441] text-white border-[#1a2441]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#1a2441]/40'
                }`}
              >
                {CATEGORY_META[category].label}
              </button>
            ))}
          </div>
        )}

        {places.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg bg-slate-50 px-4 py-3">
            Aún no hay lugares cercanos cargados para esta propiedad.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedPlaces.map((group) => {
              const Icon = CATEGORY_ICONS[group.category];
              return (
                <div key={group.category} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_META[group.category].color}1A`,
                        color: CATEGORY_META[group.category].color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-[#1a2441]">{CATEGORY_META[group.category].label}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {group.places.map((place) => {
                      const selected = selectedPlaceId === place.id;
                      return (
                        <li key={place.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedPlaceId(place.id)}
                            className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${
                              selected ? 'bg-[#1a2441]/5 ring-1 ring-[#1a2441]/20' : 'hover:bg-slate-50'
                            }`}
                          >
                            <p className="text-sm font-medium">{place.name}</p>
                            {place.note && <p className="text-xs text-muted-foreground mt-0.5">{place.note}</p>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
