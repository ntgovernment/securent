import { sortAlerts, updatedTimestamp } from "../alerts-listing/sorting.mjs";

export const sourceOrder = ["Bushfires NT", "NTES", "PFES", "SecureNT", "WoG"];

const sourceRank = new Map(sourceOrder.map((source, index) => [source, index]));
const alertLanguage = /\b(?:advice|warning|watch\s*(?:&|and)\s*act|emergency\s+(?:warning|alert|declaration)|decreasing[\s_-]+threats?|threat is reduced|evacu\w*|take shelter|shelter now|prepare now|stay informed|fire bans?|fire danger period|boil water alert|public health alert|code yellow|rescue operation|incidents?\b|hazmat|dangerous surf|avoid (?:the )?flooded area)\b/i;
const hazardLanguage = /\b(?:storm|flood|cyclone|bushfires?|fires?|emergency|incident|hazmat|health|boil water|evacu\w*|surf)\b/i;
const generalNews = /\b(?:awards?|recruit(?:ment|ing)?|ceremon(?:y|ies)|outlook|symposium|funding|grant recipients|honours? list|anniversary|celebrates?\b|celebration)\b/i;
const operationalSender = /\b(?:ntes|northern territory emergency service|territory emergency operations centre|nt fire and emergency services|bushfires? nt|securent)\b|territorydutyofficer\.ntes@pfes\.nt\.gov\.au/i;
const approvedDutyOfficer = /\bterritorydutyofficer\.ntes@pfes\.nt\.gov\.au\b/i;

export const warningLevelOrder = ["Emergency warning", "Watch and act", "Advice", "Not identified"];

