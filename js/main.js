/* IntelliAgent — AI & Automation Solutions — site scripts */
(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("intelliagent-theme"); } catch (e) {}
  if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.setAttribute("data-theme", "dark");
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      if (isDark) { root.removeAttribute("data-theme"); } else { root.setAttribute("data-theme", "dark"); }
      try { localStorage.setItem("intelliagent-theme", isDark ? "light" : "dark"); } catch (e) {}
    });
  });

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
    var btt = document.querySelector(".back-to-top");
    if (btt) btt.classList.toggle("show", window.scrollY > 500);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", navLinks.classList.contains("open"));
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { navLinks.classList.remove("open"); });
    });
  }

  /* ---------- Active nav link by current page ---------- */
  var currentPage = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Stat counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var duration = 1200;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var val = target * (1 - Math.pow(1 - progress, 3));
          el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.closest(".faq-list").querySelectorAll(".faq-item").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------- Back to top ---------- */
  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Contact form validation ---------- */
  var contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      contactForm.querySelectorAll("[required]").forEach(function (field) {
        var wrap = field.closest(".field");
        var ok = field.value.trim() !== "";
        if (field.type === "email" && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        }
        if (wrap) wrap.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

      var successBox = document.querySelector("#form-success");
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

      /*
        Submits to Netlify Forms (works once this site is deployed on Netlify
        with the form's data-netlify="true" attribute — see contact.html).
        Netlify parses a POST to any path as long as the encoded body
        includes the matching "form-name" field, so this works without a
        dedicated backend or a third-party form service.

        If you deploy somewhere other than Netlify, swap this fetch() call
        for a form service like Formspree/Getform, or a serverless function
        once migrated to Next.js. See README.md for setup notes.
      */
      var formData = new FormData(contactForm);
      var encoded = new URLSearchParams(formData).toString();

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encoded
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form submission failed (" + response.status + ")");
          contactForm.style.display = "none";
          if (successBox) successBox.classList.add("show");
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
          alert("Sorry, something went wrong sending your message. Please email us directly at lance0145@gmail.com.");
        });
    });
  }

  /* ---------- Newsletter form (footer) ---------- */
  document.querySelectorAll(".newsletter-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var btn = form.querySelector("button");
      if (!input || !input.value.trim()) return;
      var original = btn.textContent;
      btn.textContent = "Subscribed!";
      input.value = "";
      setTimeout(function () { btn.textContent = original; }, 2200);
    });
  });

  /* ---------- Chat widget demo ---------- */
  var chatBtn = document.querySelector(".chat-widget-btn");
  var chatPanel = document.querySelector(".chat-panel");
  if (chatBtn && chatPanel) {
    var closeBtn = chatPanel.querySelector("[data-chat-close]");
    var form = chatPanel.querySelector("form");
    var input = chatPanel.querySelector("input");
    var body = chatPanel.querySelector(".chat-panel-body");

    chatBtn.addEventListener("click", function () { chatPanel.classList.toggle("open"); });
    if (closeBtn) closeBtn.addEventListener("click", function () { chatPanel.classList.remove("open"); });

    /*
      This is a scripted demo, not a real AI backend: it matches keywords
      in what the visitor typed against the rules below and replies with
      the first match, so answers stay on-topic instead of random.
      Keep rules specific (services/pricing/location/etc.) before the
      generic fallback set at the bottom.
    */
    var demoRules = [
      { keywords: ["price", "pricing", "cost", "how much", "budget", "fee", "quote"],
        reply: "Our packages start at $1,990 for a single automation or chatbot, with Growth and Enterprise tiers above that — exact pricing depends on scope. Check our Pricing page, or book a free consultation for a custom quote." },
      { keywords: ["chatbot", "chat bot", "virtual assistant"],
        reply: "Yes — we build custom AI chatbots just like this one, trained on your business and deployable on your website, WhatsApp, or Messenger." },
      { keywords: ["automat"],
        reply: "We automate repetitive work like data entry, invoicing, reporting, and approvals — freeing up your team's time. Want a free audit of your current workflow?" },
      { keywords: ["service", "offer", "what do you do", "what can you"],
        reply: "We build AI chatbots, automate business processes, develop custom AI agents, connect your tools together, and handle data & analytics. See the full list on our Services page." },
      { keywords: ["location", "where are you", "based", "office", "address", "country"],
        reply: "We're based in the Philippines and work with clients worldwide — fully remote-first." },
      { keywords: ["how long", "timeline", "turnaround", "when can"],
        reply: "Simple projects usually launch in 1-3 weeks; larger custom builds take 4-8 weeks depending on scope." },
      { keywords: ["contact", "talk to", "human", "call", "phone", "reach you", "email you"],
        reply: "You can reach us directly at lance0145@gmail.com or +63 930 022 8998, or use the form on our Contact page — we reply within 1 business day." },
      { keywords: ["hi", "hello", "hey"],
        reply: "Hi there! I'm a demo of the kind of assistant we build for clients. Ask me about our services, pricing, or how automation could help your business." },
      { keywords: ["thank"],
        reply: "You're welcome! Let us know if there's anything else you'd like to know." }
    ];

    var fallbackReplies = [
      "That's worth a proper answer from our team — want to leave your contact details, or reach us at lance0145@gmail.com?",
      "Good question. I'm just a demo right now, so for specifics I'd recommend booking a free consultation and we'll go through it together.",
      "I don't have a scripted answer for that one — but our team does. Try our Contact page, or ask me about services, pricing, or timelines."
    ];

    function matchReply(text) {
      var lower = text.toLowerCase();
      for (var i = 0; i < demoRules.length; i++) {
        var keywords = demoRules[i].keywords;
        for (var j = 0; j < keywords.length; j++) {
          if (lower.indexOf(keywords[j]) !== -1) {
            return { reply: demoRules[i].reply, matched: true };
          }
        }
      }
      return {
        reply: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
        matched: false
      };
    }

    /*
      Fire-and-forget: logs a chat question the demo couldn't match to
      a rule, via the hidden "chat-log" Netlify form (see the <form
      name="chat-log" hidden> near the bottom of this page). Lets the
      site owner review real unanswered questions later and turn the
      common ones into new demoRules. Never blocks the chat UI and
      failures are silently ignored — this is a nice-to-have, not
      something a visitor should ever see fail.
    */
    function logUnmatchedQuestion(text) {
      var formBody = new URLSearchParams({
        "form-name": "chat-log",
        question: text,
        page: location.pathname
      }).toString();
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      }).catch(function () {});
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        addBubble(text, "user");
        input.value = "";

        var typing = document.createElement("div");
        typing.className = "bubble bot typing";
        typing.innerHTML = "<span></span><span></span><span></span>";
        body.appendChild(typing);
        body.scrollTop = body.scrollHeight;

        setTimeout(function () {
          typing.remove();
          var result = matchReply(text);
          addBubble(result.reply, "bot");
          if (!result.matched) logUnmatchedQuestion(text);
        }, 900);
      });
    }

    function addBubble(text, who) {
      var b = document.createElement("div");
      b.className = "bubble " + who;
      b.textContent = text;
      body.appendChild(b);
      body.scrollTop = body.scrollHeight;
    }
  }
})();
