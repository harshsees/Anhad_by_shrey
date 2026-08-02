/* =============================================
   ANAHAD BY SHREY — Hero Story

   Scene 1 (#heroMark)  the logo mark holds centre stage and a mic is drawn
                        out from behind it, then lifts away with the mark.
   Scene 2 (#heroStage) the mic falls in from the top of the frame and lands
                        on the mic Shrey is already holding up in frame 001 of
                        the canvas sequence. A gold impact bloom covers the
                        swap, then the sequence scrubs — his arm brings the
                        mic down to his mouth — while the copy resolves in the
                        right-hand column, clear of the subject.
   Scene 3              the mic detaches again and travels into #intro.

   Built on GSAP + ScrollTrigger, wired to the existing Lenis instance
   (js/smooth-scroll.js). The mic path is driven from timeline onUpdate rather
   than tweened, because its landing point depends on live canvas geometry.
   ============================================= */

(function () {
  const FRAME_COUNT = 75;
  const SEQ_TIERS = [
    { name: 'w640', maxCssWidth: 700 },
    { name: 'w1280', maxCssWidth: Infinity },
  ];
  // Matches the .hero-mic box in CSS; everything else is expressed as a scale
  // of it so the mic can be sized against the rendered photo at any viewport.
  const MIC_BASE_H = 200;
  // Fraction of the stage timeline spent falling before the mic touches down.
  const DROP = 1.2;

  const A = Motion.micAnchors.heroSeq;
  const clamp01 = Motion.clamp01;
  const lerp = Motion.lerp;
  const ease = Motion.ease;

  let els = null;
  let seq = null;
  // Which scene currently owns the mic. Both scenes agree exactly on the seam
  // pose, so the hand-over is invisible even mid-scrub.
  let stageOwnsMic = false;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    els = collectEls();
    if (!els.stage || !els.canvas) return;

    seq = Motion.createFrameSequence(els.canvas, {
      count: FRAME_COUNT,
      naturalW: A.naturalW,
      naturalH: A.naturalH,
      focal: A.focal,
      tiers: SEQ_TIERS,
      path: (tier, n) => `assets/hero-seq/${tier}/frame-${String(n).padStart(3, '0')}.jpg`,
      onFirstFrame: () => els.stage.classList.add('is-painted'),
      onReady: () => {
        els.stage.classList.add('is-ready');
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      },
    });

    const noMotion =
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      Motion.prefersReducedMotion();

    if (noMotion) {
      // CSS (@media prefers-reduced-motion / .no-motion) already renders the
      // settled hero; just park the sequence on its final frame.
      document.documentElement.classList.add('hero-no-motion');
      seq.ready.then(() => seq.setProgress(1));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    bridgeLenis();

    // Pinning re-lays-out the stage, so re-measure the cover rect on every
    // refresh — the mic's landing point is derived from it.
    ScrollTrigger.addEventListener('refresh', () => seq.resize());

    gsap.set(els.mic, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });

    playMarkIntro();
    fitEchoCrops();
    window.addEventListener('resize', Motion.debounce(fitEchoCrops, 200));

    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const a = buildMarkScene({ pin: true, end: '+=110%' });
        const b = buildStageScene({ pin: true, end: '+=340%' });
        return () => {
          a();
          b();
        };
      },
      '(max-width: 899px)': () => {
        const a = buildMarkScene({ pin: false, end: 'bottom top' });
        const b = buildStageScene({ pin: false, end: '+=180%' });
        return () => {
          a();
          b();
        };
      },
    });

    buildHandoff();
  }

  function collectEls() {
    const id = (x) => document.getElementById(x);
    return {
      mark: id('heroMark'),
      markStack: id('heroMarkStack'),
      markLogo: id('heroMarkLogo'),
      markEyebrow: id('heroMarkEyebrow'),
      markLine: id('heroMarkLine'),
      markAura: id('heroMarkAura'),
      markParticles: id('heroMarkParticles'),
      markCue: id('heroMarkCue'),

      mic: id('heroMic'),
      micGlow: id('heroMicGlow'),

      stage: id('heroStage'),
      canvas: id('heroCanvas'),
      canvasWrap: id('heroCanvasWrap'),
      scrim: id('heroScrim'),
      flash: id('heroFlash'),
      copy: id('heroCopy'),
      pretitle: id('heroPretitle'),
      title: id('heroTitle'),
      tagline: id('heroTagline'),
      buttons: id('heroButtons'),
      socialProof: id('heroSocialProof'),

      micEcho: id('micEcho'),
      micEchoFrom: id('micEchoFrom'),
      micEchoTo: id('micEchoTo'),
      introSection: id('intro'),
      introImageFrame: id('introImageFrame'),
    };
  }

  function bridgeLenis() {
    if (!window.lenis) return;
    // GSAP's ScrollTrigger pin transform only applies correctly when
    // gsap.ticker is the SOLE driver of Lenis's raf loop (the official
    // Lenis+GSAP recipe). smooth-scroll.js constructs Lenis with
    // autoRaf: true for pages without GSAP; here we hand driving over
    // to gsap.ticker exclusively so there is exactly one driver, not two
    // (two conflicting time sources previously caused a runaway scroll).
    window.lenis.options.autoRaf = false;
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => window.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ══════════════════════════════════════════
     Geometry — every pose the mic passes through
     ══════════════════════════════════════════ */

  /** Where the mic sits at the seam between the two scenes: just off the top
   *  edge, centred. Both scenes read this, so neither can drift from it. */
  function seamPose() {
    return { x: window.innerWidth * 0.5, y: window.innerHeight * -0.08, scale: 0.62, rot: -16 };
  }

  /** The logo mark's medallion — the point the mic is drawn out from. */
  function markPose() {
    const r = els.markLogo.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.19, h: r.height };
  }

  /** The mic Shrey is holding up in frame 001, in viewport px. */
  function landPose() {
    const r = seq.getRect();
    if (!r) return seamPose();
    const wrap = els.canvasWrap.getBoundingClientRect();
    return {
      x: wrap.left + r.x + A.land.cx * r.w,
      y: wrap.top + r.y + A.land.cy * r.h,
      scale: (A.land.length * r.h) / MIC_BASE_H,
      rot: A.land.rotation,
    };
  }

  /** Same point as landPose, as percentages of the canvas wrap — the origin
   *  the photo irises open from, so the reveal blooms out of his hand. */
  function irisPct() {
    const r = seq.getRect();
    if (!r) return { x: 50, y: 32 };
    return {
      x: ((r.x + A.land.cx * r.w) / els.canvasWrap.clientWidth) * 100,
      y: ((r.y + A.land.cy * r.h) / els.canvasWrap.clientHeight) * 100,
    };
  }

  /* ══════════════════════════════════════════
     Scene 1 — the mark, and the mic it releases
     ══════════════════════════════════════════ */

  function playMarkIntro() {
    // Autoplay entrance on load. This animates the mark's *children* while the
    // scroll timeline animates their container, so the two never contend for
    // the same properties on the same element.
    gsap.set(els.markLogo, { opacity: 0, scale: 0.94, filter: 'blur(14px)' });
    gsap.set([els.markEyebrow, els.markLine], { opacity: 0, y: 16 });
    gsap.set(els.markCue, { opacity: 0 });

    gsap
      .timeline({ delay: 0.15 })
      .to(els.markLogo, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' })
      .to(els.markEyebrow, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.5)
      .to(els.markLine, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.7)
      .to(els.markCue, { opacity: 1, duration: 0.6 }, 1.1);
  }

  function placeMicForMark(p) {
    const m = markPose();
    const seam = seamPose();
    // Drawn out from behind the medallion first, then lifted away with the mark.
    const emerge = ease.outCubic(clamp01(p / 0.45));
    const leave = ease.inOutCubic(clamp01((p - 0.4) / 0.6));

    gsap.set(els.mic, {
      x: lerp(m.x, seam.x, leave),
      y: lerp(m.y + m.h * 0.46 * emerge, seam.y, leave),
      scale: lerp(lerp(0.14, 0.58, emerge), seam.scale, leave),
      rotation: lerp(lerp(4, -7, emerge), seam.rot, leave),
      opacity: clamp01(p / 0.14),
      filter: 'blur(' + ((1 - emerge) * 10).toFixed(2) + 'px)',
    });
  }

  function buildMarkScene(options) {
    let particles = null;
    if (els.markParticles && !Motion.isCompact()) {
      particles = Motion.createParticleField(els.markParticles, { count: 42 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.mark,
        start: 'top top',
        end: options.end,
        scrub: 1,
        pin: options.pin,
        anticipatePin: options.pin ? 1 : 0,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        if (!stageOwnsMic) placeMicForMark(tl.progress());
      },
    });

    tl.to(els.markCue, { opacity: 0, duration: 0.25 }, 0)
      .to(els.markAura, { opacity: 0.12, scale: 0.7, duration: 1.1, ease: 'power2.in' }, 0.1)
      .to(
        els.markStack,
        { yPercent: -14, scale: 1.04, opacity: 0, filter: 'blur(9px)', duration: 0.9, ease: 'power2.in' },
        0.35
      );

    if (particles) {
      tl.to(
        {},
        { duration: 1.25, onUpdate: () => particles.setIntensity(1 - tl.progress()) },
        0
      );
    }

    // Park the mic at its scene-1 pose straight away so it isn't visible at
    // full size for a frame before the first scroll event lands.
    placeMicForMark(0);

    return () => {
      if (particles) particles.destroy();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* ══════════════════════════════════════════
     Scene 2 — the drop, the catch, the sequence
     ══════════════════════════════════════════ */

  function placeMicForStage(p) {
    const total = stageDuration();
    const seam = seamPose();
    const land = landPose();
    const t = ease.inOutCubic(clamp01(p / (DROP / total)));

    // Opacity is derived from progress rather than tweened, so a reload part
    // way into the stage still shows the mic falling instead of inheriting
    // whatever value the scene-1 timeline last wrote.
    const fadeFrom = (DROP + 0.04) / total;
    const fadeTo = (DROP + 0.32) / total;

    gsap.set(els.mic, {
      x: lerp(seam.x, land.x, t),
      y: lerp(seam.y, land.y, t),
      scale: lerp(seam.scale, land.scale, t),
      rotation: lerp(seam.rot, land.rot, t),
      opacity: 1 - clamp01((p - fadeFrom) / (fadeTo - fadeFrom)),
      filter: 'blur(0px)',
    });

    // The bloom is anchored to the hand, not the falling mic, so it stays put
    // while the timeline scales and fades it.
    els.flash.style.left = land.x + 'px';
    els.flash.style.top = land.y + 'px';
  }

  // Total length of the stage timeline in its own units; kept in one place so
  // the mic's drop can be expressed as a fraction of overall progress.
  let stageTotal = DROP + 2.35;
  function stageDuration() {
    return stageTotal;
  }

  function buildStageScene(options) {
    const copyKids = [els.pretitle, els.title, els.tagline, els.buttons, els.socialProof];

    gsap.set(els.canvasWrap, { autoAlpha: 0 });
    gsap.set(els.scrim, { opacity: 0 });
    gsap.set(els.flash, { opacity: 0, scale: 0.35 });
    gsap.set(els.copy, { autoAlpha: 0 });
    gsap.set(copyKids, { opacity: 0, y: 26, filter: 'blur(9px)' });
    gsap.set(els.micGlow, { opacity: 0 });

    const seqState = { p: 0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.stage,
        start: 'top top',
        end: options.end,
        scrub: 1,
        pin: options.pin,
        anticipatePin: options.pin ? 1 : 0,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        stageOwnsMic = tl.progress() > 0.0005;
        placeMicForStage(tl.progress());
      },
    });

    tl
      // Falling: the mic charges up on the way down.
      .to(els.micGlow, { opacity: 1, duration: DROP * 0.85, ease: 'power2.in' }, 0)
      // Impact: a gold bloom at his hand, big enough to cover the moment the
      // drawn mic is exchanged for the photographed one.
      .to(els.flash, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, DROP - 0.12)
      .to(els.flash, { opacity: 0, scale: 2.2, duration: 0.75, ease: 'power2.in' }, DROP + 0.1)
      .fromTo(
        els.canvasWrap,
        { autoAlpha: 0, clipPath: () => `circle(0% at ${irisPct().x}% ${irisPct().y}%)` },
        {
          autoAlpha: 1,
          clipPath: () => `circle(165% at ${irisPct().x}% ${irisPct().y}%)`,
          duration: 0.8,
          ease: 'power2.out',
        },
        DROP - 0.1
      )
      // (the mic's own fade is driven from progress in placeMicForStage)
      // Hand-off complete — scrub the sequence: his arm brings the mic down.
      .to(
        seqState,
        { p: 1, duration: 1.55, ease: 'none', onUpdate: () => seq.setProgress(seqState.p) },
        DROP + 0.24
      )
      .to(els.scrim, { opacity: 1, duration: 0.7 }, DROP + 0.45)
      .to(els.copy, { autoAlpha: 1, duration: 0.25 }, DROP + 0.95)
      .to(copyKids, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, stagger: 0.11 }, DROP + 1.0);

    stageTotal = tl.duration();

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* ══════════════════════════════════════════
     Scene 3 — mic hand-off from the hero to #intro
     ══════════════════════════════════════════ */

  // Anchor for the settled mic in the sequence's final frame, in the shape
  // fitCropImage expects.
  const restAnchor = {
    naturalW: A.naturalW,
    naturalH: A.naturalH,
    cx: A.rest.cx,
    cy: A.rest.cy,
    boxW: A.rest.boxW,
    boxH: A.rest.boxH,
  };

  /* Sizes/positions the mic crop <img>s so they show exactly the mic region
     of their source photo, scaled to fill their (fixed-size) box. Only re-run
     on init/resize — the travel itself only touches `transform` on the parent
     box, so the crop stays framed correctly throughout at zero extra cost. */
  function fitCropImage(imgEl, boxW, boxH, anchor) {
    const scale = Math.max(
      boxW / (anchor.boxW * anchor.naturalW),
      boxH / (anchor.boxH * anchor.naturalH)
    );
    const w = anchor.naturalW * scale;
    const h = anchor.naturalH * scale;
    imgEl.style.width = w + 'px';
    imgEl.style.height = h + 'px';
    imgEl.style.left = boxW / 2 - anchor.cx * w + 'px';
    imgEl.style.top = boxH / 2 - anchor.cy * h + 'px';
  }

  function fitEchoCrops() {
    if (!els.micEcho) return;
    const w = els.micEcho.offsetWidth;
    const h = els.micEcho.offsetHeight;
    fitCropImage(els.micEchoFrom, w, h, restAnchor);
    fitCropImage(els.micEchoTo, w, h, Motion.micAnchors.intro);
  }

  function settledMicPoint() {
    const r = seq.getRect();
    const wrap = els.canvasWrap.getBoundingClientRect();
    if (!r) return { x: wrap.left + wrap.width * 0.33, y: wrap.top + wrap.height * 0.4 };
    return {
      x: wrap.left + r.x + A.rest.cx * r.w,
      y: wrap.top + r.y + A.rest.cy * r.h,
    };
  }

  function buildHandoff() {
    if (!els.introSection || !els.introImageFrame || !els.micEcho) return;
    const anchor = Motion.micAnchors.intro;
    const easeFn = gsap.parseEase('power1.inOut');

    gsap.set(els.micEcho, { opacity: 0 });
    gsap.set(els.micEchoFrom, { opacity: 1 });
    gsap.set(els.micEchoTo, { opacity: 0 });

    ScrollTrigger.create({
      trigger: els.stage,
      start: 'bottom bottom',
      endTrigger: els.introSection,
      end: 'center center',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const eased = easeFn(p);

        const start = settledMicPoint();
        const localEnd = Motion.getCoverPoint(
          els.introImageFrame,
          anchor.naturalW,
          anchor.naturalH,
          anchor.cx,
          anchor.cy
        );
        const introRect = els.introImageFrame.getBoundingClientRect();

        let opacity = 1;
        if (p < 0.12) opacity = p / 0.12;
        else if (p > 0.85) opacity = (1 - p) / 0.15;

        gsap.set(els.micEcho, {
          left: lerp(start.x, introRect.left + localEnd.x, eased),
          top: lerp(start.y, introRect.top + localEnd.y, eased),
          xPercent: -50,
          yPercent: -50,
          opacity: clamp01(opacity),
          scale: lerp(0.7, 1, eased),
        });
        gsap.set(els.micEchoFrom, { opacity: 1 - eased });
        gsap.set(els.micEchoTo, { opacity: eased });
      },
    });
  }
})();
