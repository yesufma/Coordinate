// ----------------------
// Ellipsoid Definitions
// ----------------------
const ELLIPSOIDS = {
  WGS84: {
    a: 6378137.0,
    f: 1 / 298.257223563,
  },
  Adindan: {
    a: 6378249.145, // Clarke 1880 (RGS)
    f: 1 / 293.465,
  },
};

// ----------------------
// Datum Transformation Parameters
// ----------------------
// Proj4 for Adindan / UTM zone 37N uses: +towgs84=-166,-15,204,0,0,0,0
const DATUM_TRANSFORMS = {
  // To go from WGS84 to Adindan, use the inverse of towgs84:
  WGS84_to_ADINDAN: {
    dx: 166,
    dy: 15,
    dz: -204,
    rx: 0,
    ry: 0,
    rz: 0,
    s: 0,
  },
  // To go from Adindan to WGS84, use the proj4 towgs84 parameters directly:
  ADINDAN_to_WGS84: {
    dx: -166,
    dy: -15,
    dz: 204,
    rx: 0,
    ry: 0,
    rz: 0,
    s: 0,
  },
};

// ----------------------
// Helper Functions
// ----------------------
function getEllipsoid(datum) {
  const normalized = datum.trim().toUpperCase();
  if (normalized === "WGS84") return ELLIPSOIDS.WGS84;
  if (normalized === "ADINDAN") return ELLIPSOIDS.Adindan;
  console.warn(`Unknown datum: ${datum}, using WGS84 as fallback`);
  return ELLIPSOIDS.WGS84;
}

function dmsToDecimal(deg, min, sec, dir) {
  const decimal = deg + min / 60 + sec / 3600;
  return ["S", "W"].includes(dir.toUpperCase()) ? -decimal : decimal;
}

function decimalToDMS(decimal, isLatitude) {
  const absVal = Math.abs(decimal);
  const degrees = Math.floor(absVal);
  const minutes = Math.floor((absVal - degrees) * 60);
  const seconds = (absVal - degrees - minutes / 60) * 3600;
  const direction = isLatitude ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";
  return { degrees, minutes, seconds, direction };
}

// ----------------------
// Geodetic to ECEF (with optional height)
// ----------------------
function geodeticToECEF(lat, lon, ellipsoid, h = 0) {
  const { a, f } = ellipsoid;
  const e2 = 2 * f - f * f;
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
  const x = (N + h) * Math.cos(φ) * Math.cos(λ);
  const y = (N + h) * Math.cos(φ) * Math.sin(λ);
  const z = (N * (1 - e2) + h) * Math.sin(φ);
  return { x, y, z };
}

// ----------------------
// ECEF to Geodetic
// ----------------------
function ecefToGeodetic(x, y, z, ellipsoid) {
  const { a, f } = ellipsoid;
  const b = a * (1 - f);
  const e2 = (a ** 2 - b ** 2) / a ** 2;
  const p = Math.sqrt(x * x + y * y);
  let φ = Math.atan2(z, p * (1 - e2));
  let h = 0;
  
  // Iterative refinement
  for (let i = 0; i < 5; i++) {
    const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
    h = p / Math.cos(φ) - N;
    φ = Math.atan2(z, p * (1 - (e2 * N) / (N + h)));
  }
  
  const lat = (φ * 180) / Math.PI;
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  return { lat, lon, height: h };
}

function multiplyMatrixVector(matrix, vector) {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

// ----------------------
// Helmert Transformation
// ----------------------
function applyHelmertTransform(x, y, z, params) {
  const s = 1 + params.s / 1e6;
  const { dx, dy, dz, rx, ry, rz } = params;
  const R = [
    [1, -rz, ry],
    [rz, 1, -rx],
    [-ry, rx, 1],
  ];
  const vec = [s * x, s * y, s * z];
  const rotated = multiplyMatrixVector(R, vec);
  return {
    x: rotated[0] + dx,
    y: rotated[1] + dy,
    z: rotated[2] + dz,
  };
}

// ----------------------
// UTM Conversions
// ----------------------
// The formulas below are standard; for zone 37 the natural origin longitude will be 39°E,
// which matches the provided Adindan / UTM zone 37N definition.
function utmToDecimal(easting, northing, zone, hemisphere, ellipsoid) {
  const k0 = 0.9996;
  const { a, f } = ellipsoid;
  const e2 = 2 * f - f * f;
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  
  const M = (northing - (hemisphere === "S" ? 10000000 : 0)) / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
  
  const φ1 = mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu);
  
  const cosφ1 = Math.cos(φ1);
  const sinφ1 = Math.sin(φ1);
  const tanφ1 = Math.tan(φ1);
  
  const N1 = a / Math.sqrt(1 - e2 * sinφ1 ** 2);
  const T1 = tanφ1 ** 2;
  const C1 = (e2 * cosφ1 ** 2) / (1 - e2);
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sinφ1 ** 2, 1.5);
  const D = (easting - 500000) / (N1 * k0);
  
  const φ = φ1 - ((N1 * tanφ1) / R1) *
    (D ** 2 / 2 -
      ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e2) * D ** 4) / 24 +
      ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * e2 - 3 * C1 ** 2) * D ** 6) / 720);
  
  const λ0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;
  const λ = λ0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e2 + 24 * T1 ** 2) * D ** 5) / 120) /
    cosφ1;
  
  return {
    latitude: φ * (180 / Math.PI),
    longitude: λ * (180 / Math.PI),
  };
}

