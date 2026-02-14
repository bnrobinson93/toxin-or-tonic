interface StateBoundingBox {
  stateCode: string;
  stateName: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const stateBoundingBoxes: StateBoundingBox[] = [
  { stateCode: "AL", stateName: "Alabama", minLat: 30.1375, maxLat: 35.008, minLng: -88.4732, maxLng: -84.8882 },
  { stateCode: "AK", stateName: "Alaska", minLat: 51.2097, maxLat: 71.3898, minLng: -179.1489, maxLng: 179.7785 },
  { stateCode: "AZ", stateName: "Arizona", minLat: 31.3322, maxLat: 37.0043, minLng: -114.8126, maxLng: -109.0452 },
  { stateCode: "AR", stateName: "Arkansas", minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6444 },
  { stateCode: "CA", stateName: "California", minLat: 32.5343, maxLat: 42.0095, minLng: -124.4096, maxLng: -114.1312 },
  { stateCode: "CO", stateName: "Colorado", minLat: 36.9924, maxLat: 41.0034, minLng: -109.0603, maxLng: -102.0415 },
  { stateCode: "CT", stateName: "Connecticut", minLat: 40.9509, maxLat: 42.0506, minLng: -73.7278, maxLng: -71.7868 },
  { stateCode: "DE", stateName: "Delaware", minLat: 38.4513, maxLat: 39.8394, minLng: -75.789, maxLng: -75.0488 },
  { stateCode: "FL", stateName: "Florida", minLat: 24.3963, maxLat: 31.0009, minLng: -87.6349, maxLng: -80.0314 },
  { stateCode: "GA", stateName: "Georgia", minLat: 30.3558, maxLat: 35.0008, minLng: -85.6052, maxLng: -80.7514 },
  { stateCode: "HI", stateName: "Hawaii", minLat: 18.9106, maxLat: 22.2356, minLng: -160.2471, maxLng: -154.8066 },
  { stateCode: "ID", stateName: "Idaho", minLat: 41.9871, maxLat: 49.0011, minLng: -117.243, maxLng: -111.0435 },
  { stateCode: "IL", stateName: "Illinois", minLat: 36.9703, maxLat: 42.5083, minLng: -91.513, maxLng: -87.0199 },
  { stateCode: "IN", stateName: "Indiana", minLat: 37.7717, maxLat: 41.7607, minLng: -88.0997, maxLng: -84.7846 },
  { stateCode: "IA", stateName: "Iowa", minLat: 40.3756, maxLat: 43.5012, minLng: -96.6397, maxLng: -90.1401 },
  { stateCode: "KS", stateName: "Kansas", minLat: 36.9930, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
  { stateCode: "KY", stateName: "Kentucky", minLat: 36.4971, maxLat: 39.1474, minLng: -89.5715, maxLng: -81.9645 },
  { stateCode: "LA", stateName: "Louisiana", minLat: 28.9210, maxLat: 33.0195, minLng: -94.0431, maxLng: -88.8171 },
  { stateCode: "ME", stateName: "Maine", minLat: 42.9776, maxLat: 47.4595, minLng: -71.0839, maxLng: -66.9499 },
  { stateCode: "MD", stateName: "Maryland", minLat: 37.9117, maxLat: 39.7231, minLng: -79.4877, maxLng: -75.0488 },
  { stateCode: "MA", stateName: "Massachusetts", minLat: 41.2371, maxLat: 42.8867, minLng: -73.5081, maxLng: -69.9286 },
  { stateCode: "MI", stateName: "Michigan", minLat: 41.6961, maxLat: 48.3060, minLng: -90.4184, maxLng: -82.1228 },
  { stateCode: "MN", stateName: "Minnesota", minLat: 43.4994, maxLat: 49.3844, minLng: -97.2392, maxLng: -89.4919 },
  { stateCode: "MS", stateName: "Mississippi", minLat: 30.1738, maxLat: 34.9960, minLng: -91.6550, maxLng: -88.0980 },
  { stateCode: "MO", stateName: "Missouri", minLat: 35.9957, maxLat: 40.6135, minLng: -95.7747, maxLng: -89.0988 },
  { stateCode: "MT", stateName: "Montana", minLat: 44.3582, maxLat: 49.0014, minLng: -116.0492, maxLng: -104.0395 },
  { stateCode: "NE", stateName: "Nebraska", minLat: 39.9999, maxLat: 43.0017, minLng: -104.0535, maxLng: -95.3080 },
  { stateCode: "NV", stateName: "Nevada", minLat: 35.0018, maxLat: 42.0022, minLng: -120.0064, maxLng: -114.0396 },
  { stateCode: "NH", stateName: "New Hampshire", minLat: 42.6970, maxLat: 45.3055, minLng: -72.5572, maxLng: -70.7030 },
  { stateCode: "NJ", stateName: "New Jersey", minLat: 38.9285, maxLat: 41.3574, minLng: -75.5599, maxLng: -73.8939 },
  { stateCode: "NM", stateName: "New Mexico", minLat: 31.3322, maxLat: 37.0003, minLng: -109.0502, maxLng: -103.0006 },
  { stateCode: "NY", stateName: "New York", minLat: 40.4961, maxLat: 45.0159, minLng: -79.7624, maxLng: -71.8563 },
  { stateCode: "NC", stateName: "North Carolina", minLat: 33.8424, maxLat: 36.5882, minLng: -84.3219, maxLng: -75.4601 },
  { stateCode: "ND", stateName: "North Dakota", minLat: 45.9350, maxLat: 49.0007, minLng: -104.0489, maxLng: -96.5543 },
  { stateCode: "OH", stateName: "Ohio", minLat: 38.4032, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5189 },
  { stateCode: "OK", stateName: "Oklahoma", minLat: 33.6158, maxLat: 37.0024, minLng: -103.0026, maxLng: -94.4312 },
  { stateCode: "OR", stateName: "Oregon", minLat: 41.9918, maxLat: 46.2920, minLng: -124.5662, maxLng: -116.4635 },
  { stateCode: "PA", stateName: "Pennsylvania", minLat: 39.7199, maxLat: 42.2698, minLng: -80.5210, maxLng: -74.6895 },
  { stateCode: "RI", stateName: "Rhode Island", minLat: 41.1462, maxLat: 42.0189, minLng: -71.8626, maxLng: -71.1204 },
  { stateCode: "SC", stateName: "South Carolina", minLat: 32.0346, maxLat: 35.2155, minLng: -83.3539, maxLng: -78.5413 },
  { stateCode: "SD", stateName: "South Dakota", minLat: 42.4799, maxLat: 45.9454, minLng: -104.0578, maxLng: -96.4364 },
  { stateCode: "TN", stateName: "Tennessee", minLat: 34.9829, maxLat: 36.6781, minLng: -90.3103, maxLng: -81.6469 },
  { stateCode: "TX", stateName: "Texas", minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5083 },
  { stateCode: "UT", stateName: "Utah", minLat: 36.9979, maxLat: 42.0014, minLng: -114.0529, maxLng: -109.0416 },
  { stateCode: "VT", stateName: "Vermont", minLat: 42.7269, maxLat: 45.0166, minLng: -73.4381, maxLng: -71.4653 },
  { stateCode: "VA", stateName: "Virginia", minLat: 36.5408, maxLat: 39.4660, minLng: -83.6754, maxLng: -75.2422 },
  { stateCode: "WA", stateName: "Washington", minLat: 45.5435, maxLat: 49.0024, minLng: -124.7631, maxLng: -116.9160 },
  { stateCode: "WV", stateName: "West Virginia", minLat: 37.2016, maxLat: 40.6388, minLng: -82.6448, maxLng: -77.7190 },
  { stateCode: "WI", stateName: "Wisconsin", minLat: 42.4919, maxLat: 47.0805, minLng: -92.8894, maxLng: -86.2498 },
  { stateCode: "WY", stateName: "Wyoming", minLat: 40.9949, maxLat: 45.0036, minLng: -111.0568, maxLng: -104.0522 },
];

function distanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

export function stateFromCoordinates(
  lat: number,
  lng: number
): { stateCode: string; stateName: string } | null {
  const matches: StateBoundingBox[] = [];

  for (const state of stateBoundingBoxes) {
    // Alaska's bounding box crosses the antimeridian, handle separately
    if (state.stateCode === "AK") {
      if (lat >= state.minLat && lat <= state.maxLat) {
        // Alaska spans from negative longitude across the antimeridian to positive
        if (lng >= state.minLng || lng <= state.maxLng) {
          matches.push(state);
        }
      }
      continue;
    }

    if (
      lat >= state.minLat &&
      lat <= state.maxLat &&
      lng >= state.minLng &&
      lng <= state.maxLng
    ) {
      matches.push(state);
    }
  }

  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return { stateCode: matches[0].stateCode, stateName: matches[0].stateName };
  }

  // Multiple matches: pick the state whose bounding box center is closest
  let closest = matches[0];
  let closestDist = Infinity;

  for (const state of matches) {
    const centerLat = (state.minLat + state.maxLat) / 2;
    const centerLng = (state.minLng + state.maxLng) / 2;
    const dist = distanceSquared(lat, lng, centerLat, centerLng);
    if (dist < closestDist) {
      closestDist = dist;
      closest = state;
    }
  }

  return { stateCode: closest.stateCode, stateName: closest.stateName };
}
