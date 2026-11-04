(function () {
  "use strict";

  var ENDPOINT = window.LEAD_ENDPOINT;
  var TIMEOUT_MS = 15000;

  var form = document.getElementById("lead-form");
  var btn = document.getElementById("submit-btn");
  var banner = document.getElementById("form-error");
  var success = document.getElementById("success");
  var successTitle = document.getElementById("success-title");
  var resetBtn = document.getElementById("reset-btn");
  var BTN_LABEL = btn.textContent.trim();

  document.getElementById("year").textContent = new Date().getFullYear();

  // E.164: "+", country code (no leading 0), 8-15 digits in total.
  function normalizePhone(v) { return v.replace(/[\s\-().]/g, ""); }
  var E164 = /^\+[1-9]\d{7,14}$/;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate(data) {
    var e = {};
    if (data.full_name.length < 2) e.full_name = "Enter your full name (at least 2 characters).";
    if (!EMAIL.test(data.email)) e.email = "Enter a valid email address, like name@company.com.";
    if (!E164.test(data.phone)) e.phone = "Use international format with country code, like +91 98765 43210.";
    if (!data.service) e.service = "Choose the service you need.";
    return e;
  }

  function showErrors(errors) {
    document.querySelectorAll(".err").forEach(function (p) {
      var key = p.getAttribute("data-for");
      var input = form.elements[key];
      if (errors[key]) {
        p.textContent = errors[key];
        p.hidden = false;
        input.setAttribute("aria-invalid", "true");
      } else {
        p.hidden = true;
        input.removeAttribute("aria-invalid");
      }
    });
  }

  function setLoading(on) {
    btn.disabled = on;
    btn.textContent = on ? "Sending inquiry..." : BTN_LABEL;
  }

  function showBanner(msg) { banner.textContent = msg; banner.hidden = false; }
  function hideBanner() { banner.hidden = true; banner.textContent = ""; }

  function read() {
    var f = form.elements;
    var budget = form.querySelector('input[name="budget"]:checked');
    return {
      full_name: f.full_name.value.trim(),
      email: f.email.value.trim(),
      phone: normalizePhone(f.phone.value.trim()),
      service: f.service.value,
      budget: budget ? budget.value : "",
      message: f.message.value.trim(),
      source: "demo_landing_page",
      submitted_at: new Date().toISOString()
    };
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (btn.disabled) return;
    hideBanner();

    // Honeypot: pretend success so bots learn nothing.
    if (form.elements.company_website.value) { return showSuccess("there"); }

    var payload = read();
    var errors = validate(payload);
    showErrors(errors);
    var firstKey = Object.keys(errors)[0];
    if (firstKey) { form.elements[firstKey].focus(); return; }

    form.elements.submitted_at.value = payload.submitted_at;
    setLoading(true);

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        showSuccess(payload.full_name.split(" ")[0]);
      })
      .catch(function () {
        // Entered data stays in the form.
        showBanner("We couldn't send your inquiry. Check your connection and try again. If it keeps failing, email us directly.");
        setLoading(false);
      })
      .finally(function () { clearTimeout(timer); });
  });

  function showSuccess(firstName) {
    successTitle.textContent = "Thank you, " + firstName + "!";
    form.hidden = true;
    success.hidden = false;
    success.focus();
    setLoading(false);
  }

  resetBtn.addEventListener("click", function () {
    form.reset();
    showErrors({});
    success.hidden = true;
    form.hidden = false;
    form.elements.full_name.focus();
  });

  // Clear a field's error as soon as the visitor edits it.
  form.addEventListener("input", function (e) {
    var p = form.querySelector('.err[data-for="' + e.target.name + '"]');
    if (p) { p.hidden = true; e.target.removeAttribute("aria-invalid"); }
  });
})();
