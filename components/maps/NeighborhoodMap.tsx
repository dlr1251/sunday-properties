'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CATEGORY_META, isValidCoordinates, type NearbyPlace } from '@/lib/nearbyPlaces';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const OSM_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'OSM raster',
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export interface NeighborhoodMapProps {
  coordinates?: { lat: number; lng: number } | null;
  propertyTitle: string;
  places: NearbyPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  heightClassName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createPinElement(options: {
  color: string;
  selected?: boolean;
  property?: boolean;
  label: string;
}): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', options.label);
  const size = options.property ? 22 : options.selected ? 18 : 14;
  button.style.cssText = [
    'border: 2px solid #fff',
    `background: ${options.color}`,
    `width: ${size}px`,
    `height: ${size}px`,
    'border-radius: 9999px',
    'box-shadow: 0 8px 18px rgba(26, 36, 65, 0.28)',
    'padding: 0',
    'cursor: pointer',
    options.property ? 'outline: 3px solid #f0a80d' : '',
    options.selected && !options.property ? 'outline: 2px solid #1a2441' : '',
    'transform: translateY(2px)',
  ]
    .filter(Boolean)
    .join(';');
  return button;
}

export function NeighborhoodMap({
  coordinates,
  propertyTitle,
  places,
  selectedPlaceId,
  onSelectPlace,
  heightClassName = 'h-[280px] sm:h-[360px] lg:h-[420px]',
}: NeighborhoodMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onSelectPlaceRef = useRef(onSelectPlace);
  onSelectPlaceRef.current = onSelectPlace;

  const hasValidCoordinates = isValidCoordinates(coordinates);

  useEffect(() => {
    if (!containerRef.current || !hasValidCoordinates || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [coordinates!.lng, coordinates!.lat],
      zoom: 14.2,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('error', (event) => {
      const message = String(event.error?.message || '');
      if (message.includes('openfreemap') || message.includes('Failed to fetch')) {
        map.setStyle(OSM_RASTER_STYLE);
      }
    });

    const resize = () => map.resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [hasValidCoordinates, coordinates?.lat, coordinates?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasValidCoordinates) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const propertyMarker = new maplibregl.Marker({
      element: createPinElement({
        color: '#1a2441',
        property: true,
        label: propertyTitle,
      }),
      anchor: 'center',
    })
      .setLngLat([coordinates!.lng, coordinates!.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
          `<div style="font: 600 13px Satoshi, sans-serif; color: #1a2441">${escapeHtml(propertyTitle)}</div>`
        )
      )
      .addTo(map);

    propertyMarker.getElement().addEventListener('click', () => {
      onSelectPlaceRef.current(null);
    });
    markersRef.current.push(propertyMarker);

    places.forEach((place) => {
      const marker = new maplibregl.Marker({
        element: createPinElement({
          color: CATEGORY_META[place.category].color,
          selected: selectedPlaceId === place.id,
          label: place.name,
        }),
        anchor: 'center',
      })
        .setLngLat([place.lng, place.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
            `<div style="font: 600 13px Satoshi, sans-serif; color: #1a2441">${escapeHtml(place.name)}</div>
             ${place.note ? `<div style="font: 12px Satoshi, sans-serif; color: #5b5348; margin-top: 2px">${escapeHtml(place.note)}</div>` : ''}`
          )
        )
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        onSelectPlaceRef.current(place.id);
      });
      markersRef.current.push(marker);

      if (selectedPlaceId === place.id) {
        marker.togglePopup();
      }
    });

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([coordinates!.lng, coordinates!.lat]);
    places.forEach((place) => bounds.extend([place.lng, place.lat]));
    if (places.length > 0) {
      map.fitBounds(bounds, { padding: 56, maxZoom: 15.2, duration: 400 });
    } else {
      map.easeTo({ center: [coordinates!.lng, coordinates!.lat], zoom: 14.4, duration: 300 });
    }
  }, [hasValidCoordinates, coordinates, places, selectedPlaceId, propertyTitle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceId) return;
    const selected = places.find((place) => place.id === selectedPlaceId);
    if (!selected) return;
    map.easeTo({ center: [selected.lng, selected.lat], zoom: Math.max(map.getZoom(), 14.8), duration: 350 });
  }, [selectedPlaceId, places]);

  if (!hasValidCoordinates) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${heightClassName}`}>
      <div ref={containerRef} className="absolute inset-0" data-testid="neighborhood-map" />
    </div>
  );
}
