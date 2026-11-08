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
    : "./?a=1657184";
  var airQualityUrl = isLocal ? "/api/air-quality" : "./?a=1657186";
  var workerKeys = {
    "Darwin Airport": "darwin",
    "Darwin Harbour": "darwin",
    "Alice Springs Airport": "alice-springs",
    "Tennant Creek": "tennant-creek",
    Yulara: "yulara",
  };
  var epaStations = {
    "Darwin Airport": 2,
    "Darwin Harbour": 3,
  };
  var locations = [];

  var FIRE_COLOURS = ["#5fb830", "#f4d63a", "#f28100", "#a80a0a"];

  var select = root.querySelector(".lc-select");
  var useBtn = root.querySelector(".lc-use-location");
  var cards = root.querySelector(".lc-cards");
  var status = root.querySelector(".lc-status");
  var requestId = 0;

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

  function card(title, iconClass) {
    var c = el("div", "lc-card");
    c.appendChild(el("h3", "lc-card__title", title));
    var icon = el("span", "lc-card__icon");
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(el("i", "fa-regular " + iconClass));
    c.appendChild(icon);
    return c;
  }

  function unavailable(c) {
    c.appendChild(
      el("p", "lc-card__none", "Data is currently unavailable. Try again later."),
    );
    return c;
  }

  function fireCard(data) {
    var c = card("Bushfire danger rating", "fa-fire-flame-curved");
    if (!data) return unavailable(c);

    var bar = el("div", "lc-fire");
    FIRE_COLOURS.forEach(function (colour) {
      var seg = el("span", "lc-fire__seg");
      seg.style.background = colour;
      bar.appendChild(seg);
    });
    if (data.level > 0) {
      var marker = el("span", "lc-fire__marker");
      // Centre the marker in the segment for the current level (levels 1-4).
      var idx = Math.min(Math.max(data.level - 1, 0), 3);
      marker.style.left = idx * 25 + 12.5 + "%";
      bar.appendChild(marker);
    }
    c.appendChild(bar);
    c.appendChild(el("p", "lc-card__label", data.label));
    return c;
  }

  function airCard(data) {
    var c = card("Air quality monitor", "fa-fan");
    if (!data || !Number.isFinite(data.index)) return unavailable(c);

    var row = el("div", "lc-card__row");
    var value = el("span", "lc-card__value", String(data.index));
    value.appendChild(el("span", "lc-card__unit", " Index"));
    row.appendChild(value);
    if (typeof data.category === "string" && data.category.trim()) {
      var badge = el("span", "lc-air");
      var dot = el("span", "lc-air__dot");
      dot.setAttribute("aria-hidden", "true");
      dot.style.backgroundColor = typeof data.colour === "string" && /^#[0-9a-f]{6}$/i.test(data.colour)
        ? data.colour : "#999999";
      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(data.category.trim()));
      row.appendChild(badge);
    }
    c.appendChild(row);
    return c;
  }

  function tempCard(data) {
    var c = card("Temperature", "fa-temperature-half");
    if (!data || (data.min == null && data.max == null)) return unavailable(c);

    function part(arrow, label, v) {
      var p = el("span", "lc-temp");
      var a = el("span", "lc-temp__arrow", arrow);
      a.setAttribute("aria-hidden", "true");
      p.appendChild(a);
      var sr = el("span", "visually-hidden", label + " ");
      p.appendChild(sr);
      p.appendChild(document.createTextNode(v == null ? "–" : Math.round(v) + " °C"));
      return p;
    }

    var row = el("div", "lc-card__row");
    row.appendChild(part("▼", "Observed minimum", data.min));
    row.appendChild(part("▲", "Observed maximum", data.max));
    c.appendChild(row);
    return c;
  }

  function cardWithSource(cardNode, name, url) {
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
    group.appendChild(cardNode);
    group.appendChild(source);
    return group;
  }

  function render(data, pending) {
    cards.replaceChildren(
      cardWithSource(fireCard(data.fireDanger), "Bushfires NT", "https://www.pfes.nt.gov.au/incidentmap"),
      cardWithSource(airCard(data.airQuality), "NTEPA", "https://ntepa.nt.gov.au/"),
      cardWithSource(tempCard(data.temperature), "Bureau of Meteorology",
        "https://www.bom.gov.au/location/australia/northern-territory#observations"),
    );
    if (pending) cards.setAttribute("aria-busy", "true");
    else cards.removeAttribute("aria-busy");
    status.textContent = pending ? "Loading local conditions…" : "";
  }

  function load(location) {
    var id = ++requestId;
    var data = { temperature: location.temperature };
    var pending = Number(Boolean(location.workerKey)) + Number(Boolean(location.epaStation));
    render(data, pending);

    function complete(field, value) {
      if (id !== requestId) return;
      data[field] = value;
      render(data, --pending);
    }

    if (location.workerKey) {
      var url = new URL(endpoint, window.location.href);
      url.searchParams.set("location", location.workerKey);
      fetch(url.href)
        .then(function (response) {
          if (!response.ok) throw new Error(response.status);
          return response.json();
        })
        .then(function (result) { complete("fireDanger", result.fireDanger); })
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
          complete("airQuality", { index: Number(value), colour: station.colour, category: station.category });
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

  select.addEventListener("change", function () {
    setLocation(select.value);
  });

  if (!navigator.geolocation) {
    useBtn.hidden = true;
  } else {
    useBtn.addEventListener("click", function () {
      status.textContent = "Finding your location…";
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var location = nearest(pos.coords.latitude, pos.coords.longitude);
          if (location) setLocation(location.key);
          else status.textContent = "No locations with coordinates are available.";
        },
        function () {
          status.textContent = "Your location could not be determined.";
        },
      );
    });
  }

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
    return Array.from(xml.querySelectorAll("observations > station")).map(function (station) {
      var name = station.getAttribute("description");
      return {
        key: station.getAttribute("bom-id"),
        name: name,
        lat: numberAttribute(station, "lat"),
        lon: numberAttribute(station, "lon"),
        workerKey: Object.prototype.hasOwnProperty.call(workerKeys, name) ? workerKeys[name] : null,
        epaStation: Object.prototype.hasOwnProperty.call(epaStations, name) ? epaStations[name] : null,
        temperature: {
          min: temperature(station, "minimum_air_temperature"),
          max: temperature(station, "maximum_air_temperature"),
        },
      };
    }).filter(function (location) {
      return location.key && location.name;
    }).sort(function (first, second) {
      return first.name.localeCompare(second.name);
    });
  }

  function readAirStations(data) {
    if (isLocal) {
      if (!Array.isArray(data.stations)) throw new Error("Invalid EPA station list");
      return data.stations;
    }
    if (!Array.isArray(data.d)) throw new Error("Invalid EPA station feed");
    return data.d.filter(function (station) { return station != null; }).map(function (station) {
      return { id: station.serialCode, name: station.name, index: station.IndexValue,
        colour: station.IndexColorStrHex, category: station.IndexColorDescription };
    });
  }

  function addAirLocations(data) {
    readAirStations(data).forEach(function (station) {
      if (!Number.isInteger(station.id) || station.id < 1 || station.id > 4 ||
          typeof station.name !== "string" || !station.name.trim()) return;
      var name = station.name.trim();
      var existing = locations.find(function (location) {
        return location.name.toLowerCase() === name.toLowerCase();
      });
      if (existing) {
        existing.epaStation = station.id;
        return;
      }
      if (locations.some(function (location) { return location.key === "epa-" + station.id; })) return;
      locations.push({
        key: "epa-" + station.id,
        name: name,
        lat: null,
        lon: null,
        workerKey: station.id === 1 ? "palmerston" : station.id === 4 ? "katherine" : "darwin",
        epaStation: station.id,
        temperature: null,
      });
    });
    locations.sort(function (first, second) { return first.name.localeCompare(second.name); });
  }

  status.textContent = "Loading local conditions…";
  cards.setAttribute("aria-busy", "true");
  fetch(observationsUrl)
    .then(function (response) {
      if (!response.ok) throw new Error(response.status);
      return response.text();
    })
    .then(function (text) {
      locations = readLocations(text);
      if (!locations.length) throw new Error("No BOM locations");
      return fetch(airQualityUrl)
        .then(function (response) {
          if (!response.ok) throw new Error(response.status);
          return response.json();
        })
        .then(addAirLocations)
        .catch(function () {});
    })
    .then(function () {
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
      useBtn.disabled = false;

      var saved = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      var initial = locations.find(function (location) { return location.key === saved; }) ||
        (saved && locations.find(function (location) { return location.workerKey === saved; })) ||
        locations.find(function (location) { return location.name === "Darwin Airport"; }) ||
        locations.find(function (location) { return !location.key.startsWith("epa-"); }) ||
        locations[0];
      setLocation(initial.key);
    })
    .catch(function () {
      render({});
      status.textContent = "Local conditions locations are currently unavailable.";
    });
})();
