/* ============================================================
   EASTER — double-click DG → terminal zetamac + guestbook
            triple-click DG → replay intro
   ============================================================ */

(function () {
  const logo = document.getElementById("nav-logo");
  const tty = document.getElementById("tty");
  const ttyBody = document.getElementById("tty-body");
  const ttyClose = document.getElementById("tty-close");
  const wall = document.getElementById("guestbook-wall");
  const emptyEl = document.getElementById("guestbook-empty");
  if (!logo || !tty || !ttyBody) return;

  const STORAGE_KEY = "dheer-guestbook-v1";
  const QUIZ_NEED = 5;
  const QUIZ_SECS = 10;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- multi-click on DG ---------------- */
  let clickCount = 0;
  let clickTimer = null;

  logo.addEventListener("click", (e) => {
    e.preventDefault();
    clickCount += 1;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      const n = clickCount;
      clickCount = 0;
      if (n >= 3) replayIntro();
      else if (n === 2) openTty();
      else {
        const top = document.getElementById("top");
        if (top) top.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
      }
    }, 420);
  });

  function replayIntro() {
    sessionStorage.removeItem("dheer-intro-seen");
    location.reload();
  }

  /* ---------------- guestbook storage ---------------- */
  function loadMarks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveMarks(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 48)));
  }

  function renderWall() {
    if (!wall) return;
    const marks = loadMarks();
    wall.innerHTML = "";
    if (!marks.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    marks.forEach((m) => {
      const fig = document.createElement("figure");
      fig.className = "guestbook__mark";
      const img = document.createElement("img");
      img.src = m.data;
      img.alt = m.name ? `mark by ${m.name}` : "visitor mark";
      fig.appendChild(img);
      if (m.name) {
        const cap = document.createElement("figcaption");
        cap.textContent = m.name;
        fig.appendChild(cap);
      }
      wall.appendChild(fig);
    });
  }

  renderWall();

  /* ---------------- terminal shell ---------------- */
  let open = false;
  let quizTimer = null;
  let quizDeadline = 0;
  let quizScore = 0;
  let quizAnswer = null;
  let drawing = false;

  function stopLenis(stop) {
    // main.js owns Lenis privately; lock overflow as a fallback
    document.documentElement.classList.toggle("overlay-open", stop);
  }

  function openTty() {
    if (open) return;
    open = true;
    tty.classList.add("is-open");
    tty.setAttribute("aria-hidden", "false");
    stopLenis(true);
    boot();
  }

  function closeTty() {
    if (!open) return;
    open = false;
    if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }
    tty.classList.remove("is-open");
    tty.setAttribute("aria-hidden", "true");
    stopLenis(false);
    ttyBody.innerHTML = "";
  }

  ttyClose.addEventListener("click", closeTty);
  tty.addEventListener("click", (e) => {
    if (e.target === tty) closeTty();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) closeTty();
  });

  function line(html, cls) {
    const el = document.createElement("div");
    el.className = "tty__line" + (cls ? " " + cls : "");
    el.innerHTML = html;
    ttyBody.appendChild(el);
    ttyBody.scrollTop = ttyBody.scrollHeight;
    return el;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function boot() {
    ttyBody.innerHTML = "";
    line("<span class='tty__dim'>$</span> ./unlock --target dg", "tty__cmd");
    await sleep(280);
    line("found hidden shell · access requires proof");
    await sleep(220);
    line("challenge: <strong>zetamac-lite</strong> · 5 correct · 10 seconds · easy mode");
    await sleep(260);
    startQuiz();
  }

  /* ---------------- zetamac-lite ---------------- */
  function easyProblem() {
    const roll = Math.random();
    let a, b, op, ans;
    if (roll < 0.45) {
      a = 1 + ((Math.random() * 9) | 0);
      b = 1 + ((Math.random() * 9) | 0);
      op = "+";
      ans = a + b;
    } else if (roll < 0.75) {
      a = 2 + ((Math.random() * 8) | 0);
      b = 1 + ((Math.random() * Math.min(a - 1, 8)) | 0);
      op = "−";
      ans = a - b;
    } else {
      a = 2 + ((Math.random() * 5) | 0);
      b = 2 + ((Math.random() * 5) | 0);
      op = "×";
      ans = a * b;
    }
    return { prompt: `${a} ${op} ${b}`, ans };
  }

  function startQuiz() {
    quizScore = 0;
    quizDeadline = Date.now() + QUIZ_SECS * 1000;

    const wrap = document.createElement("div");
    wrap.className = "tty__quiz";
    wrap.innerHTML = `
      <div class="tty__quiz-meta">
        <span>score <strong id="tty-score">0</strong>/${QUIZ_NEED}</span>
        <span>time <strong id="tty-time">${QUIZ_SECS}.0</strong>s</span>
      </div>
      <div class="tty__prompt" id="tty-prompt">—</div>
      <input class="tty__input" id="tty-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="answer" />
      <p class="tty__hint">enter to submit · numbers only</p>
    `;
    ttyBody.appendChild(wrap);

    const promptEl = document.getElementById("tty-prompt");
    const input = document.getElementById("tty-input");
    const scoreEl = document.getElementById("tty-score");
    const timeEl = document.getElementById("tty-time");

    function nextQ() {
      const p = easyProblem();
      quizAnswer = p.ans;
      promptEl.textContent = p.prompt + " = ?";
      input.value = "";
      input.focus();
    }

    function tick() {
      const left = Math.max(0, quizDeadline - Date.now());
      timeEl.textContent = (left / 1000).toFixed(1);
      if (left <= 0) {
        clearInterval(quizTimer);
        quizTimer = null;
        endQuiz(false);
      }
    }

    function submit() {
      const raw = input.value.trim();
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        input.classList.add("is-wrong");
        setTimeout(() => input.classList.remove("is-wrong"), 180);
        input.value = "";
        return;
      }
      if (n === quizAnswer) {
        quizScore += 1;
        scoreEl.textContent = String(quizScore);
        input.classList.add("is-ok");
        setTimeout(() => input.classList.remove("is-ok"), 120);
        if (quizScore >= QUIZ_NEED) {
          clearInterval(quizTimer);
          quizTimer = null;
          endQuiz(true);
          return;
        }
        nextQ();
      } else {
        input.classList.add("is-wrong");
        setTimeout(() => input.classList.remove("is-wrong"), 180);
        input.value = "";
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    nextQ();
    tick();
    quizTimer = setInterval(tick, 50);
  }

  function endQuiz(won) {
    const quiz = ttyBody.querySelector(".tty__quiz");
    if (quiz) quiz.remove();

    if (!won) {
      line(`access denied · scored ${quizScore}/${QUIZ_NEED}`, "tty__err");
      line("try again — double-click <em>DG</em>");
      const again = document.createElement("button");
      again.className = "tty__btn";
      again.type = "button";
      again.textContent = "retry";
      again.addEventListener("click", () => {
        ttyBody.innerHTML = "";
        startQuiz();
      });
      ttyBody.appendChild(again);
      return;
    }

    line("access granted ✓", "tty__ok");
    line("leave a mark — draw in the square, then commit");
    showPad();
  }

  /* ---------------- signature pad ---------------- */
  function showPad() {
    const pad = document.createElement("div");
    pad.className = "tty__pad";
    pad.innerHTML = `
      <canvas class="tty__canvas" id="tty-canvas" width="220" height="220" aria-label="signature pad"></canvas>
      <div class="tty__pad-row">
        <input class="tty__name" id="tty-name" type="text" maxlength="18" placeholder="name (optional)" autocomplete="off" />
        <button class="tty__btn tty__btn--ghost" id="tty-clear" type="button">clear</button>
        <button class="tty__btn" id="tty-commit" type="button">commit</button>
      </div>
    `;
    ttyBody.appendChild(pad);
    ttyBody.scrollTop = ttyBody.scrollHeight;

    const canvas = document.getElementById("tty-canvas");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const css = 220;
    canvas.width = css * dpr;
    canvas.height = css * dpr;
    canvas.style.width = css + "px";
    canvas.style.height = css + "px";
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e9eef2";
    ctx.lineWidth = 2.4;

    let inked = false;
    let last = null;

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return {
        x: ((src.clientX - r.left) / r.width) * css,
        y: ((src.clientY - r.top) / r.height) * css,
      };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      last = pos(e);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      inked = true;
    }
    function end() {
      drawing = false;
      last = null;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    document.getElementById("tty-clear").addEventListener("click", () => {
      ctx.clearRect(0, 0, css, css);
      inked = false;
    });

    document.getElementById("tty-commit").addEventListener("click", () => {
      if (!inked) {
        line("empty pad — draw something first", "tty__err");
        return;
      }
      const name = (document.getElementById("tty-name").value || "").trim().slice(0, 18);
      const data = canvas.toDataURL("image/png");
      const marks = loadMarks();
      marks.unshift({ data, name, at: Date.now() });
      saveMarks(marks);
      renderWall();
      line("mark committed · check the bottom of the page", "tty__ok");
      setTimeout(() => {
        closeTty();
        const gb = document.getElementById("guestbook");
        if (gb) gb.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      }, 700);
    });
  }
})();
