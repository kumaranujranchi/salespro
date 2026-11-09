/* ==========================================================================
   RealSalePro — Landing Page Interactions (TypeScript Module)
   ========================================================================== */

export function initLandingInteractions(): () => void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (window.scrollY < window.innerHeight * 0.55) {
      document.querySelectorAll(".nav__links a.is-active").forEach((a) => {
        a.classList.remove("is-active");
      });
    }
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  function setMenu(open: boolean) {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
    const use = navToggle.querySelector("use");
    if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
  }

  const handleNavToggleClick = () => {
    if (mobileMenu) setMenu(mobileMenu.hidden);
  };
  const handleMobileMenuClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement)?.closest("a")) setMenu(false);
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMenu(false);
  };

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", handleNavToggleClick);
    mobileMenu.addEventListener("click", handleMobileMenuClick);
    document.addEventListener("keydown", handleKeyDown);
  }

  /* ---------- WhatsApp FAB visibility ---------- */
  const waFloat = document.querySelector(".wa-float");
  const footerEl = document.querySelector(".footer");
  function updateFab() {
    if (!waFloat) return;
    const footerTop = footerEl ? footerEl.getBoundingClientRect().top + window.scrollY : Infinity;
    const pastHero = window.scrollY > Math.min(520, window.innerHeight * 0.7);
    const beforeFooter = window.scrollY + window.innerHeight < footerTop + 40;
    waFloat.classList.toggle("is-visible", pastHero && beforeFooter);
  }
  updateFab();
  window.addEventListener("scroll", updateFab, { passive: true });
  window.addEventListener("resize", updateFab);

  /* ---------- Scroll progress ---------- */
  const scrollBar = document.getElementById("scrollBar");
  function onProgress() {
    if (!scrollBar) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    scrollBar.style.width = pct + "%";
  }
  onProgress();
  window.addEventListener("scroll", onProgress, { passive: true });
  window.addEventListener("resize", onProgress);

  /* ---------- Reveal on scroll ---------- */
  const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  let revealObserver: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          el.style.transitionDelay = delay + "ms";
          el.classList.add("is-in");
          revealObserver?.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => { revealObserver?.observe(el); });
  } else {
    revealEls.forEach((el) => { el.classList.add("is-in"); });
  }

  /* ---------- Animated counters ---------- */
  const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
  function runCounter(el: HTMLElement) {
    const target = parseFloat(el.getAttribute("data-count") || "0");
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1500;
    let start: number | null = null;

    if (reduceMotion) {
      el.textContent = target.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      return;
    }

    function step(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  let countObserver: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target as HTMLElement);
          countObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => { countObserver?.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Product tabs ---------- */
  const tabWrap = document.querySelector("[data-tabs]");
  if (tabWrap) {
    const tabs = Array.from(tabWrap.querySelectorAll<HTMLElement>("[role='tab']"));
    const panels = Array.from(tabWrap.querySelectorAll<HTMLElement>("[role='tabpanel']"));

    function activateTab(tab: HTMLElement) {
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.setAttribute("tabindex", active ? "0" : "-1");
      });
      panels.forEach((p) => {
        const active = p.id === "panel-" + tab.getAttribute("data-tab");
        p.classList.toggle("is-active", active);
        p.hidden = !active;
        if (active) {
          p.style.animation = "none";
          void p.offsetWidth;
          p.style.animation = "";
        }
      });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => { activateTab(tab); });
      tab.addEventListener("keydown", (e) => {
        let next: HTMLElement | null = null;
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
  const faqItems = Array.from(document.querySelectorAll<HTMLElement>(".faq__item"));
  faqItems.forEach((item) => {
    const q = item.querySelector<HTMLElement>(".faq__q");
    const a = item.querySelector<HTMLElement>(".faq__a");
    if (!q || !a) return;
    a.setAttribute("aria-hidden", "true");
    (a as any).inert = true;
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach((other) => {
        const otherA = other.querySelector<HTMLElement>(".faq__a");
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          other.querySelector(".faq__q")?.setAttribute("aria-expanded", "false");
          if (otherA) {
            otherA.style.maxHeight = "0px";
            otherA.setAttribute("aria-hidden", "true");
            (otherA as any).inert = true;
          }
        }
      });
      item.classList.toggle("is-open", !isOpen);
      q.setAttribute("aria-expanded", String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : "0px";
      a.setAttribute("aria-hidden", String(isOpen));
      (a as any).inert = isOpen;
    });
  });

  const handleResizeFaq = () => {
    faqItems.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      const a = item.querySelector<HTMLElement>(".faq__a");
      if (a) a.style.maxHeight = a.scrollHeight + "px";
    });
  };
  window.addEventListener("resize", handleResizeFaq);

  /* ---------- Pricing billing cycle ---------- */
  const billingBtns = Array.from(document.querySelectorAll<HTMLElement>("[data-cycle]"));
  const priceEl = document.querySelector<HTMLElement>("[data-price]");
  const priceNote = document.querySelector<HTMLElement>("[data-price-note]");
  const cycles: Record<string, { price: string; note: string }> = {
    monthly: { price: "₹1,500", note: "Billed monthly. Cancel anytime." },
    semi: { price: "₹1,200", note: "Billed ₹7,200 semi-annually — save 20%." },
    yearly: { price: "₹1,000", note: "Billed ₹12,000 annually — save 33%." }
  };

  billingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cycleKey = btn.getAttribute("data-cycle") || "";
      const cycle = cycles[cycleKey];
      if (!cycle) return;
      billingBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      const live = document.querySelector<HTMLElement>("[data-price-live]");
      if (live) live.textContent = "Pro plan, " + cycle.price + " per month. " + cycle.note;
      if (priceEl) {
        priceEl.style.opacity = "0";
        priceEl.style.transform = "translateY(6px)";
        priceEl.style.transition = "opacity .18s, transform .18s";
        setTimeout(() => {
          priceEl.textContent = cycle.price;
          priceEl.style.opacity = "1";
          priceEl.style.transform = "none";
        }, 160);
      }
      if (priceNote) priceNote.textContent = cycle.note;
    });
  });

  /* ---------- Card spotlight ---------- */
  const cardPointerCleanups: Array<() => void> = [];
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll<HTMLElement>(".card").forEach((card) => {
      const handlePointerMove = (e: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      };
      card.addEventListener("pointermove", handlePointerMove);
      cardPointerCleanups.push(() => card.removeEventListener("pointermove", handlePointerMove));
    });
  }

  /* ---------- Integration filters ---------- */
  const intButtons = Array.from(document.querySelectorAll<HTMLElement>("[data-filter]"));
  const intCards = Array.from(document.querySelectorAll<HTMLElement>("[data-int-grid] .int"));
  intButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");
      intButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      intCards.forEach((card, i) => {
        const show = filter === "all" || card.getAttribute("data-cat") === filter;
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
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav__links a[href^='#']"));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1) || "";
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean) as Array<{ link: HTMLAnchorElement; section: HTMLElement }>;

  let sectionObserver: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window && sections.length) {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = sections.find((s) => s.section === entry.target);
          if (!match) return;
          navLinks.forEach((l) => { l.classList.remove("is-active"); });
          match.link.classList.add("is-active");
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );
    sections.forEach((s) => { sectionObserver?.observe(s.section); });
  }

  /* ---------- Return Cleanup Function ---------- */
  return () => {
    window.removeEventListener("scroll", onScrollNav);
    window.removeEventListener("scroll", updateFab);
    window.removeEventListener("resize", updateFab);
    window.removeEventListener("scroll", onProgress);
    window.removeEventListener("resize", onProgress);
    window.removeEventListener("resize", handleResizeFaq);

    if (navToggle) navToggle.removeEventListener("click", handleNavToggleClick);
    if (mobileMenu) mobileMenu.removeEventListener("click", handleMobileMenuClick);
    document.removeEventListener("keydown", handleKeyDown);

    revealObserver?.disconnect();
    countObserver?.disconnect();
    sectionObserver?.disconnect();
    cardPointerCleanups.forEach((cleanup) => cleanup());
  };
}
