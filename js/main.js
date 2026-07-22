/* ============================================================
   ARKA — Portfolio interactions & motion
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Smooth scroll (Lenis) — Framer-style scroll lag ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.2 });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ---------- Page load & transitions ---------- */
  const transition = document.querySelector(".page-transition");

  function playEnter() {
    document.body.classList.add("is-loaded");
    if (transition) {
      transition.classList.add("is-active", "is-leaving");
      setTimeout(() => transition.classList.remove("is-active", "is-leaving"), 800);
    }
  }

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) playEnter(); // restored from bfcache
  });
  requestAnimationFrame(playEnter);

  // Disabled "coming soon" cards — swallow the click, go nowhere
  document.addEventListener("click", (e) => {
    const soon = e.target.closest('a[aria-disabled="true"]');
    if (soon) e.preventDefault();
  });

  // Intercept internal links for exit animation
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link || reduceMotion || !transition) return;
    const href = link.getAttribute("href");
    const isInternal =
      href && !href.startsWith("#") && !href.startsWith("mailto:") &&
      !href.startsWith("http") && link.target !== "_blank";
    if (!isInternal) return;
    e.preventDefault();
    transition.classList.remove("is-leaving");
    transition.classList.add("is-active");
    setTimeout(() => (window.location.href = href), 550);
  });

  /* ---------- Header: shadow + hide on scroll down ---------- */
  const header = document.querySelector(".site-header");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      header.classList.toggle("is-hidden", y > 320 && y > lastY);
    }
    lastY = y;
    // Reading progress (case study)
    const bar = document.querySelector(".progress-bar");
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (lenis) (open ? lenis.stop() : lenis.start());
    };
    toggle.addEventListener("click", () =>
      setMenu(!mobileMenu.classList.contains("is-open"))
    );
    const closeBtn = mobileMenu.querySelector(".mobile-close");
    if (closeBtn) closeBtn.addEventListener("click", () => setMenu(false));
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
  }

  /* ---------- Smooth in-page scrolling: back-to-top + anchor links (TOC) ---------- */
  document.addEventListener("click", (e) => {
    const toTop = e.target.closest(".to-top");
    if (toTop) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute("href").slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.2, offset: -20 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealables = document.querySelectorAll(".reveal, .line");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1400;
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.innerHTML = '<span class="cursor-label">View</span>';
    document.body.append(dot, ring);

    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor='view']");
      const hover = e.target.closest("a, button, .chip, .filter-btn");
      ring.classList.toggle("is-view", !!view);
      ring.classList.toggle("is-hover", !!hover && !view);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Subtle tilt on covers ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach((el) => {
      if (el.closest(".is-soon")) return;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${py * -5}deg)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 700);
      });
    });
  }

  /* ---------- Portrait spotlight (about page) ---------- */
  const portrait = document.querySelector(".portrait");
  if (portrait && finePointer && !reduceMotion) {
    portrait.addEventListener("mousemove", (e) => {
      const r = portrait.getBoundingClientRect();
      portrait.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      portrait.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ---------- Work page filters ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const f = btn.dataset.filter;
        document.querySelectorAll(".grid-item").forEach((item) => {
          const show = f === "all" || item.dataset.cat.includes(f);
          item.classList.toggle("is-filtered", !show);
        });
      });
    });
  }

  /* ---------- Articles page: search + filter + sort ---------- */
  const artGrid = document.querySelector(".articles-grid[data-controls]");
  if (artGrid) {
    const cards = [...artGrid.querySelectorAll(".article-card")];
    const searchInput = document.getElementById("article-search");
    const sortSelect = document.getElementById("article-sort");
    const catBtns = document.querySelectorAll("[data-afilter]");
    const emptyMsg = document.querySelector(".articles-empty");
    let activeCat = "all";

    const applyFilters = () => {
      const q = (searchInput ? searchInput.value : "").trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const matchCat = activeCat === "all" || card.dataset.cat === activeCat;
        const matchQuery = !q || (card.dataset.title + " " + card.textContent).toLowerCase().includes(q);
        const show = matchCat && matchQuery;
        card.classList.toggle("is-filtered", !show);
        if (show) visible++;
      });
      if (emptyMsg) emptyMsg.hidden = visible > 0;
    };

    const applySort = () => {
      const v = sortSelect ? sortSelect.value : "newest";
      const sorted = [...cards].sort((a, b) => {
        if (v === "az") return a.dataset.title.localeCompare(b.dataset.title);
        if (v === "oldest") return a.dataset.date.localeCompare(b.dataset.date);
        return b.dataset.date.localeCompare(a.dataset.date);
      });
      sorted.forEach((card) => artGrid.appendChild(card));
    };

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (sortSelect) sortSelect.addEventListener("change", applySort);
    catBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        catBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeCat = btn.dataset.afilter;
        applyFilters();
      });
    });
    applySort();
  }

  /* ---------- Case study: click-to-load video embeds ---------- */
  document.querySelectorAll(".video-embed[data-src]").forEach((wrap) => {
    wrap.addEventListener("click", () => {
      if (wrap.classList.contains("is-playing")) return;
      const video = document.createElement("video");
      video.src = wrap.dataset.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      wrap.appendChild(video);
      wrap.classList.add("is-playing");
    });
  });

  /* ---------- Case study: table-of-contents scroll-spy ---------- */
  const tocLinks = document.querySelectorAll(".case-toc a[href^='#']");
  if (tocLinks.length) {
    const sections = [...tocLinks]
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector(`.case-toc a[href="#${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            tocLinks.forEach((l) => l.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Case study: image lightbox (FLIP entrance + pinch/scroll zoom) ---------- */
  const mediaImgs = [...document.querySelectorAll(".media-frame img")];
  if (mediaImgs.length) {
    let lightbox, lightboxFrame, lightboxImg, closeBtn;
    let activeTrigger = null;
    let scale = 1, tx = 0, ty = 0;
    const MIN_SCALE = 1, MAX_SCALE = 4;
    const pointers = new Map();
    let pinchStartDist = 0, pinchStartScale = 1;
    let dragging = false, moved = false;
    let dragStart = { x: 0, y: 0 }, dragOrigin = { x: 0, y: 0 };

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    function applyTransform(smooth) {
      lightboxImg.classList.toggle("is-settling", !!smooth);
      lightboxImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      lightboxFrame.classList.toggle("is-zoomed", scale > 1.01);
      if (smooth) setTimeout(() => lightboxImg.classList.remove("is-settling"), 360);
    }

    function clampPan() {
      const maxX = (lightboxFrame.clientWidth * (scale - 1)) / 2;
      const maxY = (lightboxFrame.clientHeight * (scale - 1)) / 2;
      tx = clamp(tx, -maxX, maxX);
      ty = clamp(ty, -maxY, maxY);
    }

    function zoomAt(clientX, clientY, nextScale, smooth) {
      const r = lightboxFrame.getBoundingClientRect();
      const px = clientX - r.left - r.width / 2;
      const py = clientY - r.top - r.height / 2;
      const ratio = nextScale / scale;
      tx = px - (px - tx) * ratio;
      ty = py - (py - ty) * ratio;
      scale = nextScale;
      clampPan();
      applyTransform(smooth);
    }

    function onWheel(e) {
      if (!lightbox.classList.contains("is-open")) return;
      e.preventDefault();
      const next = clamp(scale * (e.deltaY > 0 ? 0.88 : 1.14), MIN_SCALE, MAX_SCALE);
      zoomAt(e.clientX, e.clientY, next, false);
    }

    function onPointerDown(e) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pointers.size === 1) {
        dragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        dragOrigin = { x: tx, y: ty };
        try { lightboxFrame.setPointerCapture(e.pointerId); } catch (err) {}
      } else if (pointers.size === 2) {
        dragging = false;
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartScale = scale;
      }
    }

    function onPointerMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const next = clamp(pinchStartScale * (dist / pinchStartDist), MIN_SCALE, MAX_SCALE);
        zoomAt(midX, midY, next, false);
        moved = true;
        return;
      }

      if (dragging && scale > 1) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        tx = dragOrigin.x + dx;
        ty = dragOrigin.y + dy;
        clampPan();
        applyTransform(false);
        lightboxFrame.classList.add("is-panning");
      }
    }

    function onPointerUp(e) {
      pointers.delete(e.pointerId);
      dragging = false;
      lightboxFrame.classList.remove("is-panning");
      if (pointers.size === 0 && !moved) {
        const next = scale > 1.01 ? 1 : 2.2;
        zoomAt(e.clientX, e.clientY, next, true);
      }
    }

    function buildLightbox() {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.setAttribute("aria-label", "Image preview");
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.innerHTML =
        '<div class="lightbox-backdrop"></div>' +
        '<button type="button" class="lightbox-close" aria-label="Close preview">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        "</button>" +
        '<div class="lightbox-frame"><img class="lightbox-img" alt="" draggable="false" /></div>' +
        '<p class="lightbox-hint">Scroll or pinch to zoom · Drag to pan</p>';
      document.body.appendChild(lightbox);
      lightboxFrame = lightbox.querySelector(".lightbox-frame");
      lightboxImg = lightbox.querySelector(".lightbox-img");
      closeBtn = lightbox.querySelector(".lightbox-close");

      lightbox.querySelector(".lightbox-backdrop").addEventListener("click", closeLightbox);
      closeBtn.addEventListener("click", closeLightbox);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
      });

      lightboxFrame.addEventListener("wheel", onWheel, { passive: false });
      lightboxFrame.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }

    function fitSize(naturalW, naturalH) {
      const maxW = Math.min(window.innerWidth * 0.92, 1600);
      const maxH = window.innerHeight * 0.86;
      const ratio = Math.min(maxW / naturalW, maxH / naturalH, 1.6);
      return { w: naturalW * ratio, h: naturalH * ratio };
    }

    function openLightbox(trigger) {
      if (!lightbox) buildLightbox();
      activeTrigger = trigger;
      const r0 = trigger.getBoundingClientRect();
      const naturalW = trigger.naturalWidth || r0.width;
      const naturalH = trigger.naturalHeight || r0.height;
      const { w, h } = fitSize(naturalW, naturalH);
      const targetLeft = (window.innerWidth - w) / 2;
      const targetTop = (window.innerHeight - h) / 2;
      const sourceRadius = getComputedStyle(trigger.closest(".media-frame")).borderRadius;

      lightboxImg.src = trigger.currentSrc || trigger.src;
      lightboxImg.alt = trigger.alt || "";
      scale = 1; tx = 0; ty = 0;
      lightboxImg.classList.remove("is-settling");
      lightboxImg.style.transform = "translate(0px, 0px) scale(1)";
      lightboxFrame.classList.remove("is-zoomed");

      lightboxFrame.style.width = w + "px";
      lightboxFrame.style.height = h + "px";
      lightboxFrame.style.left = targetLeft + "px";
      lightboxFrame.style.top = targetTop + "px";

      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      lightbox.setAttribute("aria-hidden", "false");

      if (reduceMotion) {
        lightboxFrame.style.transition = "none";
        lightboxFrame.style.transform = "none";
        lightboxFrame.style.borderRadius = "20px";
        lightbox.classList.add("is-open");
        closeBtn.focus({ preventScroll: true });
        return;
      }

      // Invert: make the frame visually match the clicked thumbnail's rect
      const scaleX = r0.width / w;
      const scaleY = r0.height / h;
      const deltaX = r0.left + r0.width / 2 - (targetLeft + w / 2);
      const deltaY = r0.top + r0.height / 2 - (targetTop + h / 2);
      lightboxFrame.style.transition = "none";
      lightboxFrame.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
      lightboxFrame.style.borderRadius = sourceRadius;

      lightbox.classList.add("is-open");

      // Play: grow from the thumbnail's rect to the full centered size
      void lightboxFrame.offsetWidth;
      lightboxFrame.style.transition =
        "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
      lightboxFrame.style.transform = "translate(0px, 0px) scale(1, 1)";
      lightboxFrame.style.borderRadius = "20px";

      closeBtn.focus({ preventScroll: true });
    }

    function closeLightbox() {
      if (!lightbox || !lightbox.classList.contains("is-open")) return;
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      lightbox.setAttribute("aria-hidden", "true");

      if (scale !== 1 || tx !== 0 || ty !== 0) {
        lightboxImg.classList.add("is-settling");
        lightboxImg.style.transform = "translate(0px, 0px) scale(1)";
        scale = 1; tx = 0; ty = 0;
      }

      const trigger = activeTrigger;
      if (trigger && !reduceMotion) {
        const r0 = trigger.getBoundingClientRect();
        const fRect = lightboxFrame.getBoundingClientRect();
        const scaleX = r0.width / fRect.width;
        const scaleY = r0.height / fRect.height;
        const deltaX = r0.left + r0.width / 2 - (fRect.left + fRect.width / 2);
        const deltaY = r0.top + r0.height / 2 - (fRect.top + fRect.height / 2);
        const sourceRadius = getComputedStyle(trigger.closest(".media-frame")).borderRadius;
        lightboxFrame.style.transition =
          "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        lightboxFrame.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
        lightboxFrame.style.borderRadius = sourceRadius;
      }

      lightbox.classList.remove("is-open");
      if (trigger) trigger.focus({ preventScroll: true });
      activeTrigger = null;
    }

    mediaImgs.forEach((triggerImg) => {
      const triggerFrame = triggerImg.closest(".media-frame");
      if (!triggerFrame) return;
      triggerFrame.setAttribute("tabindex", "0");
      triggerFrame.setAttribute("role", "button");
      triggerFrame.setAttribute("aria-label", "Expand image");

      const badge = document.createElement("span");
      badge.className = "media-zoom-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>';
      triggerFrame.appendChild(badge);

      triggerFrame.addEventListener("click", (e) => {
        e.preventDefault();
        openLightbox(triggerImg);
      });
      triggerFrame.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(triggerImg);
        }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const wasOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach((i) => i.classList.remove("is-open"));
      if (!wasOpen) item.classList.add("is-open");
    });
  });

  /* ---------- Contact form ---------- */
  const form = document.querySelector(".contact-form");
  if (form) {
    const toast = document.querySelector(".toast");
    const showToast = () => {
      if (!toast) return;
      toast.classList.add("is-visible");
      setTimeout(() => toast.classList.remove("is-visible"), 4200);
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const btn = form.querySelector('[type="submit"]');
      const label = btn ? btn.querySelector("span") : null;
      const original = label ? label.textContent : "";
      if (btn) btn.disabled = true;
      if (label) label.textContent = "Sending…";

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          form.reset();
          showToast();
        } else {
          alert(
            (data && data.message) ||
              "Sorry, something went wrong. Please email me directly at bayu.alpiansyah18@gmail.com."
          );
        }
      } catch (err) {
        alert(
          "Network error — please email me directly at bayu.alpiansyah18@gmail.com."
        );
      } finally {
        if (btn) btn.disabled = false;
        if (label) label.textContent = original;
      }
    });
  }

  /* ---------- Dark mode toggle ---------- */
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

  /* ---------- Jakarta live clock (footer) ---------- */
  const clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const tickClock = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
