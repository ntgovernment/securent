function ringPosition(ring, longitude, latitude) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1, y1] = ring[previous];
    const [x2, y2] = ring[index];
    const cross = (longitude - x1) * (y2 - y1) - (latitude - y1) * (x2 - x1);
    if (Math.abs(cross) < 1e-10 &&
        longitude >= Math.min(x1, x2) - 1e-10 && longitude <= Math.max(x1, x2) + 1e-10 &&
        latitude >= Math.min(y1, y2) - 1e-10 && latitude <= Math.max(y1, y2) + 1e-10) return 0;
    if ((y1 > latitude) !== (y2 > latitude) &&
        longitude < (x2 - x1) * (latitude - y1) / (y2 - y1) + x1) inside = !inside;
  }
  return inside ? 1 : -1;
}

function polygonContains(polygon, longitude, latitude) {
  const outer = ringPosition(polygon[0], longitude, latitude);
  if (outer !== 1) return outer === 0;
  for (const hole of polygon.slice(1)) {
    const position = ringPosition(hole, longitude, latitude);
    if (position === 0) return true;
    if (position === 1) return false;
  }
  return true;
}

export function findLocality(data, latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error("Invalid device coordinates");
  }
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features) || !data.features.length) {
    throw new Error("Invalid locality boundaries");
  }
  for (const feature of data.features) {
    const geometry = feature.geometry;
    const polygons = geometry?.type === "Polygon" ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
    if (polygons.some((polygon) => polygonContains(polygon, longitude, latitude))) {
      const name = feature.properties?.loc_name;
      if (typeof name !== "string" || !name.trim()) throw new Error("Invalid locality name");
      return name.trim();
    }
  }
  return null;
}
