import "./homepage-news.js";
import "./display-cards.js";
import "../hero-banners/hero-banners.js";
import { primaryNavigation } from "../data/navigation.js";

/* Expand the desktop search field when the icon is activated empty. */
(function () {
  const form = document.querySelector("nav.nav-masthead .ntg-header-search");
  if (!form) return;

  const input = form.querySelector('input[name="query"]');
  if (!input) return;

  form.addEventListener("submit", function (event) {
    if (input.value.trim()) return;
    event.preventDefault();
    input.focus();
  });
})();

/* ===========================================================================
   Responsive navigation drawer and nested menus
   ========================================================================== */
(function () {
  const nav = document.querySelector("nav.nav-masthead");
  const header = nav && nav.closest(".ntg-header");
  const menuList = nav && nav.querySelector(".ntg-main-nav__links");
  const headerTools = header && header.querySelector(".header-tools");
  if (!nav || !header || !menuList || !headerTools) return;

  const menuId = "primary-navigation";
  nav.id = menuId;
  nav.classList.remove("d-none", "d-md-flex");

  const descriptions = new Map();
  menuList.querySelectorAll(":scope > li").forEach(function (item) {
    const link = item.querySelector(":scope > a");
    if (!link) return;
    const description = (item.dataset.description ?? link.dataset.description ?? "").trim();
    if (description) descriptions.set(link.href, description);
  });

  function renderItems(items, isRoot) {
    const list = document.createElement("ul");
    list.className = isRoot ? "ntg-main-nav__links" : "ntg-main-nav__submenu";

    items.forEach(function (item) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      const label = document.createElement("span");
      link.href = item.href;
      label.className = "ntg-main-nav__label";
      label.textContent = item.label;
      link.append(label);
      listItem.append(link);

      if (item.children) {
        listItem.classList.add("has-children");
        listItem.append(renderItems(item.children, false));
      }

      list.append(listItem);
    });

    return list;
  }

  function makeLink(item) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    return link;
  }

  function renderDesktopMenu(items) {
    const list = document.createElement("ul");
    list.className = "desktop-main-nav";

    items.forEach(function (item, index) {
      const listItem = document.createElement("li");
      if (!item.children || !item.children.length) {
        listItem.append(makeLink(item));
        list.append(listItem);
        return;
      }

      const button = document.createElement("button");
      const panel = document.createElement("div");
      const overview = document.createElement("div");
      const overviewTitle = document.createElement("div");
      const columns = document.createElement("div");
      button.type = "button";
      button.textContent = item.label;
      button.id = "desktop-navigation-trigger-" + index;
      button.setAttribute("aria-controls", "desktop-navigation-panel-" + index);
      button.setAttribute("aria-expanded", "false");
      panel.id = "desktop-navigation-panel-" + index;
      panel.className = "desktop-main-nav__panel";
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", button.id);
      panel.hidden = true;
      overview.className = "desktop-main-nav__overview";
      overviewTitle.className = "desktop-main-nav__overview-title";
      overviewTitle.textContent = item.label;
      overview.append(overviewTitle);
      const description = item.description || descriptions.get(new URL(item.href, document.baseURI).href);
      if (description) {
        const paragraph = document.createElement("p");
        paragraph.textContent = description;
        overview.append(paragraph);
      }
      const overviewLink = makeLink(item);
      overviewLink.textContent = "Find out more";
      overviewLink.setAttribute("aria-label", "Find out more about " + item.label);
      overview.append(overviewLink);
      columns.className = "desktop-main-nav__columns";
      item.children.forEach(function (child) {
        const group = document.createElement("section");
        const groupTitle = document.createElement("div");
        groupTitle.className = "desktop-main-nav__group-title";
        groupTitle.append(makeLink(child));
        group.append(groupTitle);
        if (child.children && child.children.length) {
          const childList = document.createElement("ul");
          child.children.forEach(function (grandchild) {
            const childItem = document.createElement("li");
            childItem.append(makeLink(grandchild));
            childList.append(childItem);
          });
          group.append(childList);
        }
        columns.append(group);
      });
      panel.append(overview, columns);
      listItem.append(button, panel);
      list.append(listItem);
    });
    return list;
  }

  const renderedMenu = renderItems(primaryNavigation, true);
  renderedMenu.classList.add("mobile-main-nav");
  const desktopMenu = renderDesktopMenu(primaryNavigation);
  menuList.replaceWith(desktopMenu, renderedMenu);

  function closeDesktopMenu(returnFocus) {
    const expanded = desktopMenu.querySelector('button[aria-expanded="true"]');
    if (!expanded) return;
    expanded.setAttribute("aria-expanded", "false");
    document.getElementById(expanded.getAttribute("aria-controls")).hidden = true;
    if (returnFocus) expanded.focus();
  }

  desktopMenu.addEventListener("click", function (event) {
    const button = event.target.closest("button[aria-controls]");
    if (!button || !desktopMenu.contains(button)) return;
    const opening = button.getAttribute("aria-expanded") !== "true";
    closeDesktopMenu(false);
    if (opening) {
      button.setAttribute("aria-expanded", "true");
      document.getElementById(button.getAttribute("aria-controls")).hidden = false;
    }
  });

  desktopMenu.addEventListener("focusout", function (event) {
    if (!desktopMenu.contains(event.relatedTarget)) closeDesktopMenu(false);
  });

  const menuButton = document.createElement("button");
  menuButton.className = "mobile-menu-toggle";
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", "Open navigation menu");
  menuButton.setAttribute("aria-controls", menuId);
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = "<span></span><span></span><span></span>";

  const searchButton = document.createElement("button");
  searchButton.className = "mobile-search-toggle";
  searchButton.type = "button";
  searchButton.setAttribute("aria-label", "Open search");
  searchButton.setAttribute("aria-expanded", "false");
  searchButton.innerHTML = '<span class="fa-regular fa-magnifying-glass" aria-hidden="true"></span>';
  headerTools.append(searchButton, menuButton);

  const closeButton = document.createElement("button");
  closeButton.className = "mobile-nav-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close navigation menu");
  closeButton.innerHTML = '<span class="fa-regular fa-xmark" aria-hidden="true"></span>';
  nav.prepend(closeButton);

  const backdrop = document.createElement("button");
  backdrop.className = "mobile-menu-backdrop";
  backdrop.type = "button";
  backdrop.tabIndex = -1;
  backdrop.setAttribute("aria-label", "Close navigation menu");
  backdrop.hidden = true;
  const navbar = header.querySelector(".navbar");
  navbar.insertBefore(backdrop, navbar.querySelector(".header-navigation"));

  const emergencyLink = headerTools.querySelector('a[href*="/emergency-contacts"]');
  if (emergencyLink) {
    const emergencyItem = document.createElement("li");
    emergencyItem.className = "mobile-emergency-link";
    emergencyItem.innerHTML = emergencyLink.outerHTML;
    renderedMenu.append(emergencyItem);
  }

  const parents = Array.from(renderedMenu.querySelectorAll("li")).filter(function (item) {
    return item.querySelector(":scope > ul");
  });
  let previousBodyOverflow = "";

  parents.forEach(function (item, index) {
    const childList = item.querySelector(":scope > ul");
    const link = item.querySelector(":scope > a");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-submenu-toggle";
    toggle.innerHTML = '<span class="fa-regular fa-chevron-right" aria-hidden="true"></span>';
    item.classList.add("has-children");
    childList.id = "navigation-submenu-" + index;
    childList.hidden = true;
    toggle.setAttribute("aria-controls", childList.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Expand " + link.textContent.trim() + " submenu");
    toggle.title = toggle.getAttribute("aria-label");
    link.after(toggle);
  });

  let wrappedLabelFrame = 0;

  function updateWrappedLabels() {
    cancelAnimationFrame(wrappedLabelFrame);
    wrappedLabelFrame = requestAnimationFrame(function () {
      renderedMenu.querySelectorAll(".ntg-main-nav__label").forEach(function (label) {
        if (label.closest("ul[hidden]")) return;

        const lineHeight = parseFloat(getComputedStyle(label).lineHeight);
        label.parentElement.classList.toggle(
          "is-multiline",
          label.getBoundingClientRect().height > lineHeight + 1,
        );
      });
    });
  }

  updateWrappedLabels();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateWrappedLabels);

  function setExpanded(item, expanded) {
    const childList = item.querySelector(":scope > ul");
    const link = item.querySelector(":scope > a");
    const toggle = item.querySelector(":scope > .mobile-submenu-toggle");
    item.classList.toggle("open", expanded);
    childList.hidden = !expanded;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", (expanded ? "Collapse " : "Expand ") + link.textContent.trim() + " submenu");
    toggle.title = toggle.getAttribute("aria-label");
    updateWrappedLabels();
  }

  function closeNested(item) {
    item.querySelectorAll("li.has-children.open").forEach(function (child) {
      setExpanded(child, false);
    });
  }

  function closeAll() {
    parents.forEach(function (item) {
      setExpanded(item, false);
    });
  }

  function setMenuOpen(open, returnFocus) {
    if (open) previousBodyOverflow = document.body.style.overflow;
    else closeAll();
    header.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    backdrop.hidden = !open;
    document.body.classList.toggle("mobile-menu-open", open);
    document.body.style.overflow = open ? "hidden" : previousBodyOverflow;
    if (open) updateWrappedLabels();
    if (open) closeButton.focus();
    else if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener("click", function () {
    setMenuOpen(!header.classList.contains("menu-open"), false);
  });

  closeButton.addEventListener("click", function () {
    setMenuOpen(false, true);
  });

  backdrop.addEventListener("click", function () {
    setMenuOpen(false, true);
  });

  searchButton.addEventListener("click", function () {
    if (header.classList.contains("menu-open")) setMenuOpen(false, false);
    const isOpen = document.body.classList.toggle("mobile-search-open");
    searchButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    searchButton.setAttribute("aria-label", isOpen ? "Close search" : "Open search");
    if (isOpen) {
      const input = document.querySelector(".mobile-banner .ntg-header-search input[name='query']");
      if (input) input.focus();
    }
  });

  renderedMenu.addEventListener("click", function (event) {
    const control = event.target.closest("a, .mobile-submenu-toggle");
    const item = control && control.parentElement;
    if (!item || !renderedMenu.contains(item)) return;

    if (control.classList.contains("mobile-submenu-toggle")) {
      const expanded = control.getAttribute("aria-expanded") === "true";
      const siblings = Array.from(item.parentElement.children).filter(function (sibling) {
        return sibling !== item && sibling.classList.contains("has-children");
      });
      siblings.forEach(function (sibling) {
        setExpanded(sibling, false);
        closeNested(sibling);
      });
      setExpanded(item, !expanded);
      if (expanded) closeNested(item);
      return;
    }

    if (header.classList.contains("menu-open")) setMenuOpen(false, false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (header.classList.contains("menu-open")) setMenuOpen(false, true);
      else closeDesktopMenu(true);
      if (document.body.classList.contains("mobile-search-open")) {
        document.body.classList.remove("mobile-search-open");
        searchButton.setAttribute("aria-expanded", "false");
        searchButton.setAttribute("aria-label", "Open search");
      }
      return;
    }

    if (event.key === "Tab" && header.classList.contains("menu-open")) {
      const focusable = Array.from(nav.querySelectorAll("a[href], button:not([disabled])")).filter(function (element) {
        return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
      });
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) {
      closeAll();
      closeDesktopMenu(false);
    }
  });

  window.addEventListener("resize", function () {
    updateWrappedLabels();
    if (window.innerWidth < 768) closeDesktopMenu(false);
    if (window.innerWidth >= 768 && header.classList.contains("menu-open")) {
      setMenuOpen(false, false);
    }
  });
})();
