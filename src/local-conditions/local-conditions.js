import "./local-conditions.css";

/* ==========================================================================
   #local-conditions – Location select + BOM / NT EPA condition cards
   Data comes from the proxy in worker.js (same folder).
   ========================================================================== */
(function () {
  var root = document.getElementById("local-conditions");
  if (!root) return;

  var endpoint = root.dataset.endpoint || "/api/local-conditions";
  var STORAGE_KEY = "securent.localConditions.location";

  var LOCATIONS = [
    { key: "darwin", name: "Darwin", lat: -12.46, lon: 130.84 },
    { key: "palmerston", name: "Palmerston", lat: -12.48, lon: 130.98 },
    { key: "alice-springs", name: "Alice Springs", lat: -23.7, lon: 133.88 },
    { key: "katherine", name: "Katherine", lat: -14.46, lon: 132.26 },
    { key: "tennant-creek", name: "Tennant Creek", lat: -19.65, lon: 134.19 },
    { key: "nhulunbuy", name: "Nhulunbuy", lat: -12.18, lon: 136.78 },
    { key: "yulara", name: "Yulara", lat: -25.24, lon: 130.99 },
  ];

  var FIRE_COLOURS = ["#5fb830", "#f4d63a", "#f28100", "#a80a0a"];
  var AIR_COLOURS = {
    good: "#5fb830",
    fair: "#f4d63a",
    poor: "#f28100",
    "very poor": "#a80a0a",
    "extremely poor": "#6b0000",
  };

  var select = root.querySelector(".lc-select");
  var useBtn = root.querySelector(".lc-use-location");
  var cards = root.querySelector(".lc-cards");
  var status = root.querySelector(".lc-status");
  var requestId = 0;

  LOCATIONS.forEach(function (l) {
    var opt = document.createElement("option");
    opt.value = l.key;
    opt.textContent = l.name;
    select.appendChild(opt);
  });

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
    c.appendChild(el("p", "lc-card__none", "Currently unavailable"));
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
    if (data.level >= 0) {
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
    if (!data) return unavailable(c);

    var row = el("div", "lc-card__row");
    var value = el("span", "lc-card__value");
    if (data.pm25 != null) {
      value.textContent = data.pm25;
      value.appendChild(el("span", "lc-card__unit", " PM2.5 µg/m³"));
    }
    row.appendChild(value);

    var badge = el("span", "lc-air");
    var dot = el("span", "lc-air__dot");
    dot.style.background = AIR_COLOURS[data.category.toLowerCase()] || "#999";
    badge.appendChild(dot);
    badge.appendChild(document.createTextNode(data.category));
    row.appendChild(badge);
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
      p.appendChild(document.createTextNode(v == null ? "–" : v + " °C"));
      return p;
    }

    var row = el("div", "lc-card__row");
    row.appendChild(part("▼", "Minimum", data.min));
    row.appendChild(part("▲", "Maximum", data.max));
    c.appendChild(row);
    return c;
  }

  function render(data) {
    cards.replaceChildren(
      fireCard(data.fireDanger),
      airCard(data.airQuality),
      tempCard(data.temperature),
    );
    cards.removeAttribute("aria-busy");
    status.textContent = "";
  }

  function load(key) {
    var id = ++requestId;
    cards.setAttribute("aria-busy", "true");
    status.textContent = "Loading local conditions…";
    fetch(endpoint + "?location=" + encodeURIComponent(key))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        if (id === requestId) render(data);
      })
      .catch(function () {
        if (id !== requestId) return;
        cards.replaceChildren();
        cards.removeAttribute("aria-busy");
        status.textContent =
          "Local conditions are currently unavailable. Please try again later.";
      });
  }

  function setLocation(key) {
    select.value = key;
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e) {
      /* storage may be blocked */
    }
    load(key);
  }

  function nearest(lat, lon) {
    var best = LOCATIONS[0];
    var bestD = Infinity;
    LOCATIONS.forEach(function (l) {
      var dLat = l.lat - lat;
      var dLon = (l.lon - lon) * Math.cos((lat * Math.PI) / 180);
      var d = dLat * dLat + dLon * dLon;
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
          setLocation(nearest(pos.coords.latitude, pos.coords.longitude).key);
        },
        function () {
          status.textContent = "Your location could not be determined.";
        },
      );
    });
  }

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  var initial = LOCATIONS.some(function (l) {
    return l.key === saved;
  })
    ? saved
    : "darwin";
  setLocation(initial);
})();
