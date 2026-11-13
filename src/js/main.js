import "./homepage-news.js";
import "./display-cards.js";
import "../hero-banners/hero-banners.js";
import { guardQuickExit } from "./quick-exit.mjs";

guardQuickExit(window);

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
  if (!nav || !header || !menuList || !headerTools || !menuList.classList.contains("cms-main-nav")) return;
  if (nav.dataset.navigationReady) return;
  const navbar = header.querySelector(".navbar");
  if (!navbar) return;
  nav.dataset.navigationReady = "true";

  const menuId = "primary-navigation";
  nav.id = menuId;
  nav.classList.remove("d-none", "d-md-flex");

  const renderedMenu = menuList;
  renderedMenu.classList.add("mobile-main-nav");

  function childContainer(item) {
    return item.querySelector(":scope > .desktop-main-nav__panel, :scope > ul");
  }

  function isDesktop() {
    return window.innerWidth >= 768;
  }

  function closeDesktopMenu(returnFocus) {
    const expanded = renderedMenu.querySelector(':scope > li > button[aria-expanded="true"]:not([hidden])');
    if (!expanded || !isDesktop()) return;
    setExpanded(expanded.parentElement, false);
    if (returnFocus) expanded.focus();
  }

  renderedMenu.addEventListener("focusout", function (event) {
    if (!renderedMenu.contains(event.relatedTarget)) closeDesktopMenu(false);
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
  navbar.insertBefore(backdrop, navbar.querySelector(".header-navigation"));

  const parents = Array.from(renderedMenu.querySelectorAll("li")).filter(function (item) {
    const child = childContainer(item);
    const link = item.querySelector(":scope > a");
    const toggle = item.querySelector(":scope > .mobile-submenu-toggle");
    const desktopToggle = item.querySelector(":scope > .desktop-main-nav__toggle");
    const hasChildren = child && child.querySelector("li > a");
    if (!hasChildren && toggle) toggle.hidden = true;
    if (!hasChildren && desktopToggle) desktopToggle.hidden = true;
    if (child && !hasChildren) child.hidden = true;
    return hasChildren && link && toggle;
  });
  let previousBodyOverflow = "";

  parents.forEach(function (item, index) {
    const childList = childContainer(item);
    const link = item.querySelector(":scope > a");
    const toggle = item.querySelector(":scope > .mobile-submenu-toggle");
    item.classList.add("has-children");
    childList.id = menuId + "-submenu-" + index;
    toggle.id = menuId + "-toggle-" + index;
    toggle.hidden = false;
    toggle.setAttribute("aria-controls", childList.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Expand " + link.textContent.trim() + " submenu");
    toggle.title = toggle.getAttribute("aria-label");
    const desktopToggle = item.querySelector(":scope > .desktop-main-nav__toggle");
    if (desktopToggle) {
      desktopToggle.id = menuId + "-desktop-toggle-" + index;
      desktopToggle.setAttribute("aria-controls", childList.id);
      desktopToggle.setAttribute("aria-expanded", "false");
    }
    if (childList.classList.contains("desktop-main-nav__panel")) {
      childList.setAttribute("role", "region");
      childList.setAttribute("aria-labelledby", toggle.id);
    }
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
    const childList = childContainer(item);
    const link = item.querySelector(":scope > a");
    const toggle = item.querySelector(":scope > .mobile-submenu-toggle");
    const desktopToggle = item.querySelector(":scope > .desktop-main-nav__toggle");
    const root = item.parentElement === renderedMenu;
    const desktop = isDesktop();
    item.classList.toggle("open", expanded);
    childList.hidden = desktop && !root ? false : !expanded;
    toggle.hidden = desktop && (!root || Boolean(desktopToggle));
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.setAttribute("aria-label", (expanded ? "Collapse " : "Expand ") + link.textContent.trim() + " submenu");
    toggle.title = toggle.getAttribute("aria-label");
    if (desktopToggle) {
      desktopToggle.hidden = !desktop;
      desktopToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      link.hidden = desktop;
      childList.setAttribute("aria-labelledby", desktop ? desktopToggle.id : toggle.id);
    }
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

  closeAll();
  nav.classList.add("navigation-enhanced");

  function setMenuOpen(open, returnFocus) {
    if (open && !header.classList.contains("menu-open")) previousBodyOverflow = document.body.style.overflow;
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
    const control = event.target.closest("a, .mobile-submenu-toggle, .desktop-main-nav__toggle");
    const item = control && control.parentElement;
    if (!item || !renderedMenu.contains(item)) return;

    if (control.classList.contains("mobile-submenu-toggle") || control.classList.contains("desktop-main-nav__toggle")) {
      if (!parents.includes(item) || (isDesktop() && item.parentElement !== renderedMenu)) return;
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
    else closeDesktopMenu(false);
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

  let wasDesktop = isDesktop();
  window.addEventListener("resize", function () {
    updateWrappedLabels();
    const desktop = isDesktop();
    if (desktop !== wasDesktop) {
      if (header.classList.contains("menu-open")) setMenuOpen(false, false);
      closeAll();
      wasDesktop = desktop;
    }
  });
})();
