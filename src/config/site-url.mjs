export const SECURENT_BASE_URL = "https://cmsexternal.nt.gov.au/securent";

export function secureNTUrl(path) {
  return new URL(path.replace(/^\/+/, ""), `${SECURENT_BASE_URL}/`).href;
}
