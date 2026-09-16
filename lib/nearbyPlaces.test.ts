import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupPlacesByCategory,
  isPropertyUuid,
  isValidCoordinates,
  parseNearbyPlaces,
} from './nearbyPlaces';

describe('isPropertyUuid', () => {
  it('accepts a listing UUID', () => {
    assert.equal(isPropertyUuid('abd51c41-a57f-469f-8601-595d003a35c2'), true);
  });

  it('rejects a slug', () => {
    assert.equal(isPropertyUuid('el-escorial-701'), false);
  });
});

describe('isValidCoordinates', () => {
  it('accepts Escorial 701 coordinates', () => {
    assert.equal(isValidCoordinates({ lat: 6.2421, lng: -75.5818 }), true);
  });

  it('rejects missing or zeroed pins', () => {
    assert.equal(isValidCoordinates(null), false);
    assert.equal(isValidCoordinates({ lat: 0, lng: 0 }), false);
  });
});

describe('parseNearbyPlaces', () => {
  it('returns an empty list for missing or invalid payloads', () => {
    assert.deepEqual(parseNearbyPlaces(null), []);
    assert.deepEqual(parseNearbyPlaces(undefined), []);
    assert.deepEqual(parseNearbyPlaces({}), []);
    assert.deepEqual(parseNearbyPlaces('[]'), []);
  });

  it('keeps valid POIs and drops broken rows', () => {
    const places = parseNearbyPlaces([
      {
        id: 'parques-del-rio',
        name: 'Parques del Río Medellín',
        category: 'parks',
        lat: 6.24368,
        lng: -75.57957,
        note: '8 min a pie',
      },
      { name: 'Sin coordenadas', category: 'transit' },
      { name: 'Categoría inválida', category: 'cafes', lat: 6.24, lng: -75.58 },
    ]);

    assert.equal(places.length, 1);
    assert.equal(places[0].id, 'parques-del-rio');
    assert.equal(places[0].category, 'parks');
  });
});

describe('groupPlacesByCategory', () => {
  it('preserves Sunday category order and skips empty groups', () => {
    const groups = groupPlacesByCategory(
      parseNearbyPlaces([
        { name: 'UPB', category: 'universities', lat: 6.24, lng: -75.58 },
        { name: 'Parques del Río', category: 'parks', lat: 6.24, lng: -75.57 },
        { name: 'Metro Exposiciones', category: 'transit', lat: 6.24, lng: -75.57 },
      ])
    );

    assert.deepEqual(
      groups.map((group) => group.category),
      ['parks', 'transit', 'universities']
    );
  });
});
