import fs from 'fs';
import path from 'path';

/**
 * Helper to get environment variables with fallback checking of both
 * standard process.env, .env, and custom .enc file if present.
 */
function cleanValue(val: string): string {
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

function getEnvVariable(key: string, defaultValue: string = ''): string {
  if (process.env[key]) {
    return cleanValue(process.env[key] as string);
  }

  // Check if .enc or .env file exists in project root and parse key
  try {
    const encPath = path.resolve(process.cwd(), '.enc');
    if (fs.existsSync(encPath)) {
      const content = fs.readFileSync(encPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]?.trim()) {
        return cleanValue(match[1]);
      }
    }

    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]?.trim()) {
        return cleanValue(match[1]);
      }
    }
  } catch {
    // Silent fail in browser or restricted environment
  }

  return defaultValue;
}

export const ENV = {
  get GEMINI_API_KEY() {
    return getEnvVariable('GEMINI_API_KEY', '');
  },
  get GOOGLE_MAPS_API_KEY() {
    return getEnvVariable('GOOGLE_MAPS_API_KEY', getEnvVariable('GEMINI_API_KEY', ''));
  },
  get GOOGLE_GEOCODING_API_URL() {
    return getEnvVariable('GOOGLE_GEOCODING_API_URL', 'https://maps.googleapis.com/maps/api/geocode/json');
  },
  get GOOGLE_PLACES_API_URL() {
    return getEnvVariable('GOOGLE_PLACES_API_URL', 'https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  },
  get GOOGLE_DIRECTIONS_API_URL() {
    return getEnvVariable('GOOGLE_DIRECTIONS_API_URL', 'https://maps.googleapis.com/maps/api/directions/json');
  },
  get OVERPASS_API_URL() {
    return getEnvVariable('OVERPASS_API_URL', 'https://overpass-api.de/api/interpreter');
  },
  get NOMINATIM_API_URL() {
    return getEnvVariable('NOMINATIM_API_URL', 'https://nominatim.openstreetmap.org');
  },
  get OPEN_METEO_API_URL() {
    return getEnvVariable('OPEN_METEO_API_URL', 'https://api.open-meteo.com/v1/forecast');
  },
  get PORT() {
    return parseInt(getEnvVariable('PORT', '3000'), 10);
  }
};
