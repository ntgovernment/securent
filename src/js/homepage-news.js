document
  .querySelectorAll(".homepage-news .card-header .float-start")
  .forEach(function (el) {
    el.classList.remove("inline-block", "float-start");
    el.classList.add("card-tag");
    var icon = el.querySelector("i");
    if (icon) icon.remove();
  });
