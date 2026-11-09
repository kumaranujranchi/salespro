/* ==========================================================================
   RealSalePro — landing interactions
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (window.scrollY < window.innerHeight * 0.55) {
      Array.prototype.forEach.call(document.querySelectorAll(".nav__links a.is-active"), function (a) {
        a.classList.remove("is-active");
      });
    }
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  function setMenu(open) {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
    var use = navToggle.querySelector("use");
    if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      setMenu(mobileMenu.hidden);
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- WhatsApp FAB visibility ---------- */
  var waFloat = document.querySelector(".wa-float");
  var footerEl = document.querySelector(".footer");
  function updateFab() {
    if (!waFloat) return;
    var footerTop = footerEl ? footerEl.getBoundingClientRect().top + window.scrollY : Infinity;
    var pastHero = window.scrollY > Math.min(520, window.innerHeight * 0.7);
    var beforeFooter = window.scrollY + window.innerHeight < footerTop + 40;
    waFloat.classList.toggle("is-visible", pastHero && beforeFooter);
  }
  updateFab();
  window.addEventListener("scroll", updateFab, { passive: true });
  window.addEventListener("resize", updateFab);

  /* ---------- Scroll progress ---------- */
  var scrollBar = document.getElementById("scrollBar");
  function onProgress() {
    if (!scrollBar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    scrollBar.style.width = pct + "%";
  }
  onProgress();
  window.addEventListener("scroll", onProgress, { passive: true });
  window.addEventListener("resize", onProgress);

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          el.style.transitionDelay = delay + "ms";
          el.classList.add("is-in");
          revealObserver.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1500;
    var start = null;

    if (reduceMotion) {
      el.textContent = target.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      return;
    }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = target * eased;
      el.textContent = value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Product tabs ---------- */
  var tabWrap = document.querySelector("[data-tabs]");
  if (tabWrap) {
    var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll("[role='tab']"));
    var panels = Array.prototype.slice.call(tabWrap.querySelectorAll("[role='tabpanel']"));

    function activateTab(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.setAttribute("tabindex", active ? "0" : "-1");
      });
      panels.forEach(function (p) {
        var active = p.id === "panel-" + tab.getAttribute("data-tab");
        p.classList.toggle("is-active", active);
        p.hidden = !active;
        if (active) {
          // re-trigger entry animation
          p.style.animation = "none";
          void p.offsetWidth;
          p.style.animation = "";
        }
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activateTab(tab); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          activateTab(next);
          next.focus();
        }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq__item"));
  faqItems.forEach(function (item) {
    var q = item.querySelector(".faq__q");
    var a = item.querySelector(".faq__a");
    if (!q || !a) return;
    a.setAttribute("aria-hidden", "true");
    a.inert = true;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      faqItems.forEach(function (other) {
        var otherA = other.querySelector(".faq__a");
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          other.querySelector(".faq__q").setAttribute("aria-expanded", "false");
          if (otherA) {
            otherA.style.maxHeight = "0px";
            otherA.setAttribute("aria-hidden", "true");
            otherA.inert = true;
          }
        }
      });
      item.classList.toggle("is-open", !isOpen);
      q.setAttribute("aria-expanded", String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : "0px";
      a.setAttribute("aria-hidden", String(isOpen));
      a.inert = isOpen;
    });
  });
  window.addEventListener("resize", function () {
    faqItems.forEach(function (item) {
      if (!item.classList.contains("is-open")) return;
      var a = item.querySelector(".faq__a");
      if (a) a.style.maxHeight = a.scrollHeight + "px";
    });
  });

  /* ---------- Pricing billing cycle ---------- */
  var billingBtns = Array.prototype.slice.call(document.querySelectorAll("[data-cycle]"));
  var priceEl = document.querySelector("[data-price]");
  var priceNote = document.querySelector("[data-price-note]");
  var cycles = {
    monthly: { price: "₹1,500", note: "Billed monthly. Cancel anytime." },
    semi: { price: "₹1,200", note: "Billed ₹7,200 semi-annually — save 20%." },
    yearly: { price: "₹1,000", note: "Billed ₹12,000 annually — save 33%." }
  };

  billingBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cycle = cycles[btn.getAttribute("data-cycle")];
      if (!cycle) return;
      billingBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      var live = document.querySelector("[data-price-live]");
      if (live) live.textContent = "Pro plan, " + cycle.price + " per month. " + cycle.note;
      if (priceEl) {
        priceEl.style.opacity = "0";
        priceEl.style.transform = "translateY(6px)";
        priceEl.style.transition = "opacity .18s, transform .18s";
        setTimeout(function () {
          priceEl.textContent = cycle.price;
          priceEl.style.opacity = "1";
          priceEl.style.transform = "none";
        }, 160);
      }
      if (priceNote) priceNote.textContent = cycle.note;
    });
  });

  /* ---------- Card spotlight ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  /* ---------- Integration filters ---------- */
  var intButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var intCards = Array.prototype.slice.call(document.querySelectorAll("[data-int-grid] .int"));
  intButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      intButtons.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      intCards.forEach(function (card, i) {
        var show = filter === "all" || card.getAttribute("data-cat") === filter;
        card.hidden = !show;
        if (show && !reduceMotion) {
          card.style.animation = "none";
          void card.offsetWidth;
          card.style.animation = "fadeUp 0.4s var(--ease) both";
          card.style.animationDelay = (i % 6) * 30 + "ms";
        }
      });
    });
  });

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a[href^='#']"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = sections.filter(function (s) { return s.section === entry.target; })[0];
          if (!match) return;
          navLinks.forEach(function (l) { l.classList.remove("is-active"); });
          match.link.classList.add("is-active");
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { sectionObserver.observe(s.section); });
  }
})();
