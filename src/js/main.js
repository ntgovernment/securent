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

  function renderItems(items, isRoot) {
    const list = document.createElement("ul");
    list.className = isRoot ? "ntg-main-nav__links" : "ntg-main-nav__submenu";

    items.forEach(function (item) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      listItem.append(link);

      if (item.children) {
        listItem.classList.add("has-children");
        listItem.append(renderItems(item.children, false));
      }

      list.append(listItem);
    });

    return list;
  }

  menuList.replaceWith(renderItems(primaryNavigation, true));
  const renderedMenu = nav.querySelector(".ntg-main-nav__links");

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
    item.classList.add("has-children");
    childList.id = "navigation-submenu-" + index;
    childList.hidden = true;
    link.setAttribute("aria-controls", childList.id);
    link.setAttribute("aria-expanded", "false");
  });

  function setExpanded(item, expanded) {
    const childList = item.querySelector(":scope > ul");
    const link = item.querySelector(":scope > a");
    item.classList.toggle("open", expanded);
    childList.hidden = !expanded;
    link.setAttribute("aria-expanded", expanded ? "true" : "false");
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
    const link = event.target.closest("a");
    const item = link && link.parentElement;
    if (!item || !renderedMenu.contains(item)) return;

    if (item.classList.contains("has-children")) {
      event.preventDefault();
      const expanded = link.getAttribute("aria-expanded") === "true";
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
    if (!nav.contains(event.target)) closeAll();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768 && header.classList.contains("menu-open")) {
      setMenuOpen(false, false);
    }
  });
})();
