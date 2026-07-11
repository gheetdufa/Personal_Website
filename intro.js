/* ============================================================
   INTRO — "dheer" boot sequence, v2
   All five letters glitch at once, then lock in a fast
   cascade — each lock fires a mode-specific flourish:
   d → decode   h → hash   e → encode   e → echo   r → render
   Ends with a zoom-through + adriatic curtain reveal.
   Total ≈ 2.2s (was ~7s). Plays once per session.
   ============================================================ */

(function () {
  const intro = document.getElementById("intro");
  if (!intro) return;
  const lettersEl = document.getElementById("intro-letters");
  const statusEl = document.getElementById("intro-status");
  const skipBtn = document.getElementById("intro-skip");
  const veil = document.getElementById("intro-veil");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seenIntro = sessionStorage.getItem("dheer-intro-seen");
  const hasGsap = typeof gsap !== "undefined";

  window.__introDone = false;

  const STEPS = [
    { char: "d", mode: "decode", status: "decoding…", pool: "abcdefghjkmnpqstuvwxyz!@#$%&*?0123456789" },
    { char: "h", mode: "hash",   status: "hashing…",  pool: "0123456789abcdef" },
    { char: "e", mode: "encode", status: "encoding…", pool: "01" },
    { char: "e", mode: "echo",   status: "echoing…",  pool: "eE3€é" },
    { char: "r", mode: "render", status: "rendering…", pool: "Rr®/|\\_" },
  ];

  let rafId = null;
  let statusTicker = null;
  let finished = false;

  if (hasGsap && veil) gsap.set(veil, { yPercent: 101 });
  if (hasGsap) gsap.set(lettersEl, { filter: "blur(0px)" });

  function markDone() {
    window.__introDone = true;
    sessionStorage.setItem("dheer-intro-seen", "1");
    document.dispatchEvent(new CustomEvent("intro:done"));
  }

  function finish(fast) {
    if (finished) return;
    finished = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (statusTicker) clearInterval(statusTicker);

    if (fast || !hasGsap) {
      markDone();
      if (hasGsap) {
        gsap.killTweensOf("#intro, #intro *");
        gsap.to(intro, { yPercent: -100, duration: 0.5, ease: "power4.inOut", onComplete: () => intro.remove() });
      } else {
        intro.remove();
      }
      return;
    }

    // grand exit: word zooms through the camera, adriatic veil sweeps up
    // to cover, then the whole screen lifts away revealing the hero.
    const tl = gsap.timeline({ onComplete: () => intro.remove() });
    tl.to(statusEl, { autoAlpha: 0, duration: 0.2 }, 0)
      .to(skipBtn, { autoAlpha: 0, duration: 0.2 }, 0)
      .to(lettersEl, { scale: 14, autoAlpha: 0, filter: "blur(14px)", duration: 0.7, ease: "power3.in" }, 0)
      .to(veil, { yPercent: 0, duration: 0.45, ease: "power4.in" }, 0.24)
      .add(markDone, 0.7)
      .to(intro, { yPercent: -100, duration: 0.7, ease: "power4.inOut" }, 0.74);
  }

  skipBtn.addEventListener("click", () => finish(true));

  if (prefersReduced || seenIntro || !hasGsap) {
    requestAnimationFrame(() => finish(true));
    return;
  }

  /* ---------------- flourishes ---------------- */

  function shockwave(letter) {
    const ghost = document.createElement("span");
    ghost.className = "intro__ghost";
    ghost.textContent = letter.char;
    ghost.setAttribute("aria-hidden", "true");
    letter.el.appendChild(ghost);
    gsap.fromTo(ghost,
      { scale: 1, autoAlpha: 0.65 },
      { scale: 2.6, autoAlpha: 0, duration: 0.55, ease: "power2.out", onComplete: () => ghost.remove() });
  }

  function flashSub(letter, text, side) {
    const sub = document.createElement("i");
    sub.className = "intro__sub intro__sub--" + side;
    sub.textContent = text;
    sub.setAttribute("aria-hidden", "true");
    letter.el.appendChild(sub);
    const tl = gsap.timeline({ onComplete: () => sub.remove() });
    tl.fromTo(sub, { autoAlpha: 0, y: side === "below" ? -8 : 8 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: "power2.out" })
      .to(sub, { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0.42);
  }

  const FLOURISH = {
    decode(letter) {
      gsap.fromTo(letter.el, { color: "#57b3dc" }, { color: "#e9eef2", duration: 0.5, ease: "power2.out" });
    },
    hash(letter) {
      flashSub(letter, "7f3a9c2b", "below");
    },
    encode(letter) {
      flashSub(letter, "01100101", "above");
    },
    echo(letter) {
      gsap.fromTo(letter.el,
        { textShadow: "0 0 0 rgba(87,179,220,0)" },
        {
          textShadow: "-14px 0 18px rgba(87,179,220,0.4), -28px 0 34px rgba(87,179,220,0.15)",
          duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1,
        });
    },
    render(letter) {
      const rule = document.createElement("i");
      rule.className = "intro__rule";
      rule.setAttribute("aria-hidden", "true");
      letter.el.appendChild(rule);
      const tl = gsap.timeline({ onComplete: () => rule.remove() });
      tl.to(rule, { scaleX: 1, duration: 0.3, ease: "power3.out" })
        .to(rule, { autoAlpha: 0, duration: 0.3 }, 0.5);
    },
  };

  /* ---------------- sequence ---------------- */

  const letters = STEPS.map((step, i) => {
    const el = document.createElement("span");
    el.className = "intro__letter intro__letter--" + step.mode;
    lettersEl.appendChild(el);
    return { ...step, el, lockAt: 480 + i * 210, locked: false, lastSwap: 0 };
  });

  gsap.from(letters.map((l) => l.el), { autoAlpha: 0, y: 20, stagger: 0.05, duration: 0.3, ease: "power2.out" });

  // rapid status cycling while everything glitches
  let ti = 0;
  statusTicker = setInterval(() => {
    statusEl.textContent = STEPS[ti++ % STEPS.length].status;
  }, 90);

  function lock(letter) {
    letter.locked = true;
    if (statusTicker) { clearInterval(statusTicker); statusTicker = null; }
    letter.el.textContent = letter.char;
    letter.el.classList.add("is-set");
    statusEl.textContent = letter.status;
    gsap.fromTo(letter.el,
      { scale: 1.6, filter: "blur(8px)" },
      { scale: 1, filter: "blur(0px)", duration: 0.4, ease: "back.out(2.2)" });
    shockwave(letter);
    if (FLOURISH[letter.mode]) FLOURISH[letter.mode](letter);
  }

  function wordBeat() {
    statusEl.textContent = "© dheer guda";
    const els = letters.map((l) => l.el);
    const tl = gsap.timeline({ onComplete: () => finish(false) });
    tl.to(els, { color: "#57b3dc", duration: 0.16, yoyo: true, repeat: 1, stagger: 0.02, ease: "power2.inOut" }, 0)
      .fromTo(lettersEl, { scale: 1 }, { scale: 1.06, duration: 0.36, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0);
  }

  function start() {
    const t0 = performance.now();
    function loop(now) {
      if (finished) return;
      const t = now - t0;
      let allLocked = true;
      for (const L of letters) {
        if (L.locked) continue;
        if (t >= L.lockAt) {
          lock(L);
        } else {
          allLocked = false;
          if (now - L.lastSwap > 34) {
            L.el.textContent = L.pool[(Math.random() * L.pool.length) | 0];
            L.lastSwap = now;
          }
        }
      }
      if (allLocked) wordBeat();
      else rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  // give the serif a beat to arrive, but never stall the show
  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load('italic 200px "Instrument Serif"'),
      new Promise((res) => setTimeout(res, 300)),
    ]).then(start);
  } else {
    start();
  }
})();
