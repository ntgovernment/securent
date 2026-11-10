const warningLevelSlugs = new Map([
  ["Advice", "advice"],
  ["Watch and act", "watch_act"],
  ["Emergency warning", "emergency_warning"],
]);

const hazardTypeSlugs = new Map([
  ["Bushfire", "fire"],
  ["Cyclone", "cyclone"],
  ["Flooding", "flood"],
  ["Storm", "storm"],
  ["Heatwave", "heat"],
]);

export function warningLevelSlug(warningLevel) {
  return warningLevelSlugs.get(warningLevel) || "not-identified";
}

export function awsHazardIconFilename(emergencyTypes, warningLevel) {
  const level = warningLevelSlugs.get(warningLevel);
  const emergencyType = emergencyTypes.find((type) => type !== "Not identified");
  if (!level || !emergencyType) return "";

  const hazard = hazardTypeSlugs.get(emergencyType) || "other";
  return `${hazard}-${level}.webp`;
}