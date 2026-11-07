(function () {
  var shareButtons = document.querySelectorAll(
    ".ntg-social-share--enabled .ntg-social-share__link",
  );

  Array.prototype.forEach.call(
    document.querySelectorAll(".ntg-social-share__link[href]"),
    function (link) {
      var href = link.getAttribute("href");
      if (href.indexOf("%frontend_asset_url%") !== -1) {
        link.href = href.replace(
          "%frontend_asset_url%",
          encodeURIComponent(decodeURI(window.location.href)),
        );
      }
    },
  );

  Array.prototype.forEach.call(shareButtons, function (button) {
    button.addEventListener("click", function (event) {
      var width = 650;
      var height = 450;

      event.preventDefault();
      window.open(
        button.href,
        "Share Dialog",
        "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,width=" +
          width +
          ",height=" +
          height +
          ",top=" +
          (screen.height / 2 - height / 2) +
          ",left=" +
          (screen.width / 2 - width / 2),
      );
    });
  });

  var copyButton = document.querySelector(".ntg-social-share--copy");
  if (!copyButton) return;

  copyButton.classList.remove("external");
  copyButton.addEventListener("click", function (event) {
    var url = window.location.href.split("#void")[0];

    event.preventDefault();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showCopiedAlert, function () {
        if (copyWithExecCommand(url)) showCopiedAlert();
      });
      return;
    }

    if (copyWithExecCommand(url)) showCopiedAlert();
  });

  function copyWithExecCommand(text) {
    var input = document.createElement("input");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.focus();
    input.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(input);
    return copied;
  }

  function showCopiedAlert() {
    var alert = document.getElementById("fade-text");
    if (!alert) return;

    alert.classList.remove("d-none");
    alert.classList.add("fadeIn");
    window.setTimeout(function () {
      alert.classList.add("d-none");
      alert.classList.remove("fadeIn");
    }, 1500);
  }
})();