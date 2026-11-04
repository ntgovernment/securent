/* ==========================================================================
   #display-cards – Swap FA 5 Light icons to FA 6 Solid
   The CMS renders .ntg-display-cards icons with `fal` (FA 5 Light).
   This replaces `fal` with `fa-solid` so icons match the FA 6 Pro kit.
   ========================================================================== */
document.querySelectorAll(".ntg-display-cards i.fal").forEach(function (icon) {
  icon.classList.remove("fal");
  icon.classList.add("fa-solid");
});
