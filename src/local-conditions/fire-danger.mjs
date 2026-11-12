export const FIRE_DANGER_URL = "https://cmsexternal.nt.gov.au/securent/_design/integrations/fire-danger-ratings";

export const FIRE_AREA_CODES = {
  darwin: "NT_FW001",
  palmerston: "NT_FW001",
  "alice-springs": "NT_FW014",
  katherine: "NT_FW007",
  "tennant-creek": "NT_FW012",
  nhulunbuy: "NT_FW006",
  yulara: "NT_FW018",
};

const FIRE_LEVELS = ["No Rating", "Moderate", "High", "Extreme", "Catastrophic"];

export function readFireDanger(feed, areaCode) {
  if (!feed || !Array.isArray(feed.warnings)) return null;
  const warning = feed.warnings.find((item) => item?.area_code === areaCode);
  if (!warning) return null;

  const severity = warning.severity_code || warning.severity_name;
  const level = FIRE_LEVELS.findIndex((value) =>
    severity?.toLowerCase() === value.toLowerCase(),
  );
  if (level < 0) return null;

  const issuedAt = typeof warning.issuetime === "string" && Number.isFinite(Date.parse(warning.issuetime))
    ? warning.issuetime
    : null;
  return { label: FIRE_LEVELS[level], level, issuedAt };
}