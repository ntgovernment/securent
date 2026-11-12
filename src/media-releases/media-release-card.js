import { updatedTimestamp } from "../alerts-listing/sorting.mjs";
import { awsHazardIconFilename, warningLevelSlug } from "./aws-icons.mjs";

const hazardIcons = import.meta.glob("../../assets/hazard-icons/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

function safeLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatDateTime(value) {
  const timestamp = updatedTimestamp(value);
  if (timestamp === null) return "";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Darwin",
  }).format(timestamp);
}

function hazardIconFor(item) {
  const filename = awsHazardIconFilename(item.emergencyTypes, item.warningLevel);
  if (!filename) return "";
  const assetUrl = hazardIcons[`../../assets/hazard-icons/${filename}`];
  if (!assetUrl) return "";
  if (import.meta.env.DEV) return assetUrl;
  const assetPath = assetUrl.replace(/^\//, "");
  const base = new URL(import.meta.url);
  return new URL(base.pathname.includes("/SecureNT_files/") ? `../${assetPath}` : assetPath, base).href;
}

export function renderCard(item, { compact = false } = {}) {
  const article = document.createElement("article");
  article.className = "media-releases__item";
  article.dataset.warningLevel = warningLevelSlug(item.warningLevel);
  article.dataset.declaration = item.declarations.map((declaration) => declaration.toLowerCase().replace(/\s+/g, "-")).join(" ");
  const url = safeLink(item.url);
  const cardLink = document.createElement(url ? "a" : "div");
  cardLink.className = "media-releases__link";
  if (url) {
    cardLink.href = url;
    cardLink.target = "_blank";
    cardLink.rel = "noopener noreferrer";
  }
  const content = document.createElement("div");
  content.className = "media-releases__content";

  const severity = document.createElement("span");
  severity.className = "media-releases__severity";
  const isDecreasingThreat = item.warningLevel === "Advice"
    && /\bdecreasing[\s_-]+threats?\b/i.test([item.title, item.name].filter(Boolean).join(" "));
  const isGeneralInformation = item.declarations.length
    ? item.declarations.some((declaration) => declaration !== "Planned burn advice")
    : !["Emergency warning", "Watch and act", "Advice"].includes(item.warningLevel) && !isDecreasingThreat;
  if (isGeneralInformation) article.dataset.generalInformation = "true";
  severity.textContent = item.declarations.length
    ? item.declarations.map((declaration) => declaration === "Planned burn advice" ? "Planned burn"
      : declaration === "Fire ban declaration" ? "Fire ban notice" : "General information").join(", ")
    : item.warningLevel === "Emergency warning" ? "Emergency"
      : isDecreasingThreat ? "Decreasing threat"
        : ["Advice", "Watch and act"].includes(item.warningLevel) ? item.warningLevel : "General information";

  const title = document.createElement("h2");
  title.className = "media-releases__title";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "media-releases__meta";
  const publishedAt = formatDateTime(item.publishedAt);
  if (publishedAt) {
    const dateTime = document.createElement("span");
    dateTime.className = "media-releases__date-time";
    const clock = document.createElement("i");
    clock.className = "fa-light fa-clock";
    clock.setAttribute("aria-hidden", "true");
    dateTime.append(clock, document.createTextNode(publishedAt));
    meta.append(dateTime);
  }

  const region = document.createElement("p");
  region.className = "media-releases__classification media-releases__region";
  const mapPin = document.createElement("i");
  mapPin.className = "fa-light fa-location-dot";
  mapPin.setAttribute("aria-hidden", "true");
  const regionLabel = document.createElement("span");
  regionLabel.textContent = `Region: ${item.regions.join(", ")}`;
  region.append(mapPin, regionLabel);

  const iconUrl = hazardIconFor(item);
  let icon;
  if (iconUrl) {
    icon = document.createElement("img");
    icon.className = "media-releases__hazard-icon";
    icon.src = iconUrl;
    icon.alt = "";
    article.classList.add("media-releases__item--with-icon");
    if (!compact) cardLink.append(icon);
  }

  if (compact) {
    const heading = document.createElement("div");
    heading.className = "media-releases__card-heading";
    if (icon) heading.append(icon);
    heading.append(severity);
    content.append(heading, title);
  } else {
    content.append(severity, title);
  }
  if (meta.hasChildNodes()) content.append(meta);
  content.append(region);
  if (url) {
    const moreInformation = document.createElement("span");
    moreInformation.className = "media-releases__more-information";
    const label = document.createElement("span");
    label.className = "media-releases__more-information-label";
    label.textContent = "More information";
    const arrow = document.createElement("i");
    arrow.className = "fa-light fa-arrow-right";
    arrow.setAttribute("aria-hidden", "true");
    moreInformation.append(label, arrow);
    content.append(moreInformation);
  }
  cardLink.append(content);
  article.append(cardLink);
  return article;
}