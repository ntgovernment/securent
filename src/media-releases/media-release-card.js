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

function relativeTimeLabel(timestamp, now) {
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function startRelativeTimeUpdates(container) {
  const refresh = () => {
    const now = Date.now();
    for (const time of container.querySelectorAll("time[data-time]")) {
      const timestamp = Date.parse(time.dataset.time);
      if (!Number.isFinite(timestamp)) throw new TypeError("Warning card has an invalid data-time value");
      time.textContent = relativeTimeLabel(timestamp, now);
    }
  };
  refresh();
  window.setInterval(refresh, 60_000);
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
  const isPlannedBurn = !compact && item.declarations.includes("Planned burn advice");
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
  const isGeneralInformationCard = !compact
    && (isGeneralInformation || item.emergencyTypes.includes("Not identified"));
  const iconUrl = hazardIconFor(item);
  const isEmergencyTypeCard = !compact && Boolean(iconUrl);
  const isFormattedCard = isPlannedBurn || isGeneralInformationCard || isEmergencyTypeCard;
  if (isFormattedCard) article.classList.add("media-releases__item--formatted");
  if (isPlannedBurn) article.classList.add("media-releases__item--planned-burn");
  if (isGeneralInformationCard) {
    article.classList.add("media-releases__item--general-information");
  }
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
  const publishedAt = updatedTimestamp(item.publishedAt);
  if (publishedAt !== null) {
    const dateTime = document.createElement("span");
    dateTime.className = "media-releases__date-time";
    if (!isFormattedCard) {
      const clock = document.createElement("i");
      clock.className = "fa-light fa-clock";
      clock.setAttribute("aria-hidden", "true");
      dateTime.append(clock);
    }
    const time = document.createElement("time");
    time.dateTime = new Date(publishedAt).toISOString();
    time.dataset.time = time.dateTime;
    time.textContent = relativeTimeLabel(publishedAt, Date.now());
    dateTime.append(time);
    meta.append(dateTime);
  }

  const regions = item.regions.filter((region) => region !== "Not identified");
  let region;
  if (regions.length) {
    region = document.createElement("p");
    region.className = "media-releases__classification media-releases__region";
    const mapPin = document.createElement("i");
    mapPin.className = "fa-light fa-location-dot";
    mapPin.setAttribute("aria-hidden", "true");
    region.append(mapPin);
    const regionLabel = document.createElement("span");
    if (isFormattedCard) {
      const accessibleLabel = document.createElement("span");
      accessibleLabel.className = "visually-hidden";
      accessibleLabel.textContent = "Region: ";
      regionLabel.append(accessibleLabel, document.createTextNode(regions.join(", ")));
    } else {
      regionLabel.textContent = `Region: ${regions.join(", ")}`;
    }
    region.append(regionLabel);
  }

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
  } else if (isFormattedCard) {
    if (!icon) {
      const noticeIcon = document.createElement("i");
      noticeIcon.className = "fa-light fa-triangle-exclamation media-releases__notice-icon";
      noticeIcon.setAttribute("aria-hidden", "true");
      cardLink.append(noticeIcon);
    }
    if (meta.hasChildNodes()) content.append(meta);
    content.append(title);
  } else {
    content.append(severity, title);
  }
  if (!isFormattedCard && meta.hasChildNodes()) content.append(meta);
  if (region) content.append(region);
  if (url && !isFormattedCard) {
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