function decimalToUTM(lat, lon, ellipsoid) {
  const k0 = 0.9996;
  // For most systems the zone is computed automatically.
  // For Adindan/UTM zone 37N, the zone should be forced to 37 if needed.
  let zone = Math.floor((lon + 180) / 6) + 1;
  if (getEllipsoid("Adindan") === ellipsoid) {
    zone = 37; // Force UTM zone 37 for Adindan if that is desired.
  }
  
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const λ0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;
  
  const { a, f } = ellipsoid;
  const e2 = 2 * f - f * f;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  
  const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
  const T = Math.tan(φ) ** 2;
  const C = (e2 * Math.cos(φ) ** 2) / (1 - e2);
  const A = Math.cos(φ) * (λ - λ0);
  
  const M = a * (
    (1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * φ -
    ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * φ) +
    ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * φ) -
    ((35 * e6) / 3072) * Math.sin(6 * φ)
  );
  
  const easting = k0 * N * (
    A +
    ((1 - T + C) * Math.pow(A, 3)) / 6 +
    ((5 - 18 * T + T * T + 72 * C - 58 * e2) * Math.pow(A, 5)) / 120
  ) + 500000;
  
  let northing = k0 * (
    M +
    N * Math.tan(φ) * (
      (A ** 2) / 2 +
      ((5 - T + 9 * C + 4 * C ** 2) * Math.pow(A, 4)) / 24 +
      ((61 - 58 * T + T ** 2 + 600 * C - 330 * e2) * Math.pow(A, 6)) / 720
    )
  );
  
  if (lat < 0) {
    northing += 10000000;
  }
  
  return { easting, northing, zone, hemisphere: lat >= 0 ? "N" : "S" };
}

// ----------------------
// Main Conversion Function
// ----------------------
export function convertCoordinates(input) {
  try {
    let decimal = { latitude: 0, longitude: 0 };
  
    // Convert input to decimal degrees
    if (input.type === "decimal") {
      decimal = { latitude: input.latitude, longitude: input.longitude };
    } else if (input.type === "dms") {
      decimal = {
        latitude: dmsToDecimal(input.latDegrees, input.latMinutes, input.latSeconds, input.latDirection),
        longitude: dmsToDecimal(input.longDegrees, input.longMinutes, input.longSeconds, input.longDirection),
      };
    } else if (input.type === "utm") {
      // Use the provided datum (e.g. "Adindan") to select the ellipsoid
      const ellipsoid = getEllipsoid(input.datum);
      decimal = utmToDecimal(input.easting, input.northing, input.zone, input.hemisphere, ellipsoid);
    }
  
    let transformedDecimal = { ...decimal };
  
    // Perform datum transformation if source and target datums differ
    if (input.datum.trim().toUpperCase() !== input.targetDatum.trim().toUpperCase()) {
      const sourceEllipsoid = getEllipsoid(input.datum);
      const targetEllipsoid = getEllipsoid(input.targetDatum);
  
      const ecef = geodeticToECEF(decimal.latitude, decimal.longitude, sourceEllipsoid, 0);
  
      let transformKey = `${input.datum.trim().toUpperCase()}_to_${input.targetDatum.trim().toUpperCase()}`;
      let transform = DATUM_TRANSFORMS[transformKey];
  
      if (!transform) {
        transformKey = `${input.targetDatum.trim().toUpperCase()}_to_${input.datum.trim().toUpperCase()}`;
        transform = DATUM_TRANSFORMS[transformKey];
        if (transform) {
          transform = {
            dx: -transform.dx,
            dy: -transform.dy,
            dz: -transform.dz,
            rx: -transform.rx,
            ry: -transform.ry,
            rz: -transform.rz,
            s: -transform.s,
          };
        } else {
          console.warn(`No transformation found between ${input.datum} and ${input.targetDatum}. Using identity transformation.`);
          transform = { dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0, s: 0 };
        }
      }
  
      const transformedECEF = applyHelmertTransform(ecef.x, ecef.y, ecef.z, transform);
      const result = ecefToGeodetic(transformedECEF.x, transformedECEF.y, transformedECEF.z, targetEllipsoid);
      transformedDecimal = { latitude: result.lat, longitude: result.lon };
    }
  
    // Generate outputs in decimal, DMS, and UTM
    const dmsLat = decimalToDMS(transformedDecimal.latitude, true);
    const dmsLon = decimalToDMS(transformedDecimal.longitude, false);
    const targetEllipsoid = getEllipsoid(input.targetDatum);
    const utmCoords = decimalToUTM(transformedDecimal.latitude, transformedDecimal.longitude, targetEllipsoid);
  
    return {
      decimal: transformedDecimal,
      dms: {
        latDegrees: dmsLat.degrees,
        latMinutes: dmsLat.minutes,
        latSeconds: dmsLat.seconds,
        latDirection: dmsLat.direction,
        longDegrees: dmsLon.degrees,
        longMinutes: dmsLon.minutes,
        longSeconds: dmsLon.seconds,
        longDirection: dmsLon.direction,
      },
      utm: utmCoords,
    };
  } catch (error) {
    console.error("Error in coordinate conversion:", error);
    return {
      decimal: { latitude: 0, longitude: 0 },
      dms: { latDegrees: 0, latMinutes: 0, latSeconds: 0, latDirection: "N", longDegrees: 0, longMinutes: 0, longSeconds: 0, longDirection: "E" },
      utm: { easting: 500000, northing: 0, zone: 31, hemisphere: "N" },
    };
  }
}
