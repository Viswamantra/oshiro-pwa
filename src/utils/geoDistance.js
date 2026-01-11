/**
 * =========================================================
 * GEO DISTANCE UTILS
 * ---------------------------------------------------------
 * ✔ Calculates distance between two lat/lng points
 * ✔ Uses Haversine formula
 * ✔ Returns distance in METERS
 * ✔ Safe against null / invalid values
 * =========================================================
 */

const EARTH_RADIUS = 6371000; // meters

const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calculate distance between two geo points
 * @returns {number} distance in meters
 */
export function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== "number" ||
    typeof lng1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lng2 !== "number"
  ) {
    return Infinity;
  }

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    EARTH_RADIUS *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}
