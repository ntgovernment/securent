/* ==========================================================================
   #local-conditions – Location select + BOM / NT EPA condition cards
    Temperature observations come from BOM; air quality comes from NT EPA.
   ========================================================================== */
(function () {
  var root = document.getElementById("local-conditions");
  if (!root) return;

  var endpoint = root.dataset.endpoint || "/api/local-conditions";
  var STORAGE_KEY = "securent.localConditions.location";

  var LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];
  var isLocal = LOCAL_HOSTS.includes(window.location.hostname);
  var observationsUrl = isLocal
    ? "/IDD60920.xml"
    : "/_design/integrations/temperatures";
  var airQualityUrl = isLocal ? "/api/air-quality" : "/_design/integrations/air-quality-json";
  var fireAreaLocations = {
    "NT_FW001": [
      "Darwin Airport", "Batchelor", "Charles Point", "Kangaroo Flats", "Channel Point",
      "Middle Point", "Noonamah", "Darwin Harbour", "Knuckey Lagoon", "East Point",
    ],
    "NT_FW002": ["Point Stuart", "Mount Bundey North", "Mount Bundey South", "Douglas River"],
    "NT_FW003": [
      "Wadeye (Port Keats)", "Bradshaw", "Bradshaw-Angallari Valley (Defence)",
      "Bradshaw-Koolendong Valley",
    ],
    "NT_FW004": ["Pirlangimpi"],
    "NT_FW005": [
      "Point Fawcett", "Jabiru", "Maningrida Airport", "Warruwi", "Croker Island Airport",
      "Murganella Airstrip", "Oenpelli Airstrip",
    ],
    "NT_FW006": [
      "McCluer Island", "Cape Wessel", "Gove Airport", "Groote Eylandt Airport", "Milingimbi",
      "Ngayawili (Elcho Island)",
    ],
    "NT_FW007": ["Tindal", "Daly Waters"],
    "NT_FW008": ["Bulman", "Central Arnhem Plateau", "Ngukurr AWS"],
    "NT_FW009": ["Borroloola", "Centre Island", "McArthur River Mine"],
    "NT_FW010": ["Victoria River Downs", "Delamere"],
    "NT_FW011": ["Territory Grape Farm"],
    "NT_FW012": ["Tennant Creek"],
    "NT_FW013": ["Jervois"],
    "NT_FW014": ["Alice Springs Airport", "Arltunga"],
    "NT_FW015": ["Dum In Mirrie"],
    "NT_FW017": ["Curtin Springs", "Yulara"],
    "NT_FW019": ["Lajamanu", "Rabbit Flat"],
    "NT_FW020": ["Walungurru (Kintore)", "The Granites Airport"],
  };
  var fireAreaCodes = {};
  Object.keys(fireAreaLocations).forEach(function (areaCode) {
    fireAreaLocations[areaCode].forEach(function (name) {
      fireAreaCodes[name] = areaCode;
    });
  });
  var locationAliases = {
    Tindal: "Katherine (Tindall)",
    "Knuckey Lagoon": "Palmerston (Knuckey Lagoon)",
  };
  var epaStations = {
    "Darwin Airport": 2,
    "Darwin Harbour": 3,
    Tindal: 4,
    "Knuckey Lagoon": 1,
  };
  var epaLocationNames = {
    1: "Palmerston (Knuckey Lagoon)",
    4: "Katherine (Tindall)",
  };
  var legacyLocationNames = {
    darwin: "Darwin Airport",
    palmerston: "Palmerston (Knuckey Lagoon)",
    "alice-springs": "Alice Springs Airport",
    katherine: "Katherine (Tindall)",
    "tennant-creek": "Tennant Creek",
    nhulunbuy: "Nhulunbuy",
    yulara: "Yulara",
  };
  var fireLevels = ["No Rating", "Moderate", "High", "Extreme", "Catastrophic"];
  var fireDangerUrl = `${__SECURENT_BASE_URL__}/_design/integrations/fire-danger-ratings`;
  var locations = [];

  var FIRE_COLOURS = ["#5fb830", "#f4d63a", "#f28100", "#a80a0a"];
  var AQI_LEVELS = [
    { min: 0, max: 50, range: "0–50", label: "Good", colour: "#61b92f" },
    { min: 51, max: 100, range: "51–100", label: "Fair", colour: "#f5d639" },
    { min: 101, max: 150, range: "101–150", label: "Poor", colour: "#f07e01" },
    { min: 151, max: 300, range: "151–300", label: "Very poor", colour: "#a60f37" },
    { min: 301, max: Infinity, range: "301+", label: "Extremely poor", colour: "#590019" },
  ];

  var select = root.querySelector(".lc-select");
  var useBtn = root.querySelector(".lc-use-location");
  var cards = root.querySelector(".lc-cards");
  var status = root.querySelector(".lc-status");
  var requestId = 0;
  var activeLocation = null;
  var activeData = null;
  var activePendingFields = [];
  var userSelected = false;
  var locationPending = false;
  var locationRequestId = 0;
  var locationTimer;

  var oldAttribution = root.querySelector(".lc-attribution");
  if (oldAttribution && !cards.contains(oldAttribution)) oldAttribution.remove();
  select.replaceChildren();
  select.disabled = true;
  useBtn.disabled = true;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function darwinDay(date) {
    var parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Darwin", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    var values = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") values[part.type] = Number(part.value);
    });
    return Date.UTC(values.year, values.month - 1, values.day);
  }

  function relativeTimeText(date, value) {
    if (!/(?:T|\s)\d{2}:\d{2}/.test(value)) {
      var days = Math.floor((darwinDay(new Date()) - darwinDay(date)) / 86400000);
      if (days <= 0) return "Today";
      return days + (days === 1 ? " day ago" : " days ago");
    }

    var minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Today";
    if (minutes < 60) return minutes + " min ago";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + " hr ago";
    var elapsedDays = Math.floor(hours / 24);
    return elapsedDays + (elapsedDays === 1 ? " day ago" : " days ago");
  }

  function clockTimeElement(text, date) {
    var time = el("time", "lc-relative-time");
    var icon = el("i", "fa-light fa-clock");
    icon.setAttribute("aria-hidden", "true");
    time.appendChild(icon);
    time.appendChild(document.createTextNode(text));
    if (date) time.dateTime = date.toISOString();
    return time;
  }

  function relativeTimeElement(value) {
    if (typeof value !== "string") return null;
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    return clockTimeElement(relativeTimeText(date, value), date);
  }

  function card(title, iconClass, cardClass) {
    var c = el("div", "lc-card");
    if (cardClass) c.classList.add(cardClass);
    c.appendChild(el("h3", "lc-card__title", title));
    var icon = el("span", "lc-card__icon");
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(el("i", "fa-regular " + iconClass));
    c.appendChild(icon);
    return c;
  }

  function skeletonGroup() {
    var group = el("div", "lc-card-group lc-skeleton-group");
    group.setAttribute("aria-hidden", "true");
    var placeholder = el("div", "lc-card lc-skeleton");
    placeholder.appendChild(el("span", "lc-skeleton-block lc-skeleton-block--title"));
    placeholder.appendChild(el("span", "lc-skeleton-block lc-skeleton-block--value"));
    placeholder.appendChild(el("span", "lc-skeleton-block lc-skeleton-block--meta"));
    var source = el("p", "lc-attribution lc-skeleton-source");
    source.appendChild(el("span", "lc-skeleton-block lc-skeleton-block--source"));
    placeholder.appendChild(source);
    group.appendChild(placeholder);
    return group;
  }

  function ratingChart(className, label, levels, selectedIndex, markerPosition) {
    var chart = el("div", "lc-rating-chart " + className);
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", label);
    levels.forEach(function (level, index) {
      var segment = el("span", "lc-rating-chart__segment");
      segment.style.backgroundColor = level.colour;
      if (selectedIndex != null) segment.style.flexGrow = index === selectedIndex ? "2" : "1";
      chart.appendChild(segment);
    });
    if (selectedIndex != null || markerPosition != null) {
      var marker = el("span", "lc-rating-chart__marker");
      marker.setAttribute("aria-hidden", "true");
      marker.style.left = (markerPosition == null
        ? (selectedIndex + 1) / (levels.length + 1) * 100
        : markerPosition) + "%";
      chart.appendChild(marker);
    }
    return chart;
  }

  function fireCard(data) {
    var c = card("Bushfire danger rating", "fa-fire-flame-curved", "lc-card--bushfire");
    if (!data) return null;

    var fireLevelsForChart = fireLevels.slice(1).map(function (label, index) {
      return { label: label, colour: FIRE_COLOURS[index] };
    });
    var selectedIndex = data.level - 1;
    var markerPosition = selectedIndex < 0
      ? 0
      : selectedIndex < fireLevelsForChart.length
        ? (selectedIndex + 0.5) / fireLevelsForChart.length * 100
        : null;
    c.appendChild(ratingChart("lc-fire", "Fire danger rating: " + data.label,
      fireLevelsForChart, null, markerPosition));
    c.appendChild(el("p", "lc-card__label", data.label));
    return c;
  }

  function airCard(data) {
    var c = card("Air quality", "fa-fan", "lc-card--air-quality");
    if (!data || !Number.isFinite(data.index)) return null;

    var levelIndex = AQI_LEVELS.findIndex(function (item) {
      return data.index >= 0 && data.index <= item.max;
    });
    if (levelIndex < 0) return null;
    var level = AQI_LEVELS[levelIndex];
    var row = el("div", "lc-card__row lc-air-row");
    var value = el("span", "lc-card__value", String(data.index));
    value.appendChild(el("span", "lc-card__unit", " AQI"));
    row.appendChild(value);
    var status = el("span", "lc-air");
    var dot = el("span", "lc-air__dot");
    dot.setAttribute("aria-hidden", "true");
    dot.style.backgroundColor = level.colour;
    status.appendChild(dot);
    status.appendChild(document.createTextNode(level.label));
    row.appendChild(status);
    var chartLabel = "NT EPA air quality index: current index " + data.index + ", " + level.label + ". "
      + AQI_LEVELS.map(function (item) { return item.label + " " + item.range; }).join("; ");
    var lowerBound = levelIndex === 0 ? 0 : AQI_LEVELS[levelIndex - 1].max;
    var upperBound = Math.min(level.max, 700);
    var bandProgress = (Math.min(data.index, upperBound) - lowerBound) / (upperBound - lowerBound);
    var markerPosition = (levelIndex + bandProgress) / AQI_LEVELS.length * 100;
    c.appendChild(ratingChart("lc-air-chart", chartLabel, AQI_LEVELS, null, markerPosition));
    c.appendChild(row);
    return c;
  }

  function tempCard(data) {
    var c = card("Temperature", "fa-temperature-half");
    if (!data || (data.min == null && data.max == null)) return null;

    function part(arrow, label, v) {
      var p = el("span", "lc-temp");
      var a = el("i", "lc-temp__arrow fa-solid " + arrow);
      a.setAttribute("aria-hidden", "true");
      p.appendChild(a);
      var sr = el("span", "visually-hidden", label + " ");
      p.appendChild(sr);
      p.appendChild(document.createTextNode(v == null ? "–" : Math.round(v) + " °C"));
      return p;
    }

    var row = el("div", "lc-card__row lc-temp-row");
    row.appendChild(part("fa-caret-down", "Observed minimum", data.min));
    row.appendChild(part("fa-caret-up", "Observed maximum", data.max));
    c.appendChild(row);
    return c;
  }

  function cardWithSource(cardNode, name, url, reading, showTodayIfMissing) {
    var group = el("div", "lc-card-group");
    var source = el("p", "lc-attribution");
    source.appendChild(document.createTextNode("Source: "));
    if (url) {
      var link = el("a", null, name);
      link.href = url;
      source.appendChild(link);
    } else {
      source.appendChild(document.createTextNode(name));
    }
    var timestamp = reading && (reading.time || reading.issuedAt);
    var time = timestamp && relativeTimeElement(timestamp);
    if (!time && showTodayIfMissing) time = clockTimeElement("Today");
    var footer = el("div", "lc-card__footer");
    footer.appendChild(source);
    if (time) {
      var timestampRow = el("p", "lc-card__timestamp");
      timestampRow.appendChild(time);
      footer.appendChild(timestampRow);
    }
    cardNode.appendChild(footer);
    group.appendChild(cardNode);
    return group;
  }

  function cardWithoutData(title, iconClass, cardClass) {
    var group = el("div", "lc-card-group");
    var cardNode = card(title, iconClass, cardClass);
    var source = el("p", "lc-attribution lc-attribution--unavailable");
    var icon = el("i", "fa-light fa-circle-exclamation");
    icon.setAttribute("aria-hidden", "true");
    source.appendChild(icon);
    source.appendChild(document.createTextNode(" Data not available."));
    var footer = el("div", "lc-card__footer");
    footer.appendChild(source);
    cardNode.appendChild(footer);
    group.appendChild(cardNode);
    return group;
  }

  function render(data, pendingFields) {
    var waiting = pendingFields || [];
    var groups = [];
    var fire = fireCard(data.fireDanger);
    var air = airCard(data.airQuality);
    var temperature = tempCard(data.temperature);
    if (fire) groups.push(cardWithSource(fire, "Bushfires NT",
      "https://www.pfes.nt.gov.au/incidentmap", data.fireDanger));
    else if (waiting.indexOf("fireDanger") >= 0) groups.push(skeletonGroup());
    else groups.push(cardWithoutData("Bushfire danger rating", "fa-fire-flame-curved"));
    if (air) groups.push(cardWithSource(air, "NTEPA", "https://ntepa.nt.gov.au/", data.airQuality));
    else if (waiting.indexOf("airQuality") >= 0) groups.push(skeletonGroup());
    else groups.push(cardWithoutData("Air quality", "fa-fan", "lc-card--air-quality"));
    if (temperature) groups.push(cardWithSource(temperature, "Bureau of Meteorology",
      "https://www.bom.gov.au/location/australia/northern-territory#observations", data.temperature, true));
    else if (waiting.indexOf("temperature") < 0) groups.push(cardWithoutData("Temperature", "fa-temperature-half"));
    cards.replaceChildren.apply(cards, groups);
    if (waiting.length) cards.setAttribute("aria-busy", "true");
    else cards.removeAttribute("aria-busy");
  }

  function readFireDanger(feed, areaCode) {
    if (!feed || !Array.isArray(feed.warnings)) return null;
    var warning = feed.warnings.find(function (item) { return item && item.area_code === areaCode; });
    if (!warning) return null;
    var severity = warning.severity_code || warning.severity_name;
    var level = fireLevels.findIndex(function (value) {
      return typeof severity === "string" && severity.toLowerCase() === value.toLowerCase();
    });
    var issuedAt = typeof warning.issuetime === "string" && Number.isFinite(Date.parse(warning.issuetime))
      ? warning.issuetime : null;
    return level < 0 ? null : { label: fireLevels[level], level: level, issuedAt: issuedAt };
  }

  function load(location) {
    var id = ++requestId;
    var data = { temperature: location.temperature };
    var fireAreaCode = location.fireAreaCode;
    var pendingFields = [];
    if (fireAreaCode) pendingFields.push("fireDanger");
    if (location.epaStation) pendingFields.push("airQuality");
    activeLocation = location;
    activeData = data;
    activePendingFields = pendingFields.slice();
    render(data, pendingFields);

    function complete(field, value) {
      if (id !== requestId) return;
      data[field] = value;
      var index = pendingFields.indexOf(field);
      if (index >= 0) pendingFields.splice(index, 1);
      activePendingFields = pendingFields.slice();
      render(data, pendingFields);
    }

    if (fireAreaCode) {
      var fireRequest = isLocal
        ? (function () {
          var url = new URL(endpoint, window.location.href);
          url.searchParams.set("location", fireAreaCode);
          return fetch(url.href);
        }())
        : fetch(fireDangerUrl);
      fireRequest
        .then(function (response) {
          if (!response.ok) throw new Error(response.status);
          return response.json();
        })
        .then(function (result) {
          complete("fireDanger", isLocal ? result.fireDanger : readFireDanger(result, fireAreaCode));
        })
        .catch(function () { complete("fireDanger", null); });
    }

    if (location.epaStation) {
      fetch(airQualityUrl + (isLocal ? "?id=" + location.epaStation : ""))
        .then(function (response) {
          if (!response.ok) throw new Error(response.status);
          return response.json();
        })
        .then(function (result) {
          var station = isLocal ? result : readAirStations(result).find(function (item) {
            return item.id === location.epaStation;
          });
          var value = station && station.index;
          if ((typeof value !== "number" && typeof value !== "string") ||
              !/^\d+(?:\.\d+)?$/.test(String(value).trim()) || !Number.isFinite(Number(value))) {
            throw new Error("Invalid air-quality index");
          }
          complete("airQuality", { index: Number(value), colour: station.colour, category: station.category,
            station: isLocal ? station.station : station.name, time: station.time });
        })
        .catch(function () { complete("airQuality", null); });
    }
  }

  function setLocation(key) {
    var location = locations.find(function (item) { return item.key === key; });
    if (!location) return;
    select.value = key;
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e) {
      /* storage may be blocked */
    }
    load(location);
  }

  function hasCoordinates(location) {
    return location.lat != null && location.lon != null &&
      Math.abs(location.lat) <= 90 && Math.abs(location.lon) <= 180;
  }

  function nearest(lat, lon) {
    var best = null;
    var bestD = Infinity;
    var latRadians = (lat * Math.PI) / 180;
    locations.forEach(function (l) {
      if (!hasCoordinates(l)) return;
      var dLat = ((l.lat - lat) * Math.PI) / 180;
      var dLon = ((l.lon - lon) * Math.PI) / 180;
      var d = Math.sin(dLat / 2) ** 2 + Math.cos(latRadians) *
        Math.cos((l.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    });
    return best;
  }

  function darwinAirport() {
    return locations.find(function (location) { return location.name === "Darwin Airport"; });
  }

  function updateLocationButton() {
    useBtn.disabled = locationPending ||
      !(darwinAirport() || (navigator.geolocation && locations.some(hasCoordinates)));
  }

  select.addEventListener("change", function () {
    ++locationRequestId;
    clearTimeout(locationTimer);
    locationPending = false;
    updateLocationButton();
    userSelected = true;
    setLocation(select.value);
    status.textContent = "";
  });

  useBtn.addEventListener("click", function () {
    var id = ++locationRequestId;
    locationPending = true;
    updateLocationButton();
    status.textContent = "Finding your location…";

    function finish(location) {
      if (id !== locationRequestId || !locationPending) return;
      clearTimeout(locationTimer);
      locationPending = false;
      updateLocationButton();
      var fallback = !location;
      location = location || darwinAirport();
      if (!location) {
        status.textContent = "Darwin Airport is unavailable.";
        return;
      }
      userSelected = true;
      setLocation(location.key);
      status.textContent = fallback
        ? ""
        : "Showing " + location.name + ".";
    }

    if (!navigator.geolocation) {
      finish(null);
      return;
    }
    locationTimer = setTimeout(function () { finish(null); }, 10000);
    try {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var lat = pos && pos.coords && pos.coords.latitude;
          var lon = pos && pos.coords && pos.coords.longitude;
          finish(Number.isFinite(lat) && Number.isFinite(lon) &&
            Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? nearest(lat, lon) : null);
        },
        function () { finish(null); },
        { timeout: 10000 },
      );
    } catch (error) {
      finish(null);
    }
  });

  function numberAttribute(node, attribute) {
    var value = node.getAttribute(attribute);
    if (value == null || !value.trim()) return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function temperature(station, type) {
    var element = station.querySelector('period[index="0"] level[type="surface"] element[type="' + type + '"]');
    if (!element || !element.textContent.trim()) return null;
    var value = Number(element.textContent);
    return Number.isFinite(value) ? value : null;
  }

  function readLocations(text) {
    var xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror") || xml.documentElement.nodeName !== "product") {
      throw new Error("Invalid BOM XML");
    }
    var issueTime = xml.querySelector("amoc > issue-time-local") || xml.querySelector("amoc > issue-time-utc");
    var observationTime = issueTime && issueTime.textContent.trim();
    return Array.from(xml.querySelectorAll("observations > station")).map(function (station) {
      var name = station.getAttribute("description");
      return {
        key: station.getAttribute("bom-id"),
        name: locationAliases[name] || name,
        lat: numberAttribute(station, "lat"),
        lon: numberAttribute(station, "lon"),
        fireAreaCode: fireAreaCodes[name] || null,
        epaStation: Object.prototype.hasOwnProperty.call(epaStations, name) ? epaStations[name] : null,
        temperature: {
          min: temperature(station, "minimum_air_temperature"),
          max: temperature(station, "maximum_air_temperature"),
          time: observationTime || null,
        },
      };
    }).filter(function (location) {
      return location.key && location.name;
    }).sort(function (first, second) {
      return first.name.localeCompare(second.name);
    });
  }

  function airReadingTime(station) {
    var dates = (Array.isArray(station.pollutants) ? station.pollutants : [])
      .filter(function (pollutant) {
        return pollutant && pollutant.IndexValue === station.IndexValue && pollutant.IndexValue >= 0;
      }).map(function (pollutant) {
        var match = typeof pollutant.Date === "string" && /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(pollutant.Date);
        return match ? new Date(Number(match[1])).getTime() : NaN;
      }).filter(Number.isFinite);
    return dates.length ? new Date(Math.max.apply(null, dates)).toISOString() : null;
  }

  function readAirStations(data) {
    if (isLocal) {
      if (!Array.isArray(data.stations)) throw new Error("Invalid EPA station list");
      return data.stations;
    }
    if (!Array.isArray(data.d)) throw new Error("Invalid EPA station feed");
    return data.d.filter(function (station) { return station != null; }).map(function (station) {
      return { id: station.serialCode, name: station.name, index: station.IndexValue,
        colour: station.IndexColorStrHex, category: station.IndexColorDescription, time: airReadingTime(station) };
    });
  }

  function addAirLocations(data) {
    readAirStations(data).forEach(function (station) {
      if (!Number.isInteger(station.id) || station.id < 1 || station.id > 4 ||
          typeof station.name !== "string" || !station.name.trim()) return;
      var name = station.name.trim();
      var existing = locations.find(function (location) {
        return location.epaStation === station.id;
      }) || locations.find(function (location) {
        return location.name.toLowerCase() === name.toLowerCase();
      });
      if (existing) {
        existing.epaStation = station.id;
        existing.name = epaLocationNames[station.id] || existing.name;
        existing.fireAreaCode = existing.fireAreaCode ||
          fireAreaCodes[existing.name] || fireAreaCodes[name] ||
          (station.id === 4 ? "NT_FW007" : "NT_FW001");
        return;
      }
      if (locations.some(function (location) { return location.key === "epa-" + station.id; })) return;
      locations.push({
        key: "epa-" + station.id,
        name: epaLocationNames[station.id] || name,
        lat: null,
        lon: null,
        fireAreaCode: station.id === 4 ? "NT_FW007" : "NT_FW001",
        epaStation: station.id,
        temperature: null,
      });
    });
    locations.sort(function (first, second) { return first.name.localeCompare(second.name); });
  }

  function fetchCatalog(url, format, parse) {
    var controller = new AbortController();
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = setTimeout(function () {
        reject(new Error("Local conditions catalog timed out"));
        controller.abort();
      }, 30000);
    });
    var request = Promise.resolve().then(function () {
      return fetch(url, { signal: controller.signal });
    }).then(function (response) {
      if (!response.ok) throw new Error(response.status);
      return response[format]();
    }).then(parse);
    return Promise.race([request, timeout]).finally(function () {
      clearTimeout(timer);
    });
  }

  var bomLocations = [];
  var airCatalog = null;
  var catalogsPending = 2;
  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }

  function updateCatalog() {
      locations = bomLocations.slice();
      if (airCatalog) addAirLocations(airCatalog);
      if (!locations.length) {
        if (!catalogsPending) {
          render({});
          status.textContent = "Local conditions locations are currently unavailable.";
        }
        return;
      }
      var previous = activeLocation && (locations.find(function (location) {
        return location.key === activeLocation.key;
      }) || (activeLocation.epaStation && locations.find(function (location) {
        return location.epaStation === activeLocation.epaStation;
      }) || locations.find(function (location) {
        return location.name.toLowerCase() === activeLocation.name.toLowerCase();
      })));
      var savedEpaStation = typeof saved === "string" && /^epa-([1-4])$/.exec(saved);
      var restored = !userSelected && (
        locations.find(function (location) { return location.key === saved; }) ||
        (saved && locations.find(function (location) {
          return location.name.toLowerCase() === (legacyLocationNames[saved] || "").toLowerCase();
        })) || (savedEpaStation && locations.find(function (location) {
          return location.epaStation === Number(savedEpaStation[1]);
        })));
      var initial = restored || previous ||
        locations.find(function (location) { return location.name === "Darwin Airport"; }) ||
        locations.find(function (location) { return !location.key.startsWith("epa-"); }) ||
        locations[0];
      select.replaceChildren();
      locations.forEach(function (location) {
        var option = document.createElement("option");
        option.value = location.key;
        option.textContent = location.name;
        option.dataset.coordinates = hasCoordinates(location)
          ? location.lat + "," + location.lon
          : "";
        select.appendChild(option);
      });
      select.disabled = false;
      updateLocationButton();

      if (previous === initial && activeLocation.fireAreaCode === initial.fireAreaCode &&
          activeLocation.epaStation === initial.epaStation) {
        activeLocation = initial;
        activeData.temperature = initial.temperature;
        select.value = initial.key;
        try {
          localStorage.setItem(STORAGE_KEY, initial.key);
        } catch (e) {
          /* ignore */
        }
        render(activeData, activePendingFields);
      } else {
        setLocation(initial.key);
      }
  }

  function catalogComplete() {
    --catalogsPending;
    updateCatalog();
  }

  status.textContent = "";
  cards.setAttribute("aria-busy", "true");
  if (!cards.querySelector(".lc-skeleton-group")) {
    cards.replaceChildren(skeletonGroup(), skeletonGroup(), skeletonGroup());
  }
  fetchCatalog(observationsUrl, "text", readLocations)
    .then(function (result) { bomLocations = result; })
    .catch(function () {})
    .finally(catalogComplete);
  fetchCatalog(airQualityUrl, "json", function (data) {
      readAirStations(data);
      return data;
    })
    .then(function (result) { airCatalog = result; })
    .catch(function () {})
    .finally(catalogComplete);
})();
