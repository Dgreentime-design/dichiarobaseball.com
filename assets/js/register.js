/* ==========================================================================
   Registration.

   register.html?program=<slug> renders the program named in the link, from
   /api/programs/<slug>. That endpoint prices every option with the same
   function that prices the charge, so no total on this page can differ
   from what the server charges. An unknown or missing slug shows "we could
   not find that program" and never a different program: a silent fallback
   on a page that takes money is how a parent pays for the wrong thing.

   The three steps and the confirmation are panels on one page, switched
   client side. Step 3 posts to /api/checkout/session, which prices the
   cart again on the server and stores the registration.

   Paying online sends the parent to the payment page. Coming back is not
   proof of payment, so the confirmation screen starts at "confirming" and
   polls /api/registration/:id/status until the server, which only learns
   of a payment from a verified webhook, says confirmed or failed.

   Town and league codes are not built. When they are, a code goes to the
   server and one rate comes back. No rate, code or town name may ever
   appear in a public payload, or anyone can read the page source and see
   which towns pay less. See the registration build spec.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-progress]");
  if (!root) return;

  var state = { step: 1, method: "online", player: "Mia", program: null, option: null };
  var STORE_KEY = "dbsa-registration";

  /* ?plan= on the program page's links, mapped to option IDs. */
  var PLANS = { full: "full", two: "two-payments" };

  var panels = document.querySelectorAll("[data-step]");
  var markers = document.querySelectorAll("[data-step-marker]");

  /* --- Formatting -------------------------------------------------------- */

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function money(cents) {
    return "$" + (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));
  }
  function moneyExact(cents) { return "$" + (cents / 100).toFixed(2); }

  /* Dates in programs.json are ISO days with no time, so parse them as
     calendar dates, not as instants that a timezone could shift. */
  function day(iso) {
    var p = iso.split("-").map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function long(iso) { var d = day(iso); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]; }
  function longYear(iso) { return long(iso) + " " + day(iso).getUTCFullYear(); }
  function short(iso) { var d = day(iso); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()].slice(0, 3); }
  function monthDay(iso) { var d = day(iso); return MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCDate(); }
  function chip(iso) { var d = day(iso); return DAYS[d.getUTCDay()].slice(0, 3) + " " + short(iso); }

  /* "2:30pm - 4:00pm" reads "2:30 to 4:00pm", as the rest of the site does. */
  function span(t) {
    var parts = (t || "").split(/\s*-\s*/);
    if (parts.length !== 2) return t || "";
    var a = parts[0].match(/(am|pm)$/), b = parts[1].match(/(am|pm)$/);
    var start = a && b && a[1] === b[1] ? parts[0].slice(0, -2) : parts[0];
    return start + " to " + parts[1];
  }

  function when(schedule) {
    var plural = schedule.day ? schedule.day + "s" : "";
    if (schedule.groups && schedule.groups.length) {
      return plural + ", " + schedule.groups.map(function (g) { return g.label + " " + span(g.time); }).join(", ");
    }
    return plural + (schedule.time ? ", " + span(schedule.time) : "");
  }

  /* Whether the chosen option covers every date of the program. Monthly
     packages and single sessions do not, so no date list is shown for them
     rather than a list the parent has not bought. */
  function wholeProgram(option) {
    return !!option && (option.id === "full" || option.later.length > 0);
  }

  function laterText(o) {
    return o.later.map(function (l) { return money(l.amountCents) + " on " + longYear(l.when); }).join(", ");
  }

  /* --- Rendering --------------------------------------------------------- */

  function setAll(sel, text) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.textContent = text; });
  }
  function set(sel, text) {
    var el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  function renderProgram() {
    var p = state.program, s = p.schedule;
    var dates = s.dates;
    setAll("[data-program-name]", p.name);
    setAll("[data-program-dates]", dates.length ? monthDay(dates[0]) + " to " + monthDay(dates[dates.length - 1]) : "");
    setAll("[data-program-day]", when(s));
    setAll("[data-program-sessions]", dates.length ? String(dates.length) : "");
    setAll("[data-program-where]", p.venues.map(function (v) { return v.address.split(",")[0]; }).join(" and "));
    set("[data-line-name]", p.name + ", " + p.season);

    var again = document.querySelector("[data-register-again]");
    if (again) again.setAttribute("href", "register.html?program=" + encodeURIComponent(p.slug));

    var box = document.querySelector("[data-options]");
    if (p.options.length > 1) {
      box.innerHTML = p.options.map(function () {
        return '<label class="choice"><input type="radio" name="option">' +
          '<span class="choice__copy"><strong></strong><span></span></span></label>';
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".choice"), function (label, i) {
        var o = p.options[i];
        var input = label.querySelector("input");
        input.value = o.id;
        input.checked = !!state.option && state.option.id === o.id;
        label.querySelector("strong").textContent = o.label;
        label.querySelector(".choice__copy span").textContent = o.later.length
          ? money(o.dueNowCents) + " today, then " + laterText(o)
          : money(o.dueNowCents);
        input.addEventListener("change", function () {
          state.option = o;
          box.classList.remove("is-invalid");
          var err = document.querySelector("[data-submit-error]");
          if (err) err.textContent = "";
          renderTotals();
        });
      });
      box.hidden = false;
    }
    renderTotals();
  }

  /* Every amount on screen comes from the server's pricing of one option.
     Until an option is chosen, no total is shown at all. */
  function renderTotals() {
    var o = state.option;
    setAll("[data-total]", o ? money(o.totalCents) : "");
    set("[data-line-price]", o ? money(o.totalCents) : "");
    set("[data-due-today]", o ? money(o.dueNowCents) : "");
    set("[data-line-detail]", o ? o.label + ". One player." : "Choose an option above. One player.");
    var later = document.querySelector("[data-line-later]");
    if (later) {
      later.hidden = !(o && o.later.length);
      later.textContent = o && o.later.length
        ? "Then " + laterText(o) + "."
        : "";
    }
  }

  function renderStep(moveFocus) {
    Array.prototype.forEach.call(panels, function (p) {
      p.hidden = Number(p.getAttribute("data-step")) !== state.step;
    });
    Array.prototype.forEach.call(markers, function (m) {
      var n = Number(m.getAttribute("data-step-marker"));
      if (n < state.step) m.setAttribute("data-state", "done");
      else if (n === state.step) m.setAttribute("data-state", "now");
      else m.removeAttribute("data-state");
    });
    if (root) root.hidden = state.step > 3;

    /* The waiver carries the date it is actually signed. */
    if (state.step === 2) {
      var now = new Date();
      var input = document.querySelector("[data-sign-date]");
      if (input) input.value = now.getDate() + " " + MONTHS[now.getMonth()] + " " + now.getFullYear();
    }

    /* Move focus to the new step's heading so a keyboard or screen reader
       user lands in the right place. Not on first render: nothing should
       look focused simply because the page loaded. */
    if (moveFocus) {
      var panel = document.querySelector('[data-step="' + state.step + '"]');
      if (panel) {
        var h = panel.querySelector("h1, h2");
        if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function go(step) {
    state.step = step;
    if (history.replaceState) history.replaceState(null, "", "#step-" + step);
    renderStep(true);
  }

  function missing(heading) {
    var panel = document.querySelector("[data-program-missing]");
    if (heading) panel.querySelector("h1").textContent = heading;
    panel.hidden = false;
    root.hidden = true;
    Array.prototype.forEach.call(panels, function (p) { p.hidden = true; });
  }

  /* --- Validation -------------------------------------------------------- */

  function validate(form) {
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
      var field = el.closest(".field") || el.closest(".choice");
      var bad = el.type === "checkbox" ? !el.checked
              : el.type === "email" ? (!el.value || el.value.indexOf("@") === -1)
              : !el.value;
      if (field) field.classList.toggle("is-invalid", bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    var box = form.querySelector("[data-options]");
    if (ok && box && !box.hidden && !state.option) {
      box.classList.add("is-invalid");
      showError(form, "Choose an option to continue.");
      var first = box.querySelector("input");
      if (first) first.focus();
      ok = false;
    }
    return ok;
  }

  /* --- Steps ------------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll("[data-step-form]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var n = Number(form.getAttribute("data-step-form"));

      if (n === 1) {
        var first = document.getElementById("p1-first");
        if (first && first.value) state.player = first.value.trim();
        Array.prototype.forEach.call(document.querySelectorAll("[data-player-name]"), function (el) {
          el.textContent = state.player;
        });
        go(2);
      } else if (n === 2) {
        go(3);
      } else {
        submit(form);
      }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-goto]"), function (btn) {
    btn.addEventListener("click", function () { go(Number(btn.getAttribute("data-goto"))); });
  });

  /* --- Payment method ----------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('input[name="pay"]'), function (input) {
    input.addEventListener("change", function () {
      state.method = input.value;
      var handoff = document.querySelector("[data-handoff]");
      if (handoff) handoff.hidden = state.method !== "online";
      var label = document.querySelector("[data-submit-label]");
      if (label) {
        label.textContent = state.method === "online"
          ? "Continue to secure payment"
          : "Confirm this registration";
      }
    });
  });

  /* --- Confirmation ------------------------------------------------------- */

  /* {start} {startShort} {first} {payableTo} {mailTo} {ref} are filled from
     the program and the registration. Where a value is not known, for a
     monthly package or a return with no program remembered, the sentence
     that needs it is left out rather than guessed. */
  var COPY = {
    online: {
      eyebrow: "You\u2019re in",
      title: " is registered.",
      lede: "Your card has been charged and the receipt is on its way.",
      status: "Paid",
      paid: true,
      when: "Paid " + "today",
      accepted: "Card, through Clover",
      state: "Paid in full",
      statePart: "First payment made",
      note: "A receipt is in your inbox. Questions about the payment go to (201) 773-6858.",
      next: [["Today", "Keep this page. Your reference number is your proof of registration."],
             ["Week before", "A reminder with what to bring."],
             ["Day one", "Arrive ten minutes early.{first}"]]
    },
    facility: {
      eyebrow: "Place held",
      title: " is registered.",
      lede: "Nothing has been charged. Bring payment to the first session and we will settle up at the desk.",
      status: "Payment due at the facility",
      paid: false,
      when: "First session{startShort}",
      accepted: "Card, cash or check",
      state: "Registered, payment due",
      note: "Rather pay online? Call (201) 773-6858 and we\u2019ll send a payment link.",
      next: [["Today", "A confirmation email with the full schedule and what you owe."],
             ["Week before", "A reminder with what to bring, including payment."],
             ["Day one", "Arrive ten minutes early and pay at the desk. Card, cash or check."]]
    },
    check: {
      eyebrow: "Place held",
      title: " is registered.",
      lede: "Nothing has been charged. Send or bring a check made out to {payableTo}.",
      status: "Payment due by check",
      paid: false,
      when: "Before the first session{startShort}",
      accepted: "Check, payable to {payableTo}",
      state: "Registered, payment due",
      note: "Posting it? {mailTo}. Write reference {ref} on the memo line.",
      next: [["Today", "A confirmation email with the full schedule, the amount and where to send the check."],
             ["Week before", "A reminder with what to bring, and a note if the check has not reached us yet."],
             ["Day one", "Arrive ten minutes early. If the check is still in the post, bring it with you."]]
    },
    /* Back from the payment page, before the server has heard from Clover.
       Claims nothing: the payment may not have happened at all. */
    confirming: {
      eyebrow: "One moment",
      fullTitle: "Confirming your payment.",
      lede: "This usually takes a few seconds.",
      status: "Confirming payment",
      paid: false,
      when: "Today",
      accepted: "Card, through Clover",
      state: "Not yet confirmed",
      note: "If this does not change within a minute, call (201) 773-6858 and quote your reference. Please do not pay again.",
      next: [["Now", "This page updates on its own as soon as the payment is confirmed."]]
    },
    failed: {
      eyebrow: "Not registered",
      fullTitle: "The payment did not go through.",
      lede: "Nothing has been charged and the place is not confirmed. You can start again and pay online, at the facility or by check.",
      status: "Not paid",
      paid: false,
      when: "Not charged",
      accepted: "Card, through Clover",
      state: "Payment declined",
      note: "Questions about the payment go to (201) 773-6858.",
      next: [["Now", "Start the registration again and choose how you would like to pay."]]
    },
    unknown: {
      eyebrow: "Not found",
      fullTitle: "We could not find that registration.",
      lede: "The link may be incomplete. Nothing on this page means a payment was taken or a place was confirmed.",
      status: "Unknown",
      paid: false,
      when: "",
      accepted: "",
      state: "Unknown",
      note: "Call (201) 773-6858 and we will look it up.",
      next: [["Now", "Start the registration again, or call us to check."]]
    }
  };

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, function (_, k) { return values[k] || ""; });
  }

  /* ctx: { id, amountCents, programLabel, optionLabel } from the server. */
  function finish(key, ctx) {
    ctx = ctx || {};
    var c = COPY[key];
    var p = state.program, o = state.option;
    var whole = p && wholeProgram(o) && p.schedule.dates.length;
    var start = whole ? p.schedule.dates[0] : null;
    var slot = p && !p.schedule.groups.length && p.schedule.time ? ", " + p.schedule.time.split(/\s*-\s*/)[0] : "";
    var values = {
      startShort: start ? ", " + short(start) : "",
      first: start ? " " + DAYS[day(start).getUTCDay()] + " " + long(start) + slot + "." : "",
      payableTo: p ? p.check.payableTo : "",
      mailTo: p ? p.check.mailTo : "",
      ref: ctx.id || ""
    };

    var program = ctx.programLabel || (p ? p.name + ", " + p.season : "");
    var option = ctx.optionLabel || (o ? o.label : "");
    var about = [program, option].filter(Boolean).join(". ");
    var lede = (about ? about + (start ? ", starting " + long(start) : "") + ". " : "") + fill(c.lede, values);

    set("[data-confirm-eyebrow]", c.eyebrow);
    set("[data-confirm-title]", c.fullTitle || state.player + c.title);
    set("[data-confirm-lede]", c.fullTitle ? fill(c.lede, values) : lede);
    set("[data-due-amount]", typeof ctx.amountCents === "number" ? moneyExact(ctx.amountCents) : "");
    set("[data-due-when]", fill(c.when, values));
    set("[data-due-accepted]", fill(c.accepted, values));
    set("[data-due-state]", key === "online" && o && o.later.length ? c.statePart : key === "online" && !o ? c.status : c.state);
    set("[data-due-note]", fill(c.note, values));
    set(".confirm-ref", ctx.id ? "Reference " + ctx.id : "");

    var status = document.querySelector("[data-due-status]");
    if (status) {
      status.textContent = c.status;
      status.classList.toggle("due__status--paid", c.paid);
    }

    var steps = document.querySelector("[data-next-steps]");
    if (steps) {
      steps.innerHTML = c.next.map(function () {
        return '<div class="handoff__step"><dt></dt><dd></dd></div>';
      }).join("");
      Array.prototype.forEach.call(steps.children, function (row, i) {
        row.querySelector("dt").textContent = c.next[i][0];
        row.querySelector("dd").textContent = fill(c.next[i][1], values);
      });
    }

    /* The session list, only when the purchase covers every date. */
    var card = document.querySelector("[data-dates-card]");
    var showDates = c.paid || key === "facility" || key === "check";
    if (card) {
      card.hidden = !(whole && showDates);
      if (!card.hidden) {
        var dates = p.schedule.dates;
        set("[data-dates-title]", "All " + dates.length + " sessions");
        document.querySelector("[data-dates]").innerHTML = dates.map(function (d) {
          return '<span class="day">' + chip(d) + "</span>";
        }).join("");
        set("[data-dates-note]", "Sessions run " + when(p.schedule) + " at " +
          p.venues.map(function (v) { return v.address; }).join(" and ") + ".");
      }
    }

    go(4);
  }

  /* --- Submitting ----------------------------------------------------------- */

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function checked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }
  function remember(value) {
    try {
      if (value) sessionStorage.setItem(STORE_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(STORE_KEY);
    } catch (e) { /* storage blocked: the query string still carries the ID */ }
  }
  function recall() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "null"); } catch (e) { return null; }
  }

  function showError(form, message) {
    var el = form.querySelector("[data-submit-error]");
    if (!el) {
      el = document.createElement("p");
      el.className = "field__error";
      el.setAttribute("role", "alert");
      el.setAttribute("data-submit-error", "");
      form.querySelector(".reg__actions").insertAdjacentElement("beforebegin", el);
    }
    el.textContent = message;
  }

  function submit(form) {
    var button = form.querySelector("[data-submit-label]");
    if (button.disabled) return;
    button.disabled = true;

    var payload = {
      programSlug: state.program.slug,
      optionId: state.option.id,
      paymentMethod: state.method,
      players: [{
        firstName: val("p1-first"),
        lastName: val("p1-last"),
        dateOfBirth: val("p1-dob"),
        grade: val("p1-grade"),
        coachNote: val("coach-note")
      }],
      parent: {
        firstName: val("g-first"),
        lastName: val("g-last"),
        email: val("g-email"),
        phone: val("g-mobile")
      },
      waiverAccepted: checked("waiver-agree"),
      photoConsent: checked("photo-consent")
    };

    fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || "Something went wrong.");
          return data;
        });
      })
      .then(function (data) {
        if (data.redirectUrl) {
          remember({ id: data.registrationId, player: state.player, program: state.program.slug, option: state.option.id });
          window.location.assign(data.redirectUrl);
          return;
        }
        finish(state.method, { id: data.registrationId, amountCents: data.amountCents });
      })
      .catch(function (err) {
        button.disabled = false;
        var message = err instanceof TypeError ? "We could not reach the server." : err.message;
        showError(form, /charged/.test(message) ? message : message + " Nothing has been charged.");
      });
  }

  /* --- Loading ------------------------------------------------------------- */

  function loadProgram(slug) {
    return fetch("/api/programs/" + encodeURIComponent(slug), { cache: "no-store" }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (res.status === 404) return null;
        if (!res.ok || !data) throw new Error(String(res.status));
        return data;
      });
    });
  }

  function useProgram(program, optionId) {
    state.program = program;
    state.option = program.options.length === 1
      ? program.options[0]
      : program.options.filter(function (o) { return o.id === optionId; })[0] || null;
    renderProgram();
  }

  /* --- Back from the payment page ------------------------------------------ */

  /* The registration comes from the query string, or, when the payment
     provider returns to a fixed URL with ?checkout=return, from the ID
     remembered before leaving. */
  function returning(params) {
    var saved = recall();
    var id = params.get("registration") || (params.get("checkout") === "return" && saved ? saved.id : null);
    if (!id) return false;
    var mine = saved && saved.id === id ? saved : null;
    if (mine && mine.player) state.player = mine.player;

    var ready = mine && mine.program
      ? loadProgram(mine.program).then(function (p) { if (p) useProgram(p, mine.option); }).catch(function () {})
      : Promise.resolve();

    ready.then(function () {
      var tries = 0;
      finish("confirming", { id: id });

      (function poll() {
        fetch("/api/registration/" + encodeURIComponent(id) + "/status", { cache: "no-store" })
          .then(function (res) {
            return res.json().catch(function () { return null; }).then(function (data) {
              if (res.status === 404) return { status: "unknown" };
              if (!res.ok || !data) throw new Error();
              return data;
            });
          })
          .then(function (data) {
            var ctx = { id: id, amountCents: data.amountCents, programLabel: data.program, optionLabel: data.option };
            if (data.status === "confirmed") {
              remember(null);
              finish(data.paymentMethod || "online", ctx);
            } else if (data.status === "failed" || data.status === "unknown") {
              finish(data.status, ctx);
            } else {
              set("[data-due-amount]", moneyExact(data.amountCents));
              if (++tries < 30) setTimeout(poll, 2000);
            }
          })
          .catch(function () { if (++tries < 30) setTimeout(poll, 2000); });
      })();
    });
    return true;
  }

  /* --- Adding a player ----------------------------------------------------- */

  var addPlayer = document.querySelector("[data-add-player]");
  if (addPlayer) {
    addPlayer.addEventListener("click", function () {
      addPlayer.insertAdjacentHTML("afterend",
        '<p class="reg-card__note" role="status">In the built flow this adds a second player block and the total updates. ' +
        'Left out of the prototype so the walkthrough stays on one path.</p>');
      addPlayer.disabled = true;
      addPlayer.style.opacity = ".5";
    });
  }

  /* --- Start --------------------------------------------------------------- */

  /* The confirmation is never reachable from the address bar alone: #step-4
     on its own would show a registered screen for a registration that does
     not exist. Only the steps of the form are, and only once the program in
     the link has loaded. */
  var params = new URLSearchParams(window.location.search);
  if (!returning(params)) {
    var slug = params.get("program");
    if (!slug) {
      missing();
    } else {
      loadProgram(slug)
        .then(function (program) {
          if (!program) { missing(); return; }
          useProgram(program, PLANS[params.get("plan")] || null);
          var hash = (window.location.hash || "").match(/^#step-([1-3])$/);
          if (hash) state.step = Number(hash[1]);
          renderStep(false);
        })
        .catch(function () { missing("We could not load that program."); });
    }
  }
})();
