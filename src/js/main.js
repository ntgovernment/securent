import "./homepage-news.js";
import "./display-cards.js";

/* ==========================================================================
   #mainmenu – Click-to-open dropdown behaviour
   Toggles the .open class on <li> elements that have child <ul> menus.
   Clicking outside or pressing Escape closes all open menus.
   ========================================================================== */
(function () {
  const nav = document.querySelector(".ntg-main-nav__links");
  if (!nav) return;

  // All parent <li> elements that contain a dropdown <ul>
  const parents = nav.querySelectorAll("li.has-children");

  function closeAll(except) {
    parents.forEach(function (li) {
      if (li !== except) li.classList.remove("open");
      // Also close any open third-level children inside
      li.querySelectorAll("li.open").forEach(function (child) {
        if (child !== except) child.classList.remove("open");
      });
    });
  }

  parents.forEach(function (li) {
    var toggle = li.querySelector(":scope > a");
    if (!toggle) return;

    toggle.addEventListener("click", function (e) {
      // If the link is just a "#" or has children, prevent navigation and toggle
      e.preventDefault();
      var wasOpen = li.classList.contains("open");
      // Close siblings at the same level
      var siblings = li.parentElement.querySelectorAll(
        ":scope > li.has-children",
      );
      siblings.forEach(function (sib) {
        if (sib !== li) {
          sib.classList.remove("open");
          sib.querySelectorAll("li.open").forEach(function (c) {
            c.classList.remove("open");
          });
        }
      });
      li.classList.toggle("open", !wasOpen);
    });
  });

  // Close menus when clicking outside
  document.addEventListener("click", function (e) {
    if (!nav.contains(e.target)) closeAll();
  });

  // Close menus on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });
})();

/* ==========================================================================
   #mainmenu – Hamburger toggle for mobile
   Shows/hides the nav menu on small screens via .menu-open on #mainmenu.
   ========================================================================== */
(function () {
  var toggleBtn = document.querySelector(".ntg-menu-toggle");
  var mainmenu = document.getElementById("mainmenu");
  if (!toggleBtn || !mainmenu) return;

  toggleBtn.addEventListener("click", function () {
    var isOpen = mainmenu.classList.toggle("menu-open");
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close mobile menu on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mainmenu.classList.contains("menu-open")) {
      mainmenu.classList.remove("menu-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });
})();
