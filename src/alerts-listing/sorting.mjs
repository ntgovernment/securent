const warningLevels = ["emergency warning", "watch and act", "advice", "decreasing threat"];
const alphabetical = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function warningRank(value) {
  const rank = warningLevels.indexOf((value || "").trim().toLowerCase());
  return rank < 0 ? warningLevels.length : rank;
}

export function updatedTimestamp(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?\d{2})?$/.exec((value || "").trim());
  if (!parts) return null;
  const [, year, month, day, hour, minute, second, fraction = "", zone = "+09:30"] = parts;
  const wallTime = new Date(0);
  wallTime.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  wallTime.setUTCHours(Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, "0")));
  if (wallTime.getUTCFullYear() !== Number(year) ||
      wallTime.getUTCMonth() !== Number(month) - 1 ||
      wallTime.getUTCDate() !== Number(day) ||
      wallTime.getUTCHours() !== Number(hour) ||
      wallTime.getUTCMinutes() !== Number(minute) ||
      wallTime.getUTCSeconds() !== Number(second)) return null;
  let offset = 0;
  if (zone !== "Z") {
    const digits = zone.slice(1).replace(":", "");
    const offsetHours = Number(digits.slice(0, 2));
    const offsetMinutes = Number(digits.slice(2));
    if (offsetHours > 23 || offsetMinutes > 59) return null;
    offset = (offsetHours * 60 + offsetMinutes) * (zone[0] === "+" ? 1 : -1);
  }
  return wallTime.getTime() - offset * 60000;
}

function compareText(first, second) {
  const firstText = (first || "").trim();
  const secondText = (second || "").trim();
  if (!firstText) return secondText ? 1 : 0;
  if (!secondText) return -1;
  return alphabetical.compare(firstText, secondText);
}

export function sortAlerts(items, order, titleFor) {
  const sorted = [...items];
  if (order === "level") {
    sorted.sort((first, second) => warningRank(first.warningLevel) - warningRank(second.warningLevel));
  } else if (order === "updated") {
    const timestamps = new Map(sorted.map((item) => [item, updatedTimestamp(item.updatedAt)]));
    sorted.sort((first, second) => {
      const firstTime = timestamps.get(first);
      const secondTime = timestamps.get(second);
      if (firstTime === null) return secondTime === null ? 0 : 1;
      if (secondTime === null) return -1;
      return secondTime - firstTime;
    });
  } else if (order === "location") {
    sorted.sort((first, second) => compareText(first.location, second.location));
  } else if (order === "title") {
    sorted.sort((first, second) => compareText(titleFor(first), titleFor(second)));
  }
  return sorted;
}