const regionPatterns = [
  ["Darwin, Palmerston and Litchfield", /\b(?:darwin|palmerston|litchfield|humpty doo|howard springs|acacia hills|berry springs|coolalinga|nightcliff|casuarina)\b/i],
  ["Top End", /\b(?:top end|tiwi|bathurst island|melville island|west arnhem|jabiru|gunbalanya|kakadu|adelaide river|batchelor|wagait|dundee)\b/i],
  ["Big Rivers", /\b(?:big rivers|katherine|daly river|douglas daly|pine creek|mataranka|beswick|barunga|ngukurr|borroloola|roper|victoria river|timber creek|kalkarindji|lajamanu)\b/i],
  ["East Arnhem", /\b(?:east arnhem|nhulunbuy|gove|yirrkala|alyangula|groote eylandt|galiwin['\u2019]?ku|elcho island|gapuwiyak|ramingining|milingimbi)\b/i],
  ["Barkly", /\b(?:barkly(?!\s+highway)|tennant creek|elliott|renner springs|tablelands|costello)\b/i],
  ["Central Australia", /\b(?:central australia|alice springs|lasseter|tanami|simpson|yulara|uluru|santa teresa|ltyentye apurte|hermannsburg|ntaria|papunya|yuendumu|nyirripi|chilla well|ti tree|harts range|hugh)\b/i],
];

const emergencyPatterns = [
  ["Bushfire", /\b(?:bush\s*fires?|wildfires?|grass\s*fires?|fire bans?|fire danger|planned burn|vegetation fire)\b/i],
  ["Cyclone", /\b(?:cyclones?|tropical low)\b/i],
  ["Flooding", /\b(?:flood\w*|flash flooding|rising river)\b/i],
  ["Severe storm", /\b(?:storms?|thunderstorms?|damaging winds?|large hail)\b/i],
  ["Heatwave", /\b(?:heatwaves?|extreme heat)\b/i],
  ["Health emergency", /\b(?:health alert|health emergency|boil(?:ing)? water|water alert|disease outbreak)\b/i],
  ["Hazardous materials", /\b(?:hazmat|hazardous materials?|chemical spill|gas leak)\b/i],
  ["Tsunami", /\btsunami\b/i],
];

export function classifyNotice(record) {
  const content = [record.title || record.Subject, record.name || record.Name].filter(Boolean).join(" ");
  const isFireBan = /\bfire bans?\b/i.test(content);
  const matchingLabels = (patterns) => {
    const matches = patterns.filter(([, pattern]) => pattern.test(content)).map(([label]) => label);
    return matches.length ? matches : ["Not identified"];
  };
  const warningPatterns = [
    ["Advice", /\b(?:decreasing[\s_-]+threats?|threat (?:is )?reduced|all clear)\b/i],
    ["Emergency warning", /\bemergency[\s_-]+warning\b/i],
    ["Watch and act", /\bwatch[\s_-]*(?:&|and)[\s_-]*act\b/i],
    ["Advice", /\badvice\b/i],
  ];
  return {
    regions: matchingLabels(regionPatterns),
    emergencyTypes: isFireBan ? ["Not identified"] : matchingLabels(emergencyPatterns),
    declarations: isFireBan ? ["Fire ban"] : [],
    warningLevel: isFireBan ? "Not identified" : [record.title || record.Subject, record.name || record.Name]
      .map((text) => warningPatterns.find(([, pattern]) => pattern.test(text || ""))?.[0])
      .find(Boolean) || "Not identified",
  };
}

export function filterAndSortNotices(items, {
  query = "", sources = [], regions = [], emergencyTypes = [], declarations = [], warningLevels = [], order = "newest",
} = {}) {
  const search = query.trim().toLocaleLowerCase();
  const matches = items.filter((item) => {
    const groups = [[sources, item.sources], [regions, item.regions],
      [emergencyTypes, item.emergencyTypes], [declarations, item.declarations || []], [warningLevels, [item.warningLevel]]];
    const searchable = [item.title, item.name, item.fromName, ...item.sources,
      ...item.regions, ...item.emergencyTypes, ...(item.declarations || []), item.warningLevel].filter(Boolean).join(" ").toLocaleLowerCase();
    return (!search || searchable.includes(search)) && groups.every(([selected, values]) =>
      !selected.length || selected.some((value) => values.includes(value)));
  });
  if (order === "level" || order === "title") return sortAlerts(matches, order, (item) => item.title);
  return matches.sort((first, second) => {
    const firstTime = updatedTimestamp(first.publishedAt);
    const secondTime = updatedTimestamp(second.publishedAt);
    if (firstTime === null) return secondTime === null ? 0 : 1;
    if (secondTime === null) return -1;
    return order === "oldest" ? firstTime - secondTime : secondTime - firstTime;
  });
}

function cleanText(value) {
  return typeof value === "string"
    ? value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim()
    : "";
}

function normalizeRecord(record, source, index) {
  const name = cleanText(record.Name);
  const subject = cleanText(record.Subject);
  const title = subject || name;
  const campaignId = cleanText(record.CampaignID);

  return {
    id: campaignId || `${source}:${index}`,
    campaignId,
    title,
    name,
    fromName: cleanText(record.FromName),
    publishedAt: cleanText(record.SentDate),
    sources: [source],
    source,
    url: cleanText(record.WebVersionURL),
    ...classifyNotice({ title, name }),
  };
}

export function isOperationalNotice(record) {
  const content = [record.title || record.Subject, record.name || record.Name].filter(Boolean).join(" ");
  const sender = record.fromName || record.FromName;
  if (approvedDutyOfficer.test(sender)) return true;
  if (!alertLanguage.test(content)) return false;
  if (generalNews.test(content) && !/\b(?:warning|watch\s*(?:&|and)\s*act|emergency alert|evacu\w*|fire bans?|fire danger period)\b/i.test(content)) {
    return false;
  }
  return hazardLanguage.test(content) || operationalSender.test(sender);
}

export function curateFeeds(feeds) {
  const records = new Map();
  let sequence = 0;

  for (const { source, items } of feeds) {
    for (const raw of items) {
      const record = normalizeRecord(raw, source, sequence);
      sequence += 1;
      if (!record.title || !isOperationalNotice(record)) continue;

      const previous = records.get(record.id);
      if (!previous) {
        records.set(record.id, record);
        continue;
      }

      previous.sources = sourceOrder.filter((candidate) =>
        previous.sources.includes(candidate) || record.sources.includes(candidate));
      if ((sourceRank.get(record.source) ?? Infinity) < (sourceRank.get(previous.source) ?? Infinity)) {
        record.sources = previous.sources;
        records.set(record.id, record);
      }
    }
  }

  return [...records.values()].sort((first, second) => {
    const firstTime = updatedTimestamp(first.publishedAt);
    const secondTime = updatedTimestamp(second.publishedAt);
    if (firstTime === null) return secondTime === null ? 0 : 1;
    if (secondTime === null) return -1;
    return secondTime - firstTime || first.title.localeCompare(second.title, "en");
  });
}
