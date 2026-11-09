export function getAutocompleteSuggestions(query, candidates, limit = 5) {
  const search = query.trim().toLocaleLowerCase();
  if (search.length < 2 || limit <= 0) return [];

  const seen = new Set();
  const matches = [];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const value = candidate.trim();
    const normalized = value.toLocaleLowerCase();
    if (!value || !normalized.startsWith(search) || seen.has(normalized)) continue;
    seen.add(normalized);
    matches.push(value);
    if (matches.length === limit) break;
  }
  return matches;
}

export function attachAutocomplete(input, listbox, getCandidates) {
  const document = input.ownerDocument;
  const Event = document.defaultView.Event;
  let activeIndex = -1;

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-controls", listbox.id);
  input.setAttribute("aria-expanded", "false");
  listbox.setAttribute("role", "listbox");
  listbox.hidden = true;

  function close() {
    listbox.hidden = true;
    listbox.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function select(option) {
    input.value = option.textContent;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    close();
    input.focus();
  }

  function setActive(index) {
    const options = [...listbox.querySelectorAll('[role="option"]')];
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      const selected = optionIndex === activeIndex;
      option.setAttribute("aria-selected", String(selected));
      if (selected) input.setAttribute("aria-activedescendant", option.id);
    });
  }

  function update() {
    close();
    const suggestions = getAutocompleteSuggestions(input.value, getCandidates());
    if (!suggestions.length) return;

    suggestions.forEach((suggestion, index) => {
      const option = document.createElement("li");
      option.id = `${listbox.id}-option-${index}`;
      option.className = "search-autocomplete__option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = suggestion;
      listbox.append(option);
    });
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  input.addEventListener("input", update);
  input.addEventListener("keydown", (event) => {
    const options = listbox.querySelectorAll('[role="option"]');
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      setActive(activeIndex < 0 ? options.length - 1 : activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      select(options[activeIndex]);
    } else if (event.key === "Escape" && !listbox.hidden) {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  });
  listbox.addEventListener("pointerdown", (event) => event.preventDefault());
  listbox.addEventListener("click", (event) => {
    const option = event.target.closest('[role="option"]');
    if (option && listbox.contains(option)) select(option);
  });
  input.addEventListener("blur", close);

  return {
    refresh() {
      if (document.activeElement === input) update();
    },
  };
}

export function getAutocompleteCandidates(values) {
  const candidates = new Set();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const segments = value.split(/\s*(?:[-\u2010-\u2015,;|])\s*/).map((segment) => segment.trim()).filter(Boolean);
    for (const segment of segments) {
      const words = segment.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
      for (let length = Math.min(3, words.length); length >= 1; length -= 1) {
        for (let start = 0; start + length <= words.length; start += 1) {
          const candidate = words.slice(start, start + length).join(" ");
          if (candidate.toLocaleLowerCase() !== "not identified") candidates.add(candidate);
        }
      }
    }
  }
  return [...candidates];
}

export function getPlaceSearchValues(record) {
  const fields = ["town", "Town", "street", "Street", "suburb", "Suburb", "locality", "Locality", "address", "Address"];
  return fields.flatMap((field) => {
    const value = record?.[field];
    const values = Array.isArray(value) ? value : [value];
    return values.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
  });
}