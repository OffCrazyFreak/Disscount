// GRS80 ellipsoid and the EPSG:3035 (ETRS89-LAEA Europe) projection origin.
const A = 6378137;
const E2 = 0.00669438002290079;
const E = Math.sqrt(E2);
const LAT0 = (52 * Math.PI) / 180;
const LON0 = (10 * Math.PI) / 180;
const FALSE_EASTING = 4321000;
const FALSE_NORTHING = 3210000;

/** The authalic latitude function q from EPSG Guidance Note 7-2. */
function authalicQ(sinPhi: number): number {
  return (
    (1 - E2) *
    (sinPhi / (1 - E2 * sinPhi * sinPhi) -
      (1 / (2 * E)) * Math.log((1 - E * sinPhi) / (1 + E * sinPhi)))
  );
}

const QP = authalicQ(1);
const BETA0 = Math.asin(authalicQ(Math.sin(LAT0)) / QP);
const RQ = A * Math.sqrt(QP / 2);
const D =
  (A * Math.cos(LAT0)) /
  Math.sqrt(1 - E2 * Math.sin(LAT0) ** 2) /
  (RQ * Math.cos(BETA0));

/**
 * Inverse Lambert Azimuthal Equal Area (EPSG method 9820) for EPSG:3035.
 * ETRS89 and WGS84 agree to about a metre, which is fine for a map pin.
 */
export function etrs89LaeaToWgs84(
  northing: number,
  easting: number,
): { lat: number; lon: number } {
  const x = easting - FALSE_EASTING;
  const y = northing - FALSE_NORTHING;
  const rho = Math.hypot(x / D, D * y);

  if (rho === 0) {
    return { lat: (LAT0 * 180) / Math.PI, lon: (LON0 * 180) / Math.PI };
  }

  const c = 2 * Math.asin(rho / (2 * RQ));
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);

  const betaPrime = Math.asin(
    cosC * Math.sin(BETA0) + (D * y * sinC * Math.cos(BETA0)) / rho,
  );

  const lon =
    LON0 +
    Math.atan2(
      x * sinC,
      D * rho * Math.cos(BETA0) * cosC - D * D * y * Math.sin(BETA0) * sinC,
    );

  const lat =
    betaPrime +
    (E2 / 3 + (31 * E2 ** 2) / 180 + (517 * E2 ** 3) / 5040) *
      Math.sin(2 * betaPrime) +
    ((23 * E2 ** 2) / 360 + (251 * E2 ** 3) / 3780) * Math.sin(4 * betaPrime) +
    ((761 * E2 ** 3) / 45360) * Math.sin(6 * betaPrime);

  return { lat: (lat * 180) / Math.PI, lon: (lon * 180) / Math.PI };
}
