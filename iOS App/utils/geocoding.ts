import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey as string;
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodingResult {
  placeName: string;
  address?: string;
  houseNumber?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query.trim() || !GOOGLE_API_KEY) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `${GEOCODING_URL}?address=${encoded}&key=${GOOGLE_API_KEY}&language=it&components=country:IT`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (data.status !== 'OK' || !data.results) return [];
    return data.results.slice(0, 6).map(parseGeocodeResult);
  } catch {
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
  if (!GOOGLE_API_KEY) return null;

  const url = `${GEOCODING_URL}?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=it`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    return parseGeocodeResult(data.results[0]);
  } catch {
    return null;
  }
}

function parseGeocodeResult(result: any): GeocodingResult {
  const location = result.geometry?.location;

  let city = '';
  let street = '';
  let houseNumber = '';

  if (result.address_components) {
    for (const comp of result.address_components) {
      if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_3')) {
        city = comp.long_name;
      }
      if (comp.types.includes('route')) {
        street = comp.long_name;
      }
      if (comp.types.includes('street_number')) {
        houseNumber = comp.long_name;
      }
    }
  }

  return {
    placeName: result.formatted_address || '',
    address: result.formatted_address || street || '',
    houseNumber,
    city: city || 'Catania',
    latitude: location?.lat || 0,
    longitude: location?.lng || 0,
  };
}
