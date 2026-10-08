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
    if (open) document.documentElement.classList.remove("header-condensed");
    if (open) {
      lastFocused = document.activeElement;
      var first = menu.querySelector("a, button");
      if (first) first.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  }

  /* --- Sticky header -------------------------------------------------------
     The header sticks once it has been measured. Scrolling down past its
     own height slides it up by the announcement bar's height, so the bar
     leaves and the nav stays. Scrolling up by any amount brings the bar
     back, and at the top of the page it is always shown.

     Heights are measured, never hardcoded: the bar wraps to two lines on a
     phone. A ResizeObserver keeps --announce-h and --header-full current,
     and the CSS works out --header-h, the height actually on screen, which
     everything else that sticks and every anchor target sits below.

     The scroll listener is passive and runs at most once a frame. A 6px dead
     zone stops trackpad jitter flickering the bar. It never hides while the
     mobile menu is open, or while keyboard focus is inside the bar. */

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var bar = header && header.querySelector(".announce");
  var DEAD_ZONE = 6;
  var lastY = window.scrollY;
  var ticking = false;

  function setCondensed(on) {
    root.classList.toggle("header-condensed", on);
  }

  function menuOpen() {
    return !!menu && menu.getAttribute("data-open") === "true";
  }

  function measureHeader() {
    root.style.setProperty("--announce-h", bar.offsetHeight + "px");
    root.style.setProperty("--header-full", header.offsetHeight + "px");
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var delta = y - lastY;
    if (y <= header.offsetHeight || menuOpen() || bar.contains(document.activeElement)) {
      setCondensed(false);
      lastY = y;
      return;
    }
    if (Math.abs(delta) < DEAD_ZONE) return;
    setCondensed(delta > 0);
    lastY = y;
  }

  if (header && bar) {
    measureHeader();
    if (window.ResizeObserver) new ResizeObserver(measureHeader).observe(header);
    else window.addEventListener("resize", measureHeader);
    root.classList.add("has-sticky-header");
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    bar.addEventListener("focusin", function () { setCondensed(false); });
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

  /* --- Enquiry forms -----------------------------------------------------
     Contact and Team camps post to /api/enquiry, which saves the message
     for the academy. Success replaces the form with the reference and moves
     focus there. Failure keeps what was typed and gives the phone number
     and email instead. The time since the page loaded goes with the
     message, because a submit under 3 seconds is a bot. */

  var loadedAt = Date.now();
  var about = new URLSearchParams(window.location.search).get("about") || "";

  var topics = document.getElementById("about-topics");
  var topicSelect = document.getElementById("topic");
  if (topics && topicSelect && about) {
    try {
      var topic = JSON.parse(topics.textContent)[about];
      if (topic) topicSelect.value = topic;
    } catch (e) { /* no preselection */ }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-enquiry-form]"), function (form) {
    var button = form.querySelector("button[type=submit]");
    var label = button ? button.textContent : "";
    var error = form.querySelector("[data-enquiry-error]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
        var field = el.closest(".field");
        var bad = !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        if (field) field.classList.toggle("is-invalid", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;

      var fields = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.name !== "dbsa_trap") fields[el.name] = el.value;
      });

      if (error) error.hidden = true;
      button.disabled = true;
      button.textContent = "Sending...";

      fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: form.getAttribute("data-enquiry-form"),
          fields: fields,
          about: about,
          pageUrl: window.location.pathname + window.location.search,
          elapsedMs: Date.now() - loadedAt,
          trap: form.elements.dbsa_trap ? form.elements.dbsa_trap.value : ""
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || !data.reference) throw new Error(String(res.status));
            return data;
          });
        })
        .then(function (data) {
          var done = document.createElement("div");
          done.className = "form-done";
          done.innerHTML = '<h3 class="heading-m" tabindex="-1">Thanks, we\u2019ve got your message.</h3>' +
            "<p>We reply within one business day. Your reference is <span data-enquiry-ref></span>.</p>";
          done.querySelector("[data-enquiry-ref]").textContent = data.reference;
          form.parentNode.replaceChild(done, form);
          done.querySelector("h3").focus();
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = label;
          if (error) error.hidden = false;
        });
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
