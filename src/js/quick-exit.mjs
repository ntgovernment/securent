export function guardQuickExit(window) {
  const quickExit = window.quickExit;
  if (typeof quickExit !== "function") return;

  window.quickExit = function (...args) {
    if (!window.document.getElementById("quickexit")) return;
    return quickExit.apply(this, args);
  };
}