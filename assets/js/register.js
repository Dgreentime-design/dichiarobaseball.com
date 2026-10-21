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

   Team and town camps: register.html?code=<code> (the flyer's QR code) or
   ?team=1 after a code was entered on Camps or Team camps. The code goes
   to /api/team-code, which answers with that group's live camps; nothing
   about any group is in this page. The code is taken out of the address
   bar at once. The family picks a camp (step 0), then the same three
   steps. Checkout sends the code and the camp's ref, never a price, and
   the server checks and prices it again.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-progress]");
  if (!root) return;

  var state = { step: 1, method: "online", player: "", program: null, option: null, team: null };
  var TEAM_KEY = "dbsa-team";
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
  /* US order, as on the rest of the site: "October 25", "Oct 25". */
  function long(iso) { var d = day(iso); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function longYear(iso) { return long(iso) + ", " + day(iso).getUTCFullYear(); }
  function short(iso) { var d = day(iso); return MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCDate(); }
  function monthDay(iso) { var d = day(iso); return MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCDate(); }
  function chip(iso) { var d = day(iso); return DAYS[d.getUTCDay()].slice(0, 3) + " " + short(iso); }

  /* "2:30pm - 4:00pm" reads "2:30 to 4:00pm", as the rest of the site does. */
  /* "2:30pm - 4:00pm" in the data reads "2:30pm-4:00pm", the site's one
     time range style. */
  function span(t) {
    return (t || "").replace(/\s*-\s*/, "-");
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
    return !!option && (option.whole || option.id === "full" || option.later.length > 0);
  }

  function laterText(o) {
    return o.later.map(function (l) { return money(l.amountCents) + " on " + longYear(l.when); }).join(", ");
  }

  /* --- Analytics ---------------------------------------------------------
     The checkout funnel, in GA4's ecommerce events, through dbsaTrack in
     site.js. Every call sits beside the money path, never inside a
     decision: a blocked or broken tag changes nothing here. Params are the
     program slug and title, the amount due now, the step, the payment
     method, the registration ID (DBSA- and ten random characters, nothing
     from the family) and error categories. Never a name, email, phone,
     date of birth, grade or anything typed. */

  var gaItems = {};
  try { gaItems = JSON.parse(document.getElementById("ga-items").textContent) || {}; } catch (e) { gaItems = {}; }

  function track(name, params, done) {
    if (window.dbsaTrack) window.dbsaTrack(name, params, done);
    else if (done) done();
  }

  /* currency, value and items for the cart on screen: the chosen option's
     amount due now, or the lowest one before an option is chosen. One
     player per registration. */
  function cart(extra, amountCents) {
    var out = {};
    try {
      var p = state.program;
      if (p) {
        /* A team camp goes to analytics as "Team camp", never by its own
           or its group's name. */
        var meta = p.team ? { item_name: "Team camp", item_category: "team" } : gaItems[p.slug] || {};
        var cents = typeof amountCents === "number" ? amountCents
          : state.option ? state.option.dueNowCents
          : Math.min.apply(null, p.options.map(function (o) { return o.dueNowCents; }));
        out.currency = "USD";
        out.value = cents / 100;
        out.items = [{ item_id: p.team ? "team-camp" : p.slug, item_name: meta.item_name || p.name + ", " + p.season,
          item_category: meta.item_category || "both", price: cents / 100, quantity: 1 }];
      }
    } catch (e) { out = {}; }
    for (var k in extra) out[k] = extra[k];
    return out;
  }

  /* Once per key per browser session, so a reload does not count twice. */
  function once(key) {
    try {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
    } catch (e) { /* storage blocked: GA still dedupes a purchase on transaction_id */ }
    return true;
  }

  function purchased(id, method, amountCents, programLabel) {
    if (!id || !once("dbsa-ga-purchase:" + id)) return;
    var params = cart({ transaction_id: id, payment_type: method }, amountCents);
    if (!params.items && typeof amountCents === "number") {
      /* Back from payment in a browser that did not start the registration:
         the program is known only by its label. */
      params.currency = "USD";
      params.value = amountCents / 100;
      params.items = [{ item_name: programLabel || "Registration", price: amountCents / 100, quantity: 1 }];
    }
    track("purchase", params);
  }

  function unconfirmed(id, reason) {
    if (!id || !once("dbsa-ga-unconfirmed:" + id + ":" + reason)) return;
    track("checkout_unconfirmed", cart({ transaction_id: id, reason: reason, transport_type: "beacon" }));
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
    set("[data-line-name]", p.season ? p.name + ", " + p.season : p.name);
    setAll(".summary__eyebrow", p.team ? p.team.group + " \u00b7 Team camp" : "You are registering for");
    renderPayments(p.paymentMethods || ["online", "facility", "check"]);

    var again = document.querySelector("[data-register-again]");
    if (again) again.setAttribute("href", p.team ? "register.html?team=1" : "register.html?program=" + encodeURIComponent(p.slug));
    var back = document.querySelector("[data-back-link]");
    if (back) {
      back.textContent = p.team ? "Back to your camps" : "Back to the camp page";
      back.setAttribute("href", p.team ? "#step-0" : "camps-and-clinics.html");
    }

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
    if (root) root.hidden = state.step < 1 || state.step > 3;

    /* The waiver carries the date it is actually signed. */
    if (state.step === 2) {
      var now = new Date();
      var input = document.querySelector("[data-sign-date]");
      if (input) input.value = MONTHS[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
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
        track("checkout_progress", cart({ step: 1, step_name: "players" }));
        go(2);
      } else if (n === 2) {
        track("checkout_progress", cart({ step: 2, step_name: "waiver" }));
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

  var PAY_WORDS = { online: "online", facility: "at the facility", check: "by check" };

  /* Only the ways this program or camp can be paid. A team camp names its
     own; the server refuses any other. */
  function renderPayments(methods) {
    var first = null;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="pay"]'), function (input) {
      var allowed = methods.indexOf(input.value) !== -1;
      input.closest(".choice").hidden = !allowed;
      input.disabled = !allowed;
      if (allowed && !first) first = input;
    });
    var current = document.querySelector('input[name="pay"]:checked');
    var pick = current && !current.disabled ? current : first;
    if (pick) { pick.checked = true; pick.dispatchEvent(new Event("change")); }
    set("[data-pay-note]", methods.length >= 3
      ? "This camp accepts all three. Pick the one that suits you."
      : methods.length === 1
        ? "This camp is paid " + PAY_WORDS[methods[0]] + "."
        : "This camp can be paid " + methods.map(function (m) { return PAY_WORDS[m]; }).join(" or ") + ".");
  }

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
      lede: "Your card has been charged.",
      status: "Paid",
      paid: true,
      when: "Paid " + "today",
      accepted: "Card, through Clover",
      state: "Paid in full",
      statePart: "First payment made",
      note: "Questions about the payment go to (201) 773-6858.",
      next: [["Today", "Keep this page. Your reference number is your proof of registration."],
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
      next: [["Today", "Keep this page. Your reference number is your proof of registration."],
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
      next: [["Today", "Keep this page. Your reference number is your proof of registration."],
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
    /* Still no answer from the payment provider a minute after the payer
       came back. The page keeps checking and moves on by itself if the
       payment confirms. Claims nothing beyond what is known. */
    delayed: {
      eyebrow: "Taking longer than usual",
      fullTitle: "Still confirming your payment.",
      lede: "This can take a few minutes. If your card was charged, your place is held. Keep your reference number and we\u2019ll confirm by phone or email.",
      status: "Confirming payment",
      paid: false,
      when: "Today",
      accepted: "Card, through Clover",
      state: "Not yet confirmed",
      note: "Please do not pay again.",
      call: true,
      next: [["Now", "This page keeps checking and updates on its own as soon as the payment is confirmed."]]
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
      first: start ? " " + DAYS[day(start).getUTCDay()] + ", " + long(start) + slot + "." : "",
      payableTo: p ? p.check.payableTo : "",
      mailTo: p ? p.check.mailTo : "",
      ref: ctx.id || ""
    };

    /* A team camp's name comes from the camp this browser picked; the
       status endpoint only ever says "Team camp". */
    var program = (p && p.team ? p.name : ctx.programLabel) || (p ? (p.season ? p.name + ", " + p.season : p.name) : "");
    var option = ctx.optionLabel || (o ? o.label : "");
    var about = [program, option !== program ? option : ""].filter(Boolean).join(". ");
    var lede = (about ? about + (start ? ", starting " + long(start) : "") + ". " : "") + fill(c.lede, values);

    set("[data-confirm-eyebrow]", c.eyebrow);
    /* The name is only known in the browser that started the registration.
       The status endpoint returns no personal data, so anywhere else the
       title carries no name. */
    set("[data-confirm-title]", c.fullTitle || (state.player ? state.player + c.title : "You\u2019re registered."));
    set("[data-confirm-lede]", c.fullTitle ? fill(c.lede, values) : lede);
    set("[data-due-amount]", typeof ctx.amountCents === "number" ? moneyExact(ctx.amountCents) : "");
    set("[data-due-when]", fill(c.when, values));
    set("[data-due-accepted]", fill(c.accepted, values));
    set("[data-due-state]", key === "online" && o && o.later.length ? c.statePart : key === "online" && !o ? c.status : c.state);
    set("[data-due-note]", fill(c.note, values));
    set(".confirm-ref", ctx.id ? "Reference " + ctx.id : "");
    var call = document.querySelector("[data-confirm-call]");
    if (call) call.hidden = !c.call;

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

        /* Add to calendar, for the program just registered: the same three
           links as its program page, written into the page by the build. */
        var links = null;
        try { links = JSON.parse(document.getElementById("calendar-links").textContent)[p.slug]; } catch (e) { links = null; }
        var cal = card.querySelector("[data-cal]");
        if (cal) cal.hidden = !links;
        if (links) {
          Array.prototype.forEach.call(card.querySelectorAll("[data-cal-link]"), function (a) {
            a.href = links[a.getAttribute("data-cal-link")];
          });
        }
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

    track("checkout_progress", cart({ step: 3, step_name: "review" }));
    track("add_payment_info", cart({ payment_type: state.method }));

    var payload = {
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
      photoConsent: checked("photo-consent"),
      marketingOptIn: checked("marketing-opt-in")
    };
    if (state.team) {
      payload.code = state.team.code;
      payload.campRef = state.team.camp.ref;
    } else {
      payload.programSlug = state.program.slug;
      payload.optionId = state.option.id;
    }

    fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var failed = new Error(data.message || data.error || "Something went wrong.");
            failed.status = res.status;
            throw failed;
          }
          return data;
        });
      })
      .then(function (data) {
        if (data.redirectUrl) {
          remember({ id: data.registrationId, player: state.player, program: state.program.slug, option: state.option.id,
            team: state.team ? { group: state.team.group, camp: state.team.camp, check: state.team.check } : null });
          /* Sent before leaving for the payment page, and the navigation
             waits for it at most 800ms; at once if the tag is blocked. */
          track("checkout_redirect", cart({ transaction_id: data.registrationId }), function () {
            window.location.assign(data.redirectUrl);
          });
          return;
        }
        finish(state.method, { id: data.registrationId, amountCents: data.amountCents });
        /* At the facility and by check, the registration is confirmed now. */
        purchased(data.registrationId, state.method, data.amountCents);
      })
      .catch(function (err) {
        track("checkout_error", {
          error_step: err instanceof TypeError ? "network" : err.status >= 400 && err.status < 500 ? "validation" : "server",
          http_status: err.status || 0
        });
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

    if (mine && mine.team) useProgram(campProgram(mine.team.camp, mine.team.group.name, mine.team.check), null);
    var ready = mine && mine.program && !mine.team
      ? loadProgram(mine.program).then(function (p) { if (p) useProgram(p, mine.option); }).catch(function () {})
      : Promise.resolve();

    ready.then(function () {
      /* Every 2 seconds for the first minute. After a minute with no answer
         the screen says so, and checking carries on every 5 seconds for as
         long as the page is open, so a late webhook still lands here. */
      var started = Date.now();
      var DELAY_MS = 60000;
      var delayed = false;
      var again = function () {
        var waited = Date.now() - started;
        if (!delayed && waited >= DELAY_MS) {
          delayed = true;
          finish("delayed", { id: id, amountCents: lastAmount });
          unconfirmed(id, "timeout");
        }
        setTimeout(poll, waited < DELAY_MS ? Math.min(2000, DELAY_MS - waited) : 5000);
      };
      var lastAmount;
      var settled = false;
      finish("confirming", { id: id });
      /* Leaving while still confirming is the drop-off after Clover. */
      window.addEventListener("pagehide", function () { if (!settled) unconfirmed(id, "pending"); });

      function poll() {
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
              settled = true;
              remember(null);
              finish(data.paymentMethod || "online", ctx);
              purchased(id, data.paymentMethod || "online", data.amountCents, data.program);
            } else if (data.status === "failed" || data.status === "unknown") {
              settled = true;
              finish(data.status, ctx);
              if (data.status === "failed") unconfirmed(id, "failed");
            } else {
              lastAmount = data.amountCents;
              set("[data-due-amount]", moneyExact(data.amountCents));
              again();
            }
          })
          .catch(again);
      }
      poll();
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

  /* --- Team and town camps -------------------------------------------------- */

  /* The camp in the shape the steps render, from what /api/team-code sent.
     One option, the camp itself, priced per player by the server. */
  function campProgram(camp, groupName, check) {
    return {
      slug: null,
      team: { group: groupName },
      name: camp.name,
      season: "",
      ages: camp.ages,
      /* The data says "Sundays"; when() adds the plural itself. */
      schedule: { day: (camp.day || "").replace(/s$/i, ""), time: camp.time || null, groups: [], dates: camp.dates },
      venues: [camp.venue],
      options: [{ id: "team", label: "Team camp", dueNowCents: camp.priceCents, totalCents: camp.priceCents, later: [], whole: true }],
      paymentMethods: camp.paymentMethods,
      check: check
    };
  }

  function range(dates) {
    if (!dates.length) return "";
    var a = dates[0], b = dates[dates.length - 1];
    if (a === b) return longYear(a);
    return a.slice(0, 4) === b.slice(0, 4)
      ? short(a) + " to " + short(b) + ", " + b.slice(0, 4)
      : short(a) + ", " + a.slice(0, 4) + " to " + short(b) + ", " + b.slice(0, 4);
  }
  function hours(h) { return h === 1 ? "1 hour" : h + " hours"; }

  var teamPanel = document.querySelector('[data-step="0"]');
  var teamEntry = document.querySelector("[data-team-entry]");
  var teamPick = document.querySelector("[data-team-pick]");
  var teamChange = document.querySelector("[data-team-change]");
  var teamResult = null;

  function showEntry(focus) {
    teamEntry.hidden = false;
    if (focus) { var input = teamEntry.querySelector("input"); if (input) input.focus(); }
  }

  /* The group's camps, from { code, result }. */
  function showTeam(team) {
    var r = team.result, name = r.group.name;
    teamResult = team;
    try { sessionStorage.setItem(TEAM_KEY, JSON.stringify(team)); } catch (e) { /* this tab only, and only a convenience */ }
    set("[data-team-title]", name + " camps");
    teamChange.textContent = "Not " + name + "? Use a different code";
    document.querySelector("[data-team-change-row]").hidden = false;
    teamEntry.hidden = true;
    var lede = document.querySelector("[data-team-lede]");

    var box = document.querySelector("[data-team-camps]");
    if (!r.camps.length) {
      lede.textContent = "Registration for " + name + " camps isn\u2019t open yet. Check back soon, or call (201) 773-6858.";
      lede.hidden = false;
      teamPick.hidden = true;
      box.innerHTML = "";
    } else {
      lede.hidden = true;
      box.innerHTML = r.camps.map(function () {
        return '<label class="choice team-camp"><input type="radio" name="team-camp">' +
          '<span class="choice__copy"><span class="team-camp__top"><strong></strong><span class="team-camp__price"></span></span>' +
          '<span data-l1></span><span data-l2></span><span data-l3></span></span></label>';
      }).join("");
      Array.prototype.forEach.call(box.querySelectorAll(".choice"), function (label, i) {
        var c = r.camps[i];
        var input = label.querySelector("input");
        input.value = String(c.ref);
        input.disabled = c.full;
        label.classList.toggle("is-full", c.full);
        label.querySelector("strong").textContent = c.name;
        var price = label.querySelector(".team-camp__price");
        if (c.full) price.innerHTML = '<span class="chip">Full</span>';
        else price.textContent = money(c.priceCents);
        label.querySelector("[data-l1]").textContent = [c.ages, [c.day, span(c.time)].filter(Boolean).join(", ")].filter(Boolean).join(" \u00b7 ");
        label.querySelector("[data-l2]").textContent = range(c.dates) + " \u00b7 " + c.dates.length + (c.dates.length === 1 ? " session" : " sessions");
        label.querySelector("[data-l3]").textContent = [c.weeks ? c.weeks + (c.weeks === 1 ? " week" : " weeks") : "",
          c.sessionHours ? hours(c.sessionHours) + " a session" : ""].filter(Boolean).join(" \u00b7 ");
        input.addEventListener("change", function () {
          box.closest(".reg-card").classList.remove("is-invalid");
          var err = teamPick.querySelector("[data-submit-error]");
          if (err) err.textContent = "";
        });
      });
      teamPick.hidden = false;
    }
    state.step = 0;
    renderStep(false);
  }

  function startTeam(params) {
    state.step = 0;
    renderStep(false);
    var code = params.get("code");
    if (code) {
      /* The flyer's QR link. The code leaves the address bar at once, so it
         is not in the history, a bookmark or a shared screenshot. */
      if (history.replaceState) history.replaceState(null, "", "register.html");
      var input = teamEntry.querySelector("input");
      input.value = code.toUpperCase();
      var form = teamEntry.querySelector("form");
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event("submit", { cancelable: true }));
      return;
    }
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(TEAM_KEY) || "null"); } catch (e) { saved = null; }
    if (saved && saved.result && saved.result.group) showTeam(saved);
    else showEntry(false);
  }

  if (teamPanel) {
    teamEntry.querySelector("form").addEventListener("dbsa:team-code", function (e) {
      e.preventDefault();
      showTeam(e.detail);
      var h = document.getElementById("s0-title");
      h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
    });
    teamChange.addEventListener("click", function () { showEntry(true); });

    teamPick.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = teamPick.querySelector('input[name="team-camp"]:checked');
      if (!picked) {
        teamPick.querySelector(".reg-card").classList.add("is-invalid");
        showError(teamPick, "Choose a camp to continue.");
        var first = teamPick.querySelector('input[name="team-camp"]:not(:disabled)');
        if (first) first.focus();
        return;
      }
      var camp = teamResult.result.camps.filter(function (c) { return String(c.ref) === picked.value; })[0];
      state.team = { code: teamResult.code, camp: camp, group: teamResult.result.group, check: teamResult.result.check };
      useProgram(campProgram(camp, teamResult.result.group.name, teamResult.result.check), null);
      if (once("dbsa-ga-begin:team-camp:" + camp.ref)) track("begin_checkout", cart({}));
      go(1);
    });

    var backLink = document.querySelector("[data-back-link]");
    if (backLink) backLink.addEventListener("click", function (e) {
      if (state.team) { e.preventDefault(); go(0); }
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
    if (params.has("code") || params.get("team")) {
      startTeam(params);
    } else if (!slug) {
      missing();
    } else {
      loadProgram(slug)
        .then(function (program) {
          if (!program) { missing(); return; }
          useProgram(program, PLANS[params.get("plan")] || null);
          if (once("dbsa-ga-begin:" + program.slug)) track("begin_checkout", cart({}));
          var hash = (window.location.hash || "").match(/^#step-([1-3])$/);
          if (hash) state.step = Number(hash[1]);
          renderStep(false);
        })
        .catch(function () { missing("We could not load that program."); });
    }
  }
})();
