/* ============================================================
   MAIN — smooth scroll, hero, scramble hovers, velocity
   marquee, word reveals, horizontal work gallery, overlay
   ============================================================ */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (!prefersReduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.id === "nav-logo") return; // easter.js owns multi-click on DG
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        scrollTo(id);
      }
    });
  });
  document.getElementById("back-to-top").addEventListener("click", () => scrollTo("#top"));

  window.addEventListener("load", () => ScrollTrigger.refresh());

  /* ---------------- custom cursor ---------------- */
  if (finePointer && !prefersReduced) {
    const dot = document.getElementById("cursor");
    const ring = document.getElementById("cursor-ring");
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };

    window.addEventListener("mousemove", (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
    });
    gsap.ticker.add(() => {
      ringPos.x += (pos.x - ringPos.x) * 0.16;
      ringPos.y += (pos.y - ringPos.y) * 0.16;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
    });

    const hoverables = "a, button, [data-magnetic]";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
    });
  }

  /* ---------------- magnetic elements ---------------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------------- local time in nav ---------------- */
  const timeEl = document.getElementById("local-time");
  function tickTime() {
    timeEl.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/New_York",
    }) + " ET";
  }
  tickTime();
  setInterval(tickTime, 30000);

  /* ---------------- text scramble utility ---------------- */
  const SCRAMBLE_POOL = "abcdefghjkmnpqrstuvwxyz0123456789!<>-_\\/[]{}=+*^?#";
  const scrambleHandles = new WeakMap();

  function scrambleTo(el, target, duration = 480) {
    const prev = scrambleHandles.get(el);
    if (prev) cancelAnimationFrame(prev);
    const from = el.textContent;
    const start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const reveal = Math.floor(p * target.length);
      const len = Math.round(from.length + (target.length - from.length) * p);
      let out = target.slice(0, reveal);
      for (let i = reveal; i < len; i++) {
        out += SCRAMBLE_POOL[(Math.random() * SCRAMBLE_POOL.length) | 0];
      }
      el.textContent = out;
      if (p < 1) scrambleHandles.set(el, requestAnimationFrame(frame));
      else {
        el.textContent = target;
        scrambleHandles.delete(el);
      }
    }
    scrambleHandles.set(el, requestAnimationFrame(frame));
  }

  if (finePointer && !prefersReduced) {
    document.querySelectorAll("[data-scramble]").forEach((el) => {
      const original = el.textContent;
      const host = el.closest("a, button") || el;
      host.addEventListener("mouseenter", () => scrambleTo(el, original));
    });
  }

  /* ---------------- hero: split title into live letters ---------------- */
  let heroReady = false;

  document.querySelectorAll(".hero__line-inner").forEach((line) => {
    const frag = document.createDocumentFragment();
    [...line.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split("").forEach((ch) => {
          const s = document.createElement("span");
          s.className = "hero__char";
          s.textContent = ch;
          frag.appendChild(s);
        });
      } else {
        node.classList.add("hero__char");
        frag.appendChild(node);
      }
    });
    line.innerHTML = "";
    line.appendChild(frag);
  });

  const heroChars = gsap.utils.toArray(".hero__char");

  function popChar(ch) {
    gsap.to(ch, {
      yPercent: -16,
      rotation: gsap.utils.random(-12, 12),
      duration: 0.18,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        gsap.to(ch, { yPercent: 0, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
      },
    });
    gsap.fromTo(ch, { color: "#57b3dc" }, { color: "#e9eef2", duration: 0.6, clearProps: "color" });
  }

  if (finePointer && !prefersReduced) {
    heroChars.forEach((ch) => {
      ch.addEventListener("mouseenter", () => {
        if (heroReady) popChar(ch);
      });
    });
  }

  /* ---------------- hero entrance (waits for intro) ---------------- */
  // chars churn through glitch glyphs while they rise, locking left to
  // right — same decode language as the intro and the ascii portrait
  function heroDecode() {
    const UPPER = "#%&XKWMNEHRD0147";
    const LOWER = "abdegqhnu01479";
    heroChars.forEach((ch, i) => {
      const finalChar = ch.textContent;
      const pool = /[a-z]/.test(finalChar) ? LOWER : UPPER;
      ch.style.width = ch.offsetWidth + "px"; // freeze layout while churning
      const lockAt = performance.now() + 420 + i * 70;
      (function churn() {
        if (performance.now() >= lockAt) {
          ch.textContent = finalChar;
          ch.style.width = "";
          return;
        }
        ch.textContent = pool[(Math.random() * pool.length) | 0];
        setTimeout(churn, 44);
      })();
    });
  }

  // after settling, the title keeps breathing: a slow per-char drift
  // plus a random character popping every few seconds
  function heroIdle() {
    heroChars.forEach((ch, i) => {
      gsap.to(ch, {
        y: gsap.utils.random(2.5, 4.5),
        duration: gsap.utils.random(1.7, 2.5),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: i * 0.13,
      });
    });
    setInterval(() => {
      if (!document.hidden) popChar(heroChars[(Math.random() * heroChars.length) | 0]);
    }, 3400);
  }

  function heroEntrance() {
    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => { heroReady = true; heroIdle(); },
    });
    tl.to(".hero__char", { y: 0, rotate: 0, duration: 0.9, stagger: 0.032 }, 0.05)
      .to("#nav", { opacity: 1, y: 0, duration: 0.7 }, 0.35)
      .to(".hero [data-reveal]", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.4);
    heroDecode();
  }

  /* ---------------- hero: lines drift apart on scroll ---------------- */
  if (!prefersReduced) {
    const heroLines = document.querySelectorAll(".hero__title .hero__line");
    if (heroLines.length === 2) {
      const st = { trigger: "#hero", start: "top top", end: "bottom top", scrub: true };
      gsap.to(heroLines[0], { xPercent: -7, ease: "none", scrollTrigger: st });
      gsap.to(heroLines[1], { xPercent: 9, ease: "none", scrollTrigger: st });
    }
  }

  if (prefersReduced) {
    gsap.set(".hero__char", { y: 0, rotate: 0 });
    gsap.set("#nav", { opacity: 1, y: 0 });
    gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    heroReady = true;
  } else if (window.__introDone) {
    heroEntrance();
  } else {
    document.addEventListener("intro:done", heroEntrance, { once: true });
  }

  /* ---------------- flip word (scramble swap) ---------------- */
  const flip = document.getElementById("flip-words");
  if (flip && !prefersReduced) {
    const WORDS = ["developer", "innovator", "creator", "student"];
    let wi = 0;
    setInterval(() => {
      wi = (wi + 1) % WORDS.length;
      scrambleTo(flip, WORDS[wi]);
    }, 2600);
  }

  /* ---------------- velocity-reactive marquee ---------------- */
  const marqueeTrack = document.querySelector(".marquee__track");
  if (marqueeTrack && !prefersReduced) {
    let x = 0;
    let vel = 0;
    let half = 0;

    function measure() { half = marqueeTrack.scrollWidth / 2; }
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    if (lenis) {
      lenis.on("scroll", (e) => { vel = e.velocity || 0; });
    } else {
      let lastY = window.scrollY;
      window.addEventListener("scroll", () => {
        vel = window.scrollY - lastY;
        lastY = window.scrollY;
      }, { passive: true });
    }

    gsap.ticker.add((time, dt) => {
      if (!half) return;
      const boost = gsap.utils.clamp(-900, 900, vel * 14);
      x -= (90 + boost) * (dt / 1000);
      x = gsap.utils.wrap(-half, 0, x);
      gsap.set(marqueeTrack, {
        x,
        skewX: gsap.utils.clamp(-12, 12, -vel * 0.4),
      });
      vel *= 0.9;
    });
  }

  /* ---------------- scroll reveals ---------------- */
  if (!prefersReduced) {
    document.querySelectorAll(".section__title").forEach((title) => {
      gsap.to(title.querySelectorAll(".line-mask > span"), {
        y: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
        scrollTrigger: { trigger: title, start: "top 82%" },
      });
    });

    gsap.utils.toArray("[data-reveal]").filter((el) => !el.closest(".hero")).forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  }

  /* ---------------- about: ascii portrait hash-in reveal ---------------- */
  const asciiEl = document.querySelector(".about__ascii");
  if (asciiEl && !prefersReduced) {
    const FINAL = asciiEl.textContent;
    const POOL = "0123456789abcdef#%@1tfLGE";
    const n = FINAL.length;
    const totalRows = FINAL.split("\n").length;

    const th = new Float32Array(n);
    let row = 0;
    for (let i = 0; i < n; i++) {
      if (FINAL[i] === "\n") { row++; continue; }
      th[i] = 0.12 + 0.88 * (0.55 * Math.random() + 0.45 * (row / totalRows));
    }

    const state = { p: 0 };
    let lastSwap = 0;
    function render(now) {
      if (now - lastSwap < 30 && state.p > 0 && state.p < 1) return;
      lastSwap = now;
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const c = FINAL[i];
        out[i] = c === "\n" || state.p >= th[i]
          ? c
          : POOL[(Math.random() * POOL.length) | 0];
      }
      asciiEl.textContent = out.join("");
    }

    render(performance.now());

    ScrollTrigger.create({
      trigger: ".about__figure",
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(state, {
          p: 1,
          duration: 1.7,
          ease: "power2.inOut",
          onUpdate: () => render(performance.now()),
          onComplete: () => { asciiEl.textContent = FINAL; },
        });
      },
    });
  }

  /* ---------------- work: horizontal scroll gallery ---------------- */
  const workSection = document.getElementById("work");
  const workTrack = document.getElementById("work-track");
  const panels = gsap.utils.toArray(".panel");
  const projectPanels = panels.filter((p) => p.dataset.project);
  const counterEl = document.getElementById("work-counter");
  const barFill = document.getElementById("work-bar-fill");
  const total = projectPanels.length;

  const pad2 = (n) => String(n).padStart(2, "0");

  const mm = gsap.matchMedia();

  mm.add("(min-width: 860px) and (prefers-reduced-motion: no-preference)", () => {
    workSection.classList.add("is-horizontal");
    const dist = () => workTrack.scrollWidth - window.innerWidth;

    const tween = gsap.to(workTrack, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: workSection,
        start: "top top",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const idx = Math.min(total, 1 + Math.floor(self.progress * total));
          counterEl.textContent = pad2(idx) + " / " + pad2(total);
          barFill.style.transform = `scaleX(${self.progress})`;
          workSection.classList.toggle("is-scrolling", self.progress > 0.02);
        },
      },
    });

    projectPanels.forEach((panel) => {
      const img = panel.querySelector(".panel__media img");
      const num = panel.querySelector(".panel__num");
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5,
        ease: "none",
        scrollTrigger: {
          trigger: panel, containerAnimation: tween,
          start: "left right", end: "right left", scrub: true,
        },
      });
      gsap.fromTo(num, { xPercent: 40 }, {
        xPercent: -40,
        ease: "none",
        scrollTrigger: {
          trigger: panel, containerAnimation: tween,
          start: "left right", end: "right left", scrub: true,
        },
      });
    });

    return () => workSection.classList.remove("is-horizontal", "is-scrolling");
  });

  mm.add("(max-width: 859.98px)", () => {
    if (prefersReduced) return;
    panels.forEach((panel) => {
      gsap.from(panel, {
        opacity: 0,
        y: 60,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: panel, start: "top 88%" },
      });
    });
  });

  /* ---------------- project data ---------------- */
  const PROJECTS = {
    synari: {
      title: "Synari",
      kicker: "01 — therapy practice platform",
      img: "./assets/synari-10edb4f1.png",
      chips: ["full-stack", "solo build", "1+ year", "real users", "ai integration"],
      paragraphs: [
        "Synari is a therapy practice management platform that I have been developing over the past year. I built it to help clinicians reduce the stress of documentation, scheduling, and administrative tasks that slow down their day. The project started after speaking with therapists who shared how inefficient their current tools were. I designed the entire system myself and shaped it through ongoing feedback from real users who needed something practical and reliable.",
        "This project demonstrates my ability to build and maintain a full stack application from the ground up. Through Synari, I learned how to translate real user needs into technical decisions, create an interface that reduces cognitive load, and integrate AI responsibly within a workflow. It also reflects my experience managing a long-term project, gathering feedback, iterating on design choices, and building features through consistent testing.",
        "Synari reflects the engineer I am becoming: someone who builds intentionally, consults with users, and focuses on creating technology that eases people's lives.",
      ],
      links: [{ label: "visit synari.org ↗", href: "https://synari.org/" }],
    },
    autoapply: {
      title: "auto-apply",
      kicker: "02 — local job-search pipeline",
      img: "./assets/auto-apply.png",
      chips: ["next.js", "claude", "playwright", "sqlite", "ats scout"],
      paragraphs: [
        "auto-apply is a local job-search pipeline for new-grad and internship SWE roles. It watches public GitHub job lists and company ATS boards, surfaces new postings as they appear, writes tailored cover letters and screening answers with Claude, and can auto-fill applications through Playwright.",
        "The pipeline runs fully on your machine: ingest and scout across SimplifyJobs, Greenhouse, Lever, Ashby, HN, and more; enrich each posting with the real form questions; draft answers grounded in your profile; then apply with a headed browser. A launchd watcher and macOS notifications keep the inbox current without sending anything off-device.",
        "It is built to be fast where it matters: delta detection so backfills stay quiet, parallel enrichment so one slow career site cannot stall the run, and a training-wheels mode that fills every field but leaves the final submit click to you.",
      ],
      links: [{ label: "github ↗", href: "https://github.com/gheetdufa/auto_apply" }],
    },
    autotrader: {
      title: "auto-trader",
      kicker: "03 — automated swing trading",
      img: "./assets/auto-trader.png",
      chips: ["python", "yfinance", "ai agents", "robinhood mcp", "risk rails"],
      paragraphs: [
        "auto-trader is an automated swing-trading system built around a deterministic Python engine with AI agents for review and execution. It targets Robinhood Agentic Trading with ring-fenced stock and options sleeves so neither budget can raid the other.",
        "Daily bars feed momentum, RSI(2), and regime signals into order proposals. A reviewer agent can only veto or shrink size; an executor agent applies a news overlay, runs a hard risk validator, and only then sends fills through the Robinhood MCP. Every trade is journaled to git and pushed with phone alerts.",
        "The stock sleeve runs a momentum core with a mean-reversion satellite and a SPY 200-day regime filter. Options stay in paper mode as call debit spreads until explicitly flipped live. Hard rails cover position caps, trailing stops, drawdown kill switches, and a whitelist so the agents cannot invent risk.",
      ],
      links: [{ label: "github ↗", href: "https://github.com/gheetdufa/auto-trader" }],
    },
    signlang: {
      title: "SignLang Interface",
      kicker: "04 — accessible communication",
      img: "./assets/Translator.png",
      chips: ["machine learning", "accessibility", "sensors", "human-centered"],
      paragraphs: [
        "This project began when my friend lost an arm and needed a more accessible way to communicate using sign language. I wanted to help them regain some independence, so I started building an interface that could translate one-handed inputs into digital gestures. I experimented with sensors, machine learning models, and lightweight interaction patterns to create something that felt natural. The project's purpose was personal, and every design choice came from trying to meet a real need.",
        "It shows how I approach engineering with empathy, careful attention, and direct communication with the person who will use the final product. I learned how to adapt tools to a single user's daily challenges, adjust design features based on comfort, and refine prototypes through consistent testing and feedback. It pushed me to think about accessibility not as a feature but as a core requirement.",
        "This project captures the kind of work I want to continue doing: work that matters to someone's life and reflects both technical effort and care.",
      ],
      links: [{ label: "view on github ↗", href: "https://github.com/ukataria/Bitcamp2024/tree/main" }],
    },
    audit: {
      title: "Audit.AI",
      kicker: "05 — ai-art detection",
      img: "./assets/project-2.png",
      chips: ["chrome extension", "yolo pipeline", "team project", "hackathon"],
      paragraphs: [
        "Audit AI is a Chrome extension created to help users identify whether digital artwork is real or AI-generated. The idea came from seeing confusion and controversy surrounding the authenticity of online art. My team and I wanted to give everyday users a quick way to check the origins of what they were seeing. Audit AI analyzes images directly within the browser and provides an instant assessment, making it easier for people to navigate an online space where AI-generated content is becoming harder to distinguish.",
        "Building Audit AI required integrating a YOLO-based image recognition pipeline with a smooth frontend experience that fit naturally into the browser environment. The project challenged us to optimize performance, handle diverse image formats, and create a tool that felt fast and reliable. It demonstrates my ability to connect technical components into a cohesive product and to iterate on challenges such as latency, accuracy, and user experience.",
        "Audit AI represents the kind of builder I aim to be: someone who takes initiative and creates tools that give people clarity in a changing digital world.",
      ],
      links: [
        { label: "devpost ↗", href: "https://devpost.com/software/audit-ai" },
        { label: "github ↗", href: "https://github.com/ukataria/Bitcamp2024/tree/main" },
      ],
    },
    rant: {
      title: "Rant.AI",
      kicker: "06 — ai journaling",
      img: "./assets/project-3.jpg",
      chips: ["ai", "journaling", "wellbeing"],
      paragraphs: [
        "Rant.AI is an AI-powered journaling application that helps users express their thoughts, feelings, and experiences through intelligent writing assistance. The app provides a safe space for users to \"rant\" about their day, with AI-powered insights and reflection tools to help users understand their emotions and thoughts better.",
      ],
      links: [{ label: "view on github ↗", href: "https://github.com/gheetdufa/journal_app-1" }],
    },
    tutorwiz: {
      title: "tutorWiz",
      kicker: "07 — intelligent tutoring",
      img: "./assets/tutorWiz.png",
      chips: ["edtech", "ai assistance", "adaptive learning"],
      paragraphs: [
        "tutorWiz is an intelligent tutoring platform that connects students with tutors and provides AI-powered learning assistance. The platform offers personalized tutoring sessions, adaptive learning paths, and comprehensive study resources to help students excel in their academic pursuits.",
      ],
      links: [
        { label: "devpost ↗", href: "https://devpost.com/software/tutorwiz" },
        { label: "github ↗", href: "https://github.com/suhas-kavuri/WizardTutor" },
      ],
    },
    asktestudo: {
      title: "askTestudo",
      kicker: "08 — course registration assistant",
      img: "./assets/askTestudo.png",
      chips: ["chatbot", "hoyahacks", "umd"],
      paragraphs: [
        "askTestudo is an AI-powered assistant designed to help University of Maryland students navigate the Testudo course registration system. Built during HoyaHacks, this intelligent chatbot answers questions about courses, schedules, prerequisites, and registration processes, making it easier for students to plan their academic journey.",
      ],
      links: [
        { label: "asktestudo.co ↗", href: "https://asktestudo.co/" },
        { label: "github ↗", href: "https://github.com/gheetdufa/HoyaHacksAskTestudo" },
      ],
    },
  };

  /* ---------------- project overlay ---------------- */
  const overlay = document.getElementById("project-overlay");
  const overlayInner = document.getElementById("overlay-inner");
  const overlayContent = document.getElementById("overlay-content");
  const overlayClose = document.getElementById("overlay-close");
  let lastFocused = null;

  gsap.set(overlayInner, { yPercent: 100 });

  function renderProject(key) {
    const p = PROJECTS[key];
    if (!p) return;
    overlayContent.innerHTML = `
      <p class="p-detail__kicker">${p.kicker}</p>
      <h2 class="p-detail__title">${p.title}</h2>
      <div class="p-detail__meta">${p.chips.map((c) => `<span class="p-detail__chip">${c}</span>`).join("")}</div>
      <img class="p-detail__img" src="${p.img}" alt="${p.title}" />
      <div class="p-detail__body">${p.paragraphs.map((t) => `<p>${t}</p>`).join("")}</div>
      <div class="p-detail__links">
        ${p.links.map((l) => `<a class="btn btn--solid" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("")}
      </div>`;
  }

  function openOverlay(key) {
    if (!PROJECTS[key]) return;
    renderProject(key);
    lastFocused = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("overlay-open");
    if (lenis) lenis.stop();
    overlayInner.scrollTop = 0;
    gsap.fromTo(overlayInner,
      { yPercent: 100 },
      { yPercent: 0, duration: prefersReduced ? 0 : 0.85, ease: "power4.inOut" });
    if (!prefersReduced) {
      gsap.from(overlayContent.children, {
        opacity: 0, y: 40, duration: 0.7, stagger: 0.07, delay: 0.4, ease: "power3.out",
      });
    }
    overlayClose.focus();
  }

  function closeOverlay() {
    gsap.to(overlayInner, {
      yPercent: 100,
      duration: prefersReduced ? 0 : 0.65,
      ease: "power4.inOut",
      onComplete: () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("overlay-open");
        if (lenis) lenis.start();
        if (lastFocused) lastFocused.focus();
      },
    });
  }

  overlayInner.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
  overlayInner.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });

  workTrack.addEventListener("click", (e) => {
    const panel = e.target.closest(".panel");
    if (panel && panel.dataset.project) openOverlay(panel.dataset.project);
  });
  overlayClose.addEventListener("click", closeOverlay);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closeOverlay();
  });

  /* ---------------- contact email char wave ---------------- */
  const email = document.querySelector(".contact__email");
  const emailText = email && email.querySelector(".contact__email-text");
  if (email && emailText && finePointer && !prefersReduced) {
    emailText.innerHTML = emailText.textContent.split("").map(
      (ch) => `<span class="eml-char">${ch}</span>`
    ).join("");
    const chars = emailText.querySelectorAll(".eml-char");
    email.addEventListener("mouseenter", () => {
      gsap.fromTo(chars, { y: 0 }, {
        y: -12, duration: 0.22, stagger: 0.014, ease: "power2.out", yoyo: true, repeat: 1,
      });
    });
  }
})();
