function boot() {
  if (typeof gsap === "undefined") {
    requestAnimationFrame(boot);
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isCoarseMobile = window.matchMedia(
    "(max-width: 768px) and (pointer: coarse)",
  ).matches;

  // ─── SLOTS — fanned deck geometry + depth-of-field blur (0 = front) ───────────
  const SLOTS = [
    { x: 0, y: 0, scale: 1, rot: 0, o: 1, blur: 0 },
    { x: 0, y: -32, scale: 0.955, rot: 3.4, o: 1, blur: 1.0 },
    { x: 0, y: -54, scale: 0.91, rot: 6.8, o: 1, blur: 2.0 },
  ];

  // ─── DOM ──────────────────────────────────────────────────────────────────────
  const els = [
    document.getElementById("cA"),
    document.getElementById("cB"),
    document.getElementById("cC"),
  ];
  const stackEl = document.getElementById("stack");
  const endEl = document.getElementById("end");
  const navBack = document.getElementById("nav-back");
  const btnBack = document.getElementById("btn-back");
  const btnNext = document.getElementById("btn-next");
  const btnRestart = document.getElementById("btn-restart");

  // ─── STATE ────────────────────────────────────────────────────────────────────
  let stack = [...els]; // stack[0]=front, [1]=mid, [2]=back
  let deck = [],
    idx = 0,
    prevIdx = null,
    busy = false,
    dead = false;

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  const shuffle = (a) => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };

  function buildHTML(d) {
    const sp = d.sp
      ? `
    <div class="sp-divider"></div>
    <p class="sp-label">Sponsored by</p>
    <div class="sp-row">
      <div class="sp-logo">${CUP}</div>
      <div>
        <div class="sp-handle">${d.sp.h}</div>
        <div class="sp-tagline">${d.sp.t}</div>
      </div>
    </div>`
      : "";
    return `
    <div class="sheen"></div>
    <div class="dots"></div>
    <div class="quote">&rdquo;</div>
    <div class="stamp stamp-r">Next</div>
    <div class="stamp stamp-l">Back</div>
    <div class="card-cat">
      ${ICONS[d.icon] || ICONS.person}
      <span class="cat-label">${d.cat}</span>
    </div>
    <p class="card-q">${d.q}</p>
    <div class="card-footer">
      <div class="card-brand">
        <span class="cb-en">ENGLISH</span>
        <span class="cb-ch">CHÉVERE</span>
      </div>
      ${sp}
    </div>`;
  }

  function render(el, cardIdx) {
    const d = deck[cardIdx];
    el.style.display = d ? "" : "none";
    if (d) el.innerHTML = buildHTML(d);
  }

  // place element at a slot instantly
  function placeAt(el, s, extra = {}) {
    gsap.set(
      el,
      Object.assign(
        {
          x: s.x,
          y: s.y,
          scale: s.scale,
          rotation: s.rot,
          opacity: s.o,
          filter: `blur(${s.blur}px)`,
        },
        extra,
      ),
    );
  }

  function applyZ() {
    gsap.set(stack[0], { zIndex: 30 });
    gsap.set(stack[1], { zIndex: 20 });
    gsap.set(stack[2], { zIndex: 10 });
    els.forEach((e) => e.classList.remove("card-front"));
    stack[0].classList.add("card-front");
  }

  function refreshBack() {
    const canBack = prevIdx !== null && !dead;
    btnBack.disabled = !canBack;
    navBack.classList.toggle("is-disabled", !canBack);
  }

  function layoutInstant() {
    stack = [...els];
    render(stack[0], idx);
    render(stack[1], idx + 1);
    render(stack[2], idx + 2);
    placeAt(stack[0], SLOTS[0]);
    placeAt(stack[1], SLOTS[1], {
      opacity: deck[idx + 1] ? SLOTS[1].o : 0,
    });
    placeAt(stack[2], SLOTS[2], {
      opacity: deck[idx + 2] ? SLOTS[2].o : 0,
    });
    applyZ();
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  function init() {
    gsap.killTweensOf(els);
    deck = shuffle(CARDS);
    idx = 0;
    prevIdx = null;
    busy = false;
    dead = false;

    endEl.classList.remove("show");
    refreshBack();

    layoutInstant();

    if (prefersReducedMotion) {
      gsap.set(els, { clearProps: "transform,opacity,scale" });
      return;
    }

    const introDur = isCoarseMobile ? 0.42 : 0.65;
    gsap.from(stack[0], {
      y: isCoarseMobile ? 28 : 48,
      opacity: 0,
      scale: 0.96,
      duration: introDur,
      ease: "power3.out",
    });
    if (!isCoarseMobile) {
      gsap.from(stack[1], {
        y: 6,
        opacity: 0,
        duration: introDur,
        ease: "power3.out",
        delay: 0.12,
      });
      gsap.from(stack[2], {
        y: 2,
        opacity: 0,
        duration: introDur,
        ease: "power3.out",
        delay: 0.18,
      });
    }
  }

  // ─── GO NEXT ──────────────────────────────────────────────────────────────────
  function goNext(dir) {
    if (busy || dead) return;

    const nextIdx = idx + 1;
    if (nextIdx >= deck.length) {
      busy = true;
      const fx = dir === "left" ? -740 : 740;
      gsap.to(stack[0], {
        x: fx,
        rotation: dir === "left" ? -22 : 22,
        opacity: 0,
        duration: 0.42,
        ease: "power2.in",
        onComplete() {
          dead = true;
          busy = false;
          els.forEach((e) => gsap.set(e, { opacity: 0 }));
          endEl.classList.add("show");
          refreshBack();
        },
      });
      gsap.to([stack[1], stack[2]], { opacity: 0, duration: 0.3 });
      return;
    }

    busy = true;
    prevIdx = idx;

    const front = stack[0],
      mid = stack[1],
      back = stack[2];
    const fx = dir === "left" ? -740 : 740;
    const frot = dir === "left" ? -22 : 22;
    idx = nextIdx;

    const tl = gsap.timeline({
      onComplete() {
        render(front, idx + 2);
        placeAt(front, SLOTS[2], { opacity: 0 });
        stack = [mid, back, front];
        applyZ();
        gsap.to(front, {
          opacity: deck[idx + 2] ? SLOTS[2].o : 0,
          duration: 0.25,
        });
        busy = false;
        refreshBack();
      },
    });

    tl.to(
      front,
      {
        x: fx,
        rotation: frot,
        opacity: 0,
        duration: 0.44,
        ease: "power2.in",
      },
      0,
    )
      .to(
        mid,
        {
          x: SLOTS[0].x,
          y: SLOTS[0].y,
          scale: SLOTS[0].scale,
          rotation: SLOTS[0].rot,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.48,
          ease: "power3.out",
        },
        0,
      )
      .to(
        back,
        {
          x: SLOTS[1].x,
          y: SLOTS[1].y,
          scale: SLOTS[1].scale,
          rotation: SLOTS[1].rot,
          opacity: deck[idx + 1] ? SLOTS[1].o : 0,
          filter: `blur(${SLOTS[1].blur}px)`,
          duration: 0.48,
          ease: "power3.out",
        },
        0,
      );
  }

  // ─── GO BACK (one step only) ──────────────────────────────────────────────────
  function goBack() {
    if (busy || prevIdx === null || dead) return;
    busy = true;

    const oldFront = stack[0],
      oldMid = stack[1],
      incoming = stack[2];

    idx = prevIdx;
    prevIdx = null;

    render(incoming, idx);
    placeAt(incoming, SLOTS[0], { x: -140, rotation: -9, opacity: 0 });
    gsap.set(incoming, { zIndex: 40 });

    const tl = gsap.timeline({
      onComplete() {
        stack = [incoming, oldFront, oldMid];
        applyZ();
        busy = false;
        refreshBack();
      },
    });

    tl.to(
      incoming,
      {
        x: SLOTS[0].x,
        y: SLOTS[0].y,
        scale: SLOTS[0].scale,
        rotation: SLOTS[0].rot,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
      },
      0,
    )
      .to(
        oldFront,
        {
          x: SLOTS[1].x,
          y: SLOTS[1].y,
          scale: SLOTS[1].scale,
          rotation: SLOTS[1].rot,
          opacity: deck[idx + 1] ? SLOTS[1].o : 0,
          filter: `blur(${SLOTS[1].blur}px)`,
          duration: 0.48,
          ease: "power3.out",
        },
        0,
      )
      .to(
        oldMid,
        {
          x: SLOTS[2].x,
          y: SLOTS[2].y,
          scale: SLOTS[2].scale,
          rotation: SLOTS[2].rot,
          opacity: deck[idx + 2] ? SLOTS[2].o : 0,
          filter: `blur(${SLOTS[2].blur}px)`,
          duration: 0.48,
          ease: "power3.out",
        },
        0,
      );
  }

  // ─── DRAG ─────────────────────────────────────────────────────────────────────
  const THRESH = 105;
  let dX = 0,
    dStartX = 0,
    dragging = false;

  function dragStart(x) {
    if (busy || dead) return;
    dragging = true;
    dStartX = x;
    dX = 0;
    gsap.killTweensOf(stack[0]);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dragMove(x) {
    if (!dragging || busy) return;
    dX = x - dStartX;

    const rot = Math.max(-12, Math.min(12, (dX / window.innerWidth) * 22));
    gsap.set(stack[0], { x: dX, rotation: rot });

    const p = Math.min(Math.abs(dX) / THRESH, 1);
    gsap.set(stack[1], {
      y: lerp(SLOTS[1].y, SLOTS[0].y, p),
      scale: lerp(SLOTS[1].scale, SLOTS[0].scale, p),
      rotation: lerp(SLOTS[1].rot, SLOTS[0].rot, p),
      opacity: deck[idx + 1] ? lerp(SLOTS[1].o, 1, p) : 0,
      filter: `blur(${lerp(SLOTS[1].blur, 0, p)}px)`,
    });
    gsap.set(stack[2], {
      y: lerp(SLOTS[2].y, SLOTS[1].y, p),
      scale: lerp(SLOTS[2].scale, SLOTS[1].scale, p),
      rotation: lerp(SLOTS[2].rot, SLOTS[1].rot, p),
      opacity: deck[idx + 2] ? lerp(SLOTS[2].o, SLOTS[1].o, p) : 0,
      filter: `blur(${lerp(SLOTS[2].blur, SLOTS[1].blur, p)}px)`,
    });

    const st = stack[0].querySelectorAll(".stamp");
    if (Math.abs(dX) > 36 && st.length) {
      const op = Math.min((Math.abs(dX) - 36) / 52, 1);
      gsap.set(dX > 0 ? st[0] : st[1], { opacity: op });
      gsap.set(dX > 0 ? st[1] : st[0], { opacity: 0 });
    } else if (st.length) {
      gsap.set(st, { opacity: 0 });
    }
  }

  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    const st = stack[0].querySelectorAll(".stamp");
    if (st.length) gsap.set(st, { opacity: 0 });

    if (Math.abs(dX) >= THRESH) {
      goNext(dX < 0 ? "left" : "right");
    } else {
      gsap.to(stack[0], {
        x: 0,
        rotation: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.7)",
      });
      gsap.to(stack[1], {
        y: SLOTS[1].y,
        scale: SLOTS[1].scale,
        rotation: SLOTS[1].rot,
        opacity: deck[idx + 1] ? SLOTS[1].o : 0,
        filter: `blur(${SLOTS[1].blur}px)`,
        duration: 0.42,
        ease: "power3.out",
      });
      gsap.to(stack[2], {
        y: SLOTS[2].y,
        scale: SLOTS[2].scale,
        rotation: SLOTS[2].rot,
        opacity: deck[idx + 2] ? SLOTS[2].o : 0,
        filter: `blur(${SLOTS[2].blur}px)`,
        duration: 0.42,
        ease: "power3.out",
      });
    }
    dX = 0;
  }

  stackEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragStart(e.clientX);
  });
  window.addEventListener("mousemove", (e) => dragMove(e.clientX));
  window.addEventListener("mouseup", dragEnd);
  stackEl.addEventListener(
    "touchstart",
    (e) => dragStart(e.touches[0].clientX),
    { passive: true },
  );
  stackEl.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), {
    passive: true,
  });
  stackEl.addEventListener("touchend", dragEnd);
  stackEl.addEventListener("touchcancel", dragEnd);

  btnBack.addEventListener("click", goBack);
  btnNext.addEventListener("click", () => goNext("right"));
  btnRestart.addEventListener("click", init);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goNext("left");
    else if (e.key === "ArrowRight") goNext("right");
    else if (e.key === "ArrowUp" || e.key === "Backspace") goBack();
  });

  function startAmbientMotion() {
    if (prefersReducedMotion || isCoarseMobile) return;
    gsap.to(".orb-1", {
      scale: 1.14,
      opacity: 0.8,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(".orb-2", {
      scale: 1.18,
      opacity: 0.65,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1.2,
    });
  }

  init();

  if (window.requestIdleCallback) {
    window.requestIdleCallback(startAmbientMotion, { timeout: 3000 });
  } else {
    window.setTimeout(startAmbientMotion, 1800);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
