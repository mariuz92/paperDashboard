export const EUROPE_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 71.0, // Northernmost latitude of Europe
  south: 34.5, // Southernmost latitude
  west: -25.0, // Westernmost longitude
  east: 45.0, // Easternmost longitude
};

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
