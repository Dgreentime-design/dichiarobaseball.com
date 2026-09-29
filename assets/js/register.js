/* ==========================================================================
   Registration prototype.

   The three steps and the confirmation are panels on one page, switched
   client side. Nothing is stored and nothing is charged: this exists so the
   whole path can be walked in a review before the application is built.

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
        finish();
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
    }
  };

  function set(sel, text) {
    var el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  function finish() {
    var c = COPY[state.method];
    set("[data-confirm-eyebrow]", c.eyebrow);
    set("[data-confirm-title]", state.player + c.title);
    set("[data-confirm-lede]", c.lede);
    set("[data-due-amount]", money(price()) + ".00");
    set("[data-due-when]", c.when);
    set("[data-due-accepted]", c.accepted);
    set("[data-due-state]", c.state);
    set("[data-due-note]", c.note);

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

  var hash = (window.location.hash || "").match(/^#step-([1-4])$/);
  if (hash) state.step = Number(hash[1]);
  renderTotals();
  renderStep(false);
})();
