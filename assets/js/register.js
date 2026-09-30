/* ==========================================================================
   Registration.

   The three steps and the confirmation are panels on one page, switched
   client side. Step 3 posts to /api/checkout/session, which prices the
   cart on the server and stores the registration.

   Paying online sends the parent to the payment page. Coming back is not
   proof of payment, so the confirmation screen starts at "confirming" and
   polls /api/registration/:id/status until the server, which only learns
   of a payment from a verified webhook, says confirmed or failed.

   IMPORTANT, for whoever picks this up: the rate lookup below is a stand-in.
   In the built site a code goes to the server and one rate comes back. No
   rate, code or town name may ever appear in a public payload, or anyone can
   read the page source and see which towns pay less, which is the exact harm
   the design exists to prevent. See the registration build spec.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-progress]");
  if (!root) return;

  var STANDARD = 320;
  /* An invented town, on purpose. Naming a real league against a discounted
     price is the harm the gated-rate design exists to prevent, and a fake
     price does not undo it: the organisation is findable and the implication
     is that it pays less. This must not ship at the domain cutover either,
     the lookup moves server side. */
  var DEMO_RATES = { DEMO25: { label: "Demo Town Little League", price: 180 } };

  var state = { step: 1, rate: null, method: "online", player: "Mia" };

  /* The one program this page renders. The summary, dates and copy on the
     page are all for this option, so it is the one the server prices. */
  var PROGRAM = { slug: "little-league-fall-2026", option: "full" };
  var STORE_KEY = "dbsa-registration";

  var panels = document.querySelectorAll("[data-step]");
  var markers = document.querySelectorAll("[data-step-marker]");

  function money(n) { return "$" + n; }
  function price() { return state.rate ? state.rate.price : STANDARD; }

  /* --- Rendering --------------------------------------------------------- */

  function renderTotals() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-total]"), function (el) {
      el.textContent = money(price());
    });
    var line = document.querySelector("[data-line-price]");
    if (line) line.textContent = money(price());

    Array.prototype.forEach.call(document.querySelectorAll("[data-rate-row]"), function (row) {
      row.hidden = !state.rate;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-rate-label]"), function (el) {
      el.textContent = state.rate ? state.rate.label : "";
    });
    var applied = document.querySelector("[data-rate-applied]");
    if (applied) applied.hidden = !state.rate;
    var prompt = document.querySelector("[data-code-prompt]");
    if (prompt) prompt.hidden = !!state.rate;
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

  /* --- Town and league codes ---------------------------------------------- */

  var codeToggle = document.querySelector("[data-code-toggle]");
  var codeField = document.querySelector("[data-code-field]");
  if (codeToggle && codeField) {
    codeToggle.addEventListener("click", function () {
      codeField.hidden = false;
      codeToggle.closest("[data-code-prompt]").hidden = true;
      var input = document.getElementById("rate-code");
      if (input) input.focus();
    });
  }

  var apply = document.querySelector("[data-apply-code]");
  if (apply) {
    apply.addEventListener("click", function () {
      var input = document.getElementById("rate-code");
      var hint = document.querySelector("[data-code-hint]");
      var field = input.closest(".field");
      var match = DEMO_RATES[(input.value || "").trim().toUpperCase()];

      if (match) {
        state.rate = match;
        field.classList.remove("is-invalid");
        codeField.hidden = true;
        input.value = "";
        renderTotals();
      } else {
        /* One message, whatever the reason. Never confirm a near miss: a
           different message for expired, wrong program or never existed turns
           this field into an oracle for guessing valid codes. */
        field.classList.add("is-invalid");
        hint.textContent = "We do not recognise that code.";
        hint.className = "field__error";
        input.focus();
      }
    });
  }

  var removeCode = document.querySelector("[data-remove-code]");
  if (removeCode) {
    removeCode.addEventListener("click", function () {
      state.rate = null;
      renderTotals();
    });
  }

  /* --- Confirmation ------------------------------------------------------- */

  var COPY = {
    online: {
      eyebrow: "You are in",
      title: " is registered.",
      lede: "Little League Training Camp, fall. Eight Sundays starting 25 October. Your card has been charged and the receipt is on its way.",
      status: "Paid",
      paid: true,
      when: "Paid " + "today",
      accepted: "Card, through Clover",
      state: "Paid in full",
      note: "A receipt is in your inbox. Questions about the payment go to (201) 773-6858.",
      next: [["Today", "A confirmation email with the full schedule and your receipt."],
             ["A week before", "A reminder with what to bring."],
             ["First session", "Arrive ten minutes early. Sunday 25 October, 2:30pm."]]
    },
    facility: {
      eyebrow: "Place held",
      title: " is registered.",
      lede: "Little League Training Camp, fall. Eight Sundays starting 25 October. Nothing has been charged. Bring payment to the first session and we will settle up at the desk.",
      status: "Payment due at the facility",
      paid: false,
      when: "First session, 25 Oct",
      accepted: "Card, cash or check",
      state: "Registered, payment due",
      note: "Prefer to pay online instead? Call (201) 773-6858 and we can send a payment link.",
      next: [["Today", "A confirmation email with the full schedule and what you owe."],
             ["A week before", "A reminder with what to bring, including payment."],
             ["First session", "Arrive ten minutes early and pay at the desk. Card, cash or check."]]
    },
    check: {
      eyebrow: "Place held",
      title: " is registered.",
      lede: "Little League Training Camp, fall. Eight Sundays starting 25 October. Nothing has been charged. Send or bring a check made out to DiChiaro Baseball & Softball Academy.",
      status: "Payment due by check",
      paid: false,
      when: "Before the first session, 25 Oct",
      accepted: "Check, payable to DiChiaro Baseball & Softball Academy",
      state: "Registered, payment due",
      note: "Posting it? 18-01 Pollitt Drive, Fair Lawn NJ 07410. Write reference DBSA-2026-0418 on the memo line.",
      next: [["Today", "A confirmation email with the full schedule, the amount and where to send the check."],
             ["A week before", "A reminder with what to bring, and a note if the check has not reached us yet."],
             ["First session", "Arrive ten minutes early. If the check is still in the post, bring it with you."]]
    },
    /* Back from the payment page, before the server has heard from Clover.
       Claims nothing: the payment may not have happened at all. */
    confirming: {
      eyebrow: "One moment",
      fullTitle: "Confirming your payment.",
      lede: "We are waiting for Clover to confirm the payment. This usually takes a few seconds. Please keep this page open.",
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

  function set(sel, text) {
    var el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  /* Renders the confirmation panel for one state. The amount always comes
     from the server's answer, never from the price shown on the page. */
  function finish(key, registrationId, amountCents) {
    var c = COPY[key];
    set("[data-confirm-eyebrow]", c.eyebrow);
    set("[data-confirm-title]", c.fullTitle || state.player + c.title);
    set("[data-confirm-lede]", c.lede);
    set("[data-due-amount]", typeof amountCents === "number" ? "$" + (amountCents / 100).toFixed(2) : "");
    set("[data-due-when]", c.when);
    set("[data-due-accepted]", c.accepted);
    set("[data-due-state]", c.state);
    set("[data-due-note]", registrationId ? c.note.replace("DBSA-2026-0418", registrationId) : c.note);
    set(".confirm-ref", registrationId ? "Reference " + registrationId : "");

    var status = document.querySelector("[data-due-status]");
    if (status) {
      status.textContent = c.status;
      status.classList.toggle("due__status--paid", c.paid);
    }

    var steps = document.querySelector("[data-next-steps]");
    if (steps) {
      steps.innerHTML = c.next.map(function (row) {
        return '<div class="handoff__step"><dt>' + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
      }).join("");
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
      programSlug: PROGRAM.slug,
      optionId: PROGRAM.option,
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
          remember({ id: data.registrationId, player: state.player });
          window.location.assign(data.redirectUrl);
          return;
        }
        finish(state.method, data.registrationId, data.amountCents);
      })
      .catch(function (err) {
        button.disabled = false;
        var message = err instanceof TypeError ? "We could not reach the server." : err.message;
        showError(form, /charged/.test(message) ? message : message + " Nothing has been charged.");
      });
  }

  /* --- Back from the payment page ------------------------------------------ */

  /* The registration comes from the query string, or, when the payment
     provider returns to a fixed URL with ?checkout=return, from the ID
     remembered before leaving. */
  function returning() {
    var params = new URLSearchParams(window.location.search);
    var saved = recall();
    var id = params.get("registration") || (params.get("checkout") === "return" && saved ? saved.id : null);
    if (!id) return false;
    if (saved && saved.id === id && saved.player) state.player = saved.player;

    var tries = 0;
    finish("confirming", id);

    (function poll() {
      fetch("/api/registration/" + encodeURIComponent(id) + "/status", { cache: "no-store" })
        .then(function (res) {
          if (res.status === 404) return { status: "unknown" };
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(function (data) {
          if (data.status === "confirmed") {
            remember(null);
            finish(data.paymentMethod || "online", id, data.amountCents);
          } else if (data.status === "failed" || data.status === "unknown") {
            finish(data.status, id, data.amountCents);
          } else {
            set("[data-due-amount]", "$" + (data.amountCents / 100).toFixed(2));
            if (++tries < 30) setTimeout(poll, 2000);
          }
        })
        .catch(function () { if (++tries < 30) setTimeout(poll, 2000); });
    })();
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
     not exist. Only the steps of the form are. */
  renderTotals();
  if (!returning()) {
    var hash = (window.location.hash || "").match(/^#step-([1-3])$/);
    if (hash) state.step = Number(hash[1]);
    renderStep(false);
  }
})();
