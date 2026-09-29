/* ==========================================================================
   DiChiaro Baseball & Softball Academy
   Site behaviour. Small, dependency free, progressive.
   ========================================================================== */

(function () {
  "use strict";

  /* --- Image placeholders -----------------------------------------------
     Until the final photography lands, an image file that is not on disk
     falls back to the labelled placeholder from the Figma comps rather
     than a broken image icon. Remove nothing when the files arrive: the
     handler simply never fires. */

  function markEmpty(img) {
    var holder = img.closest(".media");
    if (holder) holder.classList.add("media--empty");
  }

  Array.prototype.forEach.call(document.querySelectorAll(".media img"), function (img) {
    if (img.complete && img.naturalWidth === 0) markEmpty(img);
    img.addEventListener("error", function () { markEmpty(img); });
  });

  /* --- Mobile menu ------------------------------------------------------- */

  var menu = document.getElementById("mobile-menu");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");
  var lastFocused = null;

  function setMenu(open) {
    if (!menu || !openBtn) return;
    menu.setAttribute("data-open", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    openBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
    if (open) {
      lastFocused = document.activeElement;
      var first = menu.querySelector("a, button");
      if (first) first.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  }

  if (openBtn) openBtn.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && menu.getAttribute("data-open") === "true") setMenu(false);
  });

  /* Close the menu if the viewport grows past the desktop breakpoint while
     it is open, so the page is never left scroll locked. */
  var desktop = window.matchMedia("(min-width: 1024px)");
  var onChange = function (e) { if (e.matches) setMenu(false); };
  if (desktop.addEventListener) desktop.addEventListener("change", onChange);
  else if (desktop.addListener) desktop.addListener(onChange);

  /* --- Filters -----------------------------------------------------------
     Used by the camps listing and the instructors roster. Progressive: with
     no JavaScript every card stays visible and the pills are inert, so the
     page still does its job. The filter is a single choice, which keeps the
     result legible and the count honest. */

  var grid = document.querySelector("[data-filter-grid]");
  var pills = document.querySelectorAll("[data-filter]");
  var count = document.querySelector("[data-filter-count]");
  var empty = document.querySelector("[data-filter-empty]");

  if (grid && pills.length) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-tags]"));
    var noun = grid.getAttribute("data-filter-noun") || "";

    var apply = function (filter) {
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      Array.prototype.forEach.call(pills, function (p) {
        p.setAttribute("aria-pressed", String(p.getAttribute("data-filter") === filter));
      });
      if (count) {
        count.textContent = "Showing " + shown + (shown === 1 && noun ? " " + noun : "");
      }
      if (empty) empty.hidden = shown !== 0;
    };

    Array.prototype.forEach.call(pills, function (p) {
      p.addEventListener("click", function () { apply(p.getAttribute("data-filter")); });
    });

    apply("all");
  }

  /* --- Instructor bios ----------------------------------------------------
     The card expands in place to the full row width and the cards below it
     push down. One card open at a time, so the page never becomes a wall of
     open bios. With no JavaScript the button does nothing and the summary
     credentials are still on the page. */

  var toggles = document.querySelectorAll("[data-person-toggle]");
  Array.prototype.forEach.call(toggles, function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest("[data-person]");
      var open = card.classList.contains("is-open");

      Array.prototype.forEach.call(document.querySelectorAll("[data-person].is-open"), function (c) {
        c.classList.remove("is-open");
        var t = c.querySelector("[data-person-toggle]");
        t.setAttribute("aria-expanded", "false");
        t.querySelector("[data-toggle-label]").textContent = "Read full bio";
        t.querySelector(".sign").textContent = "+";
      });

      if (!open) {
        card.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector("[data-toggle-label]").textContent = "Close";
        btn.querySelector(".sign").textContent = "\u2212";
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });

  /* --- Prototype forms ----------------------------------------------------
     The marketing forms are not wired to anything yet. Rather than fake a
     success message, the form validates, then says plainly that nothing was
     sent and what the built version will do. */

  Array.prototype.forEach.call(document.querySelectorAll("[data-proto-form]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
        var field = el.closest(".field");
        var bad = !el.value || (el.type === "email" && el.value.indexOf("@") === -1);
        if (field) field.classList.toggle("is-invalid", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var notice = document.querySelector("[data-proto-notice]");
      if (notice) { notice.hidden = false; notice.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    });
  });

  /* --- Marquee -----------------------------------------------------------
     The track holds the run of words twice. The animation translates by
     50%, so the loop is seamless whatever the content length. The second
     copy is hidden from assistive technology. */

  var track = document.querySelector(".marquee__track");
  if (track && track.children.length === 1) {
    var clone = track.children[0].cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  }
})();
