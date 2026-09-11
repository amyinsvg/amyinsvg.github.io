/* ===========================================================================
   contact.js — progressive enhancement for the contact form (spec §8)
   ---------------------------------------------------------------------------
   ORDER OF OPERATIONS MATTERS HERE, so to be explicit about it:

   /contact/index.html is the REAL page and the canonical form. Everything in
   this file is an enhancement layered on top of it. Nothing here is required
   for the contact route to work:

     - JS disabled or failed to load  -> the Contact link navigates to
                                         /contact/ and the form native-POSTs
                                         to Web3Forms, which redirects to
                                         /contact/thanks/.
     - middle-click / cmd-click / new tab -> not intercepted, navigates.
     - JS working                     -> same form opens in a <dialog> overlay
                                         and submits by fetch, so the result
                                         renders in place.

   Overlay-first would have broken all but the last of those.

   The overlay uses the native <dialog> element deliberately: it gives focus
   trapping, escape-to-close, the backdrop, and inert-ing of the page behind
   it without any of that being hand-rolled here.
   =========================================================================== */

(function () {
  "use strict";

  var ENDPOINT = "https://api.web3forms.com/submit";

  /* The access key is public by design — it ships in client-side HTML and is
     protected by the domain restriction (registered to amyinsvg.github.io),
     not by secrecy. Safe to commit. Submissions from localhost/file:// are
     rejected on purpose; stub window.fetch to test the UI states. */
  var ACCESS_KEY = "4dc4b306-f30b-43bf-acf0-1f364a38059d";
  var SUBJECT = "New enquiry from amyinsvg.github.io";

  /* TODO(capture) The real address was never captured from the live site.
     It is needed in two places — the Info block's email link in index.html
     and the failure state below. This constant is the single definition for
     the JS side; index.html carries its own copy in the markup. Update BOTH.
     example.com is IANA-reserved so this cannot reach a real third party.
     BLOCKING: fill this in before deploy. See CAPTURE-TODO.md. */
  var CONTACT_EMAIL = "hello@example.com";

  /* ---------------------------------------------------------------------
     The overlay's copy of the form.
     Duplicated from /contact/index.html because there is no build step to
     share a partial, and fetching the page to scrape the form would add a
     network dependency to opening a dialog. If you change a field in
     contact/index.html, change it here too.
     Note there is no `redirect` field: this path always submits by fetch.
     Field ids are prefixed d- so they cannot collide with a page that also
     has the standalone form in the DOM.
     --------------------------------------------------------------------- */
  function dialogMarkup() {
    return '' +
      '<div class="contact-dialog-inner">' +
        '<div class="contact-dialog-head">' +
          '<h2 class="t-h2" id="contact-dialog-title">Contact</h2>' +
          '<button type="button" class="dialog-close" data-close aria-label="Close contact form">✕</button>' +
        '</div>' +
        '<form class="form" data-contact-form novalidate="false">' +
          '<input type="hidden" name="access_key" value="' + ACCESS_KEY + '">' +
          '<input type="hidden" name="subject" value="' + SUBJECT + '">' +
          '<input type="checkbox" name="botcheck" class="honeypot" style="display:none" tabindex="-1" autocomplete="off">' +
          '<div>' +
            '<label class="t-label" for="d-name">Name</label>' +
            '<input type="text" name="name" id="d-name" autocomplete="name" required>' +
          '</div>' +
          '<div>' +
            '<label class="t-label" for="d-email">Email</label>' +
            '<input type="email" name="email" id="d-email" autocomplete="email" required>' +
          '</div>' +
          '<div>' +
            '<label class="t-label" for="d-message">What are you working on?</label>' +
            '<textarea name="message" id="d-message" rows="5" required></textarea>' +
          '</div>' +
          '<button class="btn" type="submit" data-submit>Send</button>' +
        '</form>' +
        '<div class="form-status" data-status role="status" aria-live="polite"></div>' +
      '</div>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------------------------
     Submission — the three states of §8.
     State 3 (failure) is the one that usually gets skipped, so, for the
     record: it must never clear the fields. The user's message is the only
     copy of itself that exists at that moment.
     --------------------------------------------------------------------- */
  function wireForm(form, statusEl) {
    if (!form || form.dataset.wired === "1") return;
    form.dataset.wired = "1";

    /* The `redirect` field exists for the no-JS native POST. On the fetch
       path it must go, or Web3Forms answers with a redirect instead of the
       JSON this code reads. */
    var redirect = form.querySelector("[data-redirect]");
    if (redirect) redirect.parentNode.removeChild(redirect);

    var button = form.querySelector("[data-submit]");
    var idleLabel = button ? button.textContent : "Send";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      /* Let the browser's own validation UI handle empty required fields. */
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

      /* ---- STATE 1: SENDING ---- */
      statusEl.innerHTML = "";
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });

      /* window.fetch is called through the global on purpose: stubbing
         window.fetch is how the three states get tested locally, since the
         live endpoint is domain-restricted to amyinsvg.github.io and will
         (correctly) reject localhost. */
      window.fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json()
            .catch(function () { return {}; })
            .then(function (data) { return { ok: response.ok, data: data }; });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success) {
            /* ---- STATE 2: SENT ---- */
            form.hidden = true;
            statusEl.innerHTML =
              '<p class="t-body-lg">Thank you — your message is on its way. ' +
              "I'll reply to the address you gave.</p>";
            var heading = statusEl.parentNode.querySelector("h2, h1");
            if (heading) heading.textContent = "Sent";
            return;
          }
          fail(result.data && result.data.message);
        })
        .catch(function (error) {
          /* Network-level failure: offline, DNS, CORS, blocked request. */
          fail(error && error.message);
        });

      /* ---- STATE 3: FAILED ----
         Fields are left untouched, so everything typed is still there. The
         email address is surfaced so the message has somewhere to go. */
      function fail(detail) {
        if (button) {
          button.disabled = false;
          button.textContent = idleLabel;
        }
        statusEl.innerHTML =
          '<div class="form-fail">' +
            '<p class="t-body-lg">That didn’t send.</p>' +
            (detail ? '<p class="t-tag">' + esc(detail) + "</p>" : "") +
            '<p class="t-body">Your message is still in the form above, so nothing is lost. ' +
              "You can press Send again, or email it to " +
              '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + "</a>." +
            "</p>" +
          "</div>";
      }
    });
  }

  /* ---------------------------------------------------------------------
     The overlay
     --------------------------------------------------------------------- */
  var dialog = null;
  var lastTrigger = null;

  function buildDialog() {
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.className = "contact-dialog";
    dialog.setAttribute("aria-labelledby", "contact-dialog-title");
    dialog.innerHTML = dialogMarkup();
    document.body.appendChild(dialog);

    wireForm(dialog.querySelector("[data-contact-form]"), dialog.querySelector("[data-status]"));

    /* Close: explicit button. Escape is native to <dialog>. */
    dialog.querySelector("[data-close]").addEventListener("click", function () {
      dialog.close();
    });

    /* Close: backdrop click. A click on the backdrop targets the dialog
       element itself; anything inside targets .contact-dialog-inner, which
       covers the dialog's whole box. */
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    /* Return focus to whatever opened it. <dialog> mostly does this already,
       but not dependably across browsers, so it is explicit here. */
    dialog.addEventListener("close", function () {
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
      lastTrigger = null;
    });

    return dialog;
  }

  function openDialog(trigger) {
    var d = buildDialog();
    lastTrigger = trigger || null;

    /* showModal() is what provides the focus trap and makes the rest of the
       page inert. Without it none of that holds. */
    d.showModal();

    /* Focus the first field, not the dialog container (§8). */
    var first = d.querySelector("#d-name");
    if (first) first.focus();
  }

  /* A click we must NOT intercept: modifier or non-primary button. These are
     "open somewhere else" gestures and the route has to keep working for
     them — which is the whole reason /contact/ is a real page. */
  function isModifiedClick(event) {
    return event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function init() {
    /* <dialog> support is the floor for the overlay. Without it, every
       trigger stays an ordinary link to /contact/. */
    var supported = typeof window.HTMLDialogElement === "function" &&
      typeof document.createElement("dialog").showModal === "function";

    /* On /contact/ itself: enhance the page's own form, and leave the
       triggers alone — opening an overlay of the form you are already looking
       at is just noise. */
    var pageForm = document.getElementById("contact-form");
    if (pageForm) {
      wireForm(pageForm, document.getElementById("form-status"));
      return;
    }

    if (!supported) return;

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest ? event.target.closest("[data-contact-trigger]") : null;
      if (!trigger || isModifiedClick(event)) return;
      event.preventDefault();
      /* The URL is deliberately not changed (§8): the overlay is a
         convenience, /contact/ is the destination. */
      openDialog(trigger);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
