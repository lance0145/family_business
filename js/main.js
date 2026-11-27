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
      { keywords: ["are you real", "are you human", "are you ai", "are you a bot", "are you a real", "real person"],
        reply: "I'm a scripted demo bot showing the kind of assistant IntelliAgent builds for clients — for a real conversation, reach our team at lance0145@gmail.com." },
      { keywords: ["chatbot", "chat bot", "virtual assistant"],
        reply: "Yes — we build custom AI chatbots just like this one, trained on your business and deployable on your website, WhatsApp, or Messenger." },
      { keywords: ["ai agent", "agents"],
        reply: "We build custom AI agents for things like document review, research, and internal copilots — tailored to your own data and workflows." },
      /*
        secure/privacy and support must stay ABOVE data/analytics and
        service/offer below: "is my data secure" contains "data", and
        "do you offer support" contains "offer" -- without this order,
        the broader rule below would win the keyword match instead.
      */
      { keywords: ["secure", "privacy", "data safe", "confidential"],
        reply: "Yes — we follow least-privilege access, encrypt data in transit, and never train external models on your data without consent. See our Privacy Policy for details." },
      { keywords: ["automat"],
        reply: "We automate repetitive work like data entry, invoicing, reporting, and approvals — freeing up your team's time. Want a free audit of your current workflow?" },
      { keywords: ["integrat", "zapier", "n8n", "make.com", "crm", "webhook"],
        reply: "We connect your tools together using Zapier, Make, n8n, or custom APIs — CRMs, helpdesks, and spreadsheets, all synced automatically." },
      { keywords: ["data", "analytics", "dashboard", "report"],
        reply: "We turn scattered spreadsheets into live dashboards with predictive insights — see our Data & AI-Powered Analytics service." },
      { keywords: ["support", "maintenance", "after launch", "ongoing"],
        reply: "We offer ongoing support plans starting at $650/month, plus monitoring after launch — we don't just hand off a project and disappear." },
      { keywords: ["service", "offer", "what do you do", "what can you"],
        reply: "We build AI chatbots, automate business processes, develop custom AI agents, connect your tools together, and handle data & analytics. See the full list on our Services page." },
      { keywords: ["portfolio", "case stud", "example", "past work", "client", "result"],
        reply: "We've helped clients cut support tickets by 65%, speed up invoice processing by 80%, and more — see real examples on our Portfolio page." },
      { keywords: ["worked before", "work before", "companies have you worked", "company that you work", "company you worked", "previous compan", "past compan", "work experience", "where have you worked"],
        reply: "Before founding IntelliAgent, our founder Allan freelanced as an AI & Automation Specialist, Automation Specialist, and AI Specialist for companies including APEX Co., Titus Global-Tech, and SonglabAI — see the Track Record section on our About page for details and verified recommendations." },
      { keywords: ["who are you", "what is intelliagent", "about you", "tell me about", "team", "who works", "founder", "who is allan"],
        reply: "IntelliAgent is an AI & automation agency — we help businesses save time and cut costs with AI chatbots, workflow automation, and custom AI agents. We're a small senior team led by Allan Abendanio, our Founder & AI Automation Lead — see the full team on our About page." },
      { keywords: ["location", "where are you", "based", "office", "address", "country"],
        reply: "We're based in the Philippines and work with clients worldwide — fully remote-first." },
      { keywords: ["industr", "small business", "what kind of business", "who do you work with"],
        reply: "We work with businesses of all sizes across industries — retail, finance, logistics, legal, healthcare, and more. If you've got a repetitive process, we can probably automate it." },
      { keywords: ["how long", "timeline", "turnaround", "when can"],
        reply: "Simple projects usually launch in 1-3 weeks; larger custom builds take 4-8 weeks depending on scope." },
      { keywords: ["payment", "how do i pay", "invoice me"],
        reply: "We'll go over payment details during your consultation — typically a deposit to start, with the balance on delivery." },
      { keywords: ["custom", "specific need", "tailor"],
        reply: "Absolutely — most of our projects are custom-built around a client's exact workflow rather than off-the-shelf." },
      { keywords: ["free trial", "demo", "try it", "test it"],
        reply: "This chat is actually a live example of the kind of assistant we build! For a full demo tailored to your business, book a free consultation." },
      { keywords: ["contact", "contac", "talk to", "human", "call", "phone", "reach you", "email you"],
        reply: "You can reach us directly at lance0145@gmail.com or +63 930 022 8998, or use the form on our Contact page — we reply within 1 business day." },
      { keywords: ["hi", "hello", "hey"],
        reply: "Hi there! I'm a demo of the kind of assistant we build for clients. Ask me about our services, pricing, or how automation could help your business." },
      { keywords: ["bye", "goodbye", "see you"],
        reply: "Thanks for stopping by! Reach out anytime at lance0145@gmail.com if you'd like to talk further." },
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

    /*
      Real backend: POSTs to a Netlify Function (netlify/functions/chat.js)
      that calls Gemini server-side (API keys never reach the browser) and
      rotates across multiple keys if one is rate-limited or revoked. Only
      exists once deployed on Netlify -- locally (python http.server) this
      404s immediately, which is caught below and falls back to the
      scripted demoRules, so local dev still shows something working.
    */
    var chatHistory = [];
    var MAX_HISTORY_TURNS = 6;
    var STORAGE_KEY = "intelliagent_chat_state";
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var LEAD_INTENT_KEYWORDS = ["quote", "get started", "book a call", "sign me up", "leave my info"];

    // Captured before any JS mutates the panel, so "Start over" can restore
    // the page's own hardcoded greeting bubble exactly as shipped.
    var originalBodyHTML = body.innerHTML;

    var leadFlow = { active: false, step: null, data: {} };
    var currentQuickReplyWrap = null;

    function askGemini(text) {
      return fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory })
      }).then(function (res) {
        if (!res.ok) throw new Error("chat function status " + res.status);
        return res.json();
      }).then(function (data) {
        if (!data || !data.reply) throw new Error("empty reply");
        return data.reply;
      });
    }

    function addBubble(text, who) {
      var b = document.createElement("div");
      b.className = "bubble " + who;
      b.textContent = text;
      body.appendChild(b);
      body.scrollTop = body.scrollHeight;
    }

    function addTyping() {
      var typing = document.createElement("div");
      typing.className = "bubble bot typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      return typing;
    }

    /*
      Quick-reply buttons: always static labels we write ourselves (never
      user input, so no injection risk). Clicking removes the row, echoes
      the choice as a "user" bubble so the transcript still reads like a
      normal conversation, then calls onSelect(value). Only one row is
      ever live at a time -- a new one replaces whatever was still
      dangling, and typing a reply instead also clears it (see the submit
      handler below).
    */
    function addQuickReplies(options, onSelect) {
      if (currentQuickReplyWrap) { currentQuickReplyWrap.remove(); currentQuickReplyWrap = null; }

      var wrap = document.createElement("div");
      wrap.className = "bubble bot quick-replies";

      for (var i = 0; i < options.length; i++) {
        (function (opt) {
          var label = typeof opt === "string" ? opt : opt.label;
          var value = typeof opt === "string" ? opt : (opt.value || opt.label);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "qr-btn";
          btn.textContent = label;
          btn.addEventListener("click", function () {
            wrap.remove();
            if (currentQuickReplyWrap === wrap) currentQuickReplyWrap = null;
            addBubble(label, "user");
            onSelect(value);
          });
          wrap.appendChild(btn);
        })(options[i]);
      }

      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
      currentQuickReplyWrap = wrap;
    }

    // Shared by every lead-flow question: shows the bot's prompt, then a
    // Cancel option alongside any step-specific choices (e.g. the plan
    // names at the service step).
    function promptFlowStep(message, options) {
      addBubble(message, "bot");
      var all = (options || []).concat([{ label: "Cancel", value: "__CANCEL__" }]);
      addQuickReplies(all, function (value) {
        if (value === "__CANCEL__") { cancelLeadFlow(); return; }
        handleFlowStep(value);
      });
    }

    /*
      Pricing-tier cards -- copy hand-synced from pricing.html and
      chat.js's SYSTEM_PROMPT. If prices/tiers ever change, update all
      three (this is the one deliberate tradeoff of rendering pricing
      directly in the widget instead of only describing it in text).
    */
    function addPricingCards() {
      var wrap = document.createElement("div");
      wrap.className = "bubble bot pricing-cards";

      var tiers = [
        { name: "Starter", price: "$1,990", note: "one-time", blurb: "A single automation or chatbot to prove the value fast." },
        { name: "Growth", price: "$6,490", note: "one-time", blurb: "For businesses ready to automate multiple workflows." },
        { name: "Enterprise", price: "Custom", note: "", blurb: "Custom AI systems, ongoing partnership, and dedicated support." }
      ];

      for (var i = 0; i < tiers.length; i++) {
        (function (tier) {
          var card = document.createElement("div");
          card.className = "pricing-card";

          var h = document.createElement("h4");
          h.textContent = tier.name;

          var price = document.createElement("div");
          price.className = "pricing-card-price";
          price.textContent = tier.price + (tier.note ? " " + tier.note : "");

          var blurb = document.createElement("p");
          blurb.className = "pricing-card-blurb";
          blurb.textContent = tier.blurb;

          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "qr-btn";
          btn.textContent = "Choose this plan";
          btn.addEventListener("click", function () {
            addBubble("Choose this plan: " + tier.name, "user");
            startLeadFlow(tier.name);
          });

          card.appendChild(h);
          card.appendChild(price);
          card.appendChild(blurb);
          card.appendChild(btn);
          wrap.appendChild(card);
        })(tiers[i]);
      }

      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    }

    function addAvailabilityBadge() {
      var badge = document.createElement("div");
      badge.className = "chat-availability";
      badge.textContent = "⚡ Replies in seconds · Available 24/7";
      body.appendChild(badge);
    }

    function saveChatState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          history: chatHistory,
          leadFlow: leadFlow,
          panelOpen: chatPanel.classList.contains("open")
        }));
      } catch (e) {}
    }

    function loadChatState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function startOver() {
      chatHistory = [];
      leadFlow = { active: false, step: null, data: {} };
      currentQuickReplyWrap = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      body.innerHTML = originalBodyHTML;
      addAvailabilityBadge();
    }

    /*
      Lead-capture flow: a deterministic 4-question state machine, not an
      LLM tool call. A flow this important to get right (a real sales
      lead) shouldn't depend on a lite model reliably deciding to "call a
      function" -- see js/main.js's sibling comment in chat.js for why
      gemini-flash-lite-latest specifically isn't trusted with that here.
      While leadFlow.active, the submit handler below routes straight to
      handleFlowStep instead of askGemini/matchReply.
    */
    function startLeadFlow(prefillService) {
      leadFlow = { active: true, step: "name", data: { service: prefillService || null } };
      promptFlowStep("Awesome — let's get you a quick quote. What's your name?");
      saveChatState();
    }

    function cancelLeadFlow() {
      leadFlow = { active: false, step: null, data: {} };
      addBubble("No problem — let me know if you change your mind. Anything else I can help with?", "bot");
      saveChatState();
    }

    function handleFlowStep(text) {
      var step = leadFlow.step;
      var value = (text || "").toString().trim();

      if (step === "name") {
        if (!value) { promptFlowStep("I didn't catch that — what's your name?"); return; }
        leadFlow.data.name = value.slice(0, 100);
        leadFlow.step = "email";
        promptFlowStep("Thanks, " + leadFlow.data.name + "! What's the best email to reach you at?");

      } else if (step === "email") {
        if (!EMAIL_RE.test(value)) {
          promptFlowStep("That doesn't look like a valid email — mind double-checking?");
          return;
        }
        leadFlow.data.email = value.slice(0, 200);
        if (leadFlow.data.service) {
          leadFlow.step = "time";
          promptFlowStep("Got it. What's a good day/time for a quick call? (e.g. \"weekday mornings\" or \"Thu 3pm PH time\")");
        } else {
          leadFlow.step = "service";
          promptFlowStep("Which service or plan are you interested in?",
            [{ label: "Starter" }, { label: "Growth" }, { label: "Enterprise" }, { label: "Not sure yet" }]);
        }

      } else if (step === "service") {
        leadFlow.data.service = value.slice(0, 200) || "Not sure yet";
        leadFlow.step = "time";
        promptFlowStep("Got it. What's a good day/time for a quick call? (e.g. \"weekday mornings\" or \"Thu 3pm PH time\")");

      } else if (step === "time") {
        leadFlow.data.preferredTime = value.slice(0, 200) || "no preference given";
        submitLead();
      }

      saveChatState();
    }

    function submitLead() {
      var data = leadFlow.data;
      var typing = addTyping();

      fetch("/.netlify/functions/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          service: data.service,
          preferredTime: data.preferredTime,
          page: location.pathname,
          hp: ""
        })
      }).then(function (res) {
        if (!res.ok) throw new Error("lead status " + res.status);
        return res.json();
      }).then(function (resData) {
        if (!resData || !resData.ok) throw new Error("lead not ok");
        typing.remove();
        addBubble("Thanks " + data.name + " — I've sent this to our team and Ana will follow up at " + data.email + " soon!", "bot");
        leadFlow = { active: false, step: null, data: {} };
        saveChatState();
      }).catch(function () {
        typing.remove();
        addBubble("I couldn't send that through — reach us directly at lance0145@gmail.com, or try again below.", "bot");
        addQuickReplies([{ label: "Try again" }], function () { submitLead(); });
        saveChatState();
      });
    }

    function rerenderCurrentFlowStep() {
      var prompts = {
        name: "Picking up where we left off — what's your name?",
        email: "What's the best email to reach you at?",
        service: "Which service or plan are you interested in?",
        time: "What's a good day/time for a quick call? (e.g. \"weekday mornings\" or \"Thu 3pm PH time\")"
      };
      var msg = prompts[leadFlow.step] || "Let's continue — go ahead.";
      if (leadFlow.step === "service") {
        promptFlowStep(msg, [{ label: "Starter" }, { label: "Growth" }, { label: "Enterprise" }, { label: "Not sure yet" }]);
      } else {
        promptFlowStep(msg);
      }
    }

    // Always-visible actions: reachable regardless of scroll position,
    // injected once between the message list and the input bar.
    var quickActionsBar = document.createElement("div");
    quickActionsBar.className = "chat-quick-actions";

    var pricingActionBtn = document.createElement("button");
    pricingActionBtn.type = "button";
    pricingActionBtn.className = "qa-btn";
    pricingActionBtn.textContent = "💲 Pricing";
    pricingActionBtn.addEventListener("click", function () {
      addBubble("💲 Pricing", "user");
      addPricingCards();
    });

    var quoteActionBtn = document.createElement("button");
    quoteActionBtn.type = "button";
    quoteActionBtn.className = "qa-btn";
    quoteActionBtn.textContent = "📝 Get a quote";
    quoteActionBtn.addEventListener("click", function () {
      addBubble("📝 Get a quote", "user");
      startLeadFlow(null);
    });

    var startOverActionBtn = document.createElement("button");
    startOverActionBtn.type = "button";
    startOverActionBtn.className = "qa-btn";
    startOverActionBtn.textContent = "🔄 Start over";
    startOverActionBtn.addEventListener("click", startOver);

    quickActionsBar.appendChild(pricingActionBtn);
    quickActionsBar.appendChild(quoteActionBtn);
    quickActionsBar.appendChild(startOverActionBtn);
    chatPanel.insertBefore(quickActionsBar, form);

    addAvailabilityBadge();

    // Restore a visitor's conversation across page navigation/reloads --
    // the chat widget markup is duplicated per-page, so without this,
    // clicking from Pricing to Contact would otherwise look like talking
    // to a different, amnesiac bot every time.
    (function restoreChatState() {
      var saved = loadChatState();
      if (!saved) return;

      if (Array.isArray(saved.history) && saved.history.length) {
        chatHistory = saved.history;
        for (var i = 0; i < chatHistory.length; i++) {
          addBubble(chatHistory[i].text, chatHistory[i].role === "bot" ? "bot" : "user");
        }
      }
      if (saved.leadFlow && saved.leadFlow.active) {
        leadFlow = saved.leadFlow;
        rerenderCurrentFlowStep();
      }
      if (saved.panelOpen) {
        chatPanel.classList.add("open");
      }
    })();

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;

        if (currentQuickReplyWrap) { currentQuickReplyWrap.remove(); currentQuickReplyWrap = null; }

        addBubble(text, "user");
        input.value = "";

        if (leadFlow.active) {
          handleFlowStep(text);
          return;
        }

        var lower = text.toLowerCase();
        for (var li = 0; li < LEAD_INTENT_KEYWORDS.length; li++) {
          if (lower.indexOf(LEAD_INTENT_KEYWORDS[li]) !== -1) {
            startLeadFlow(null);
            return;
          }
        }

        var typing = addTyping();

        askGemini(text).then(function (reply) {
          typing.remove();
          addBubble(reply, "bot");
          chatHistory.push({ role: "user", text: text });
          chatHistory.push({ role: "bot", text: reply });
          chatHistory = chatHistory.slice(-MAX_HISTORY_TURNS * 2);
          saveChatState();
        }).catch(function () {
          typing.remove();
          var result = matchReply(text);
          addBubble(result.reply, "bot");
          if (!result.matched) logUnmatchedQuestion(text);
          saveChatState();
        });
      });
    }
  }
})();
