export const SECURENT_BASE_URL = "https://securent.nt.gov.au";

export function secureNTUrl(path) {
  return new URL(path.replace(/^\/+/, ""), `${SECURENT_BASE_URL}/`).href;
}
