/* =============================================
   ANAHAD BY SHREY — Hero Story

   Scene 1 (#heroMark)  the logo mark holds centre stage; a mic is drawn out
                        from behind it and sweeps away on a wavy path while
                        the mark scrolls off. Deliberately NOT pinned: a pin
                        leaves the section's own height to scroll past after
                        its timeline has finished, which read as a blank
                        panel between the mark and the photo.
   Scene 2 (#heroStage) the mic completes its arc and lands on the mic Shrey
                        is catching in his raised right hand in frame 001 of
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
  const FRAME_COUNT = 100;
  const SEQ_TIERS = [
    { name: 'w640', maxCssWidth: 700 },
    { name: 'w1280', maxCssWidth: Infinity },
  ];
  // Matches the .hero-mic box in CSS; everything else is expressed as a scale
  // of it so the mic can be sized against the rendered photo at any viewport.
  const MIC_BASE_H = 200;
  // Fraction of the stage timeline before the mic touches down. Scene 1 now
  // flies it all the way onto his hand, so this is only the slack that lets
  // mobile — where the stage is not pinned and is therefore still sliding up —
  // settle onto the live landing point. The photo is hidden until the catch, so
  // every unit here is scrolling spent on an empty backdrop.
  const DROP = 0.08;
  // Progress through the mark scene at which the impact bloom starts rising.
  // Set so it covers the stretch after the mark has cleared the screen.
  const FLASH_IN = 0.8;
  // Fraction of the mark scene spent drawing the mic out from behind the mark
  // before the travel proper starts.
  const EMERGE = 0.26;
  // Depth of the mic's S-swing, as a fraction of the straight-line distance to
  // the seam. Enough to read as storytelling, not so much that it looks tossed.
  const WAVE = 0.13;

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

    // The mark scene is never pinned, at either width: `bottom top` makes its
    // timeline finish at the exact scroll position where #heroStage reaches
    // the top of the viewport and takes over, so there is no dead scroll —
    // and no blank panel — between the two.
    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const a = buildMarkScene({ pin: false, end: 'bottom top' });
        const b = buildStageScene({ pin: true, end: '+=300%' });
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

  /** The rect the canvas paints the frame into, in wrap-local px. Same maths
   *  frame-sequence.js uses, recomputed here so the poses below are available
   *  before the sequence has ever measured itself. */
  function frameRect(wrap) {
    return Motion.coverRect(wrap.width, wrap.height, A.naturalW, A.naturalH, A.focal.x, A.focal.y);
  }

  /** The mic Shrey is catching in frame 001, in viewport px.
   *
   *  With `projected`, the wrap's offset is taken relative to #heroStage
   *  instead of the viewport — i.e. where the hand *will* be once the stage
   *  reaches the top of the viewport. That is exactly the moment scene 2 takes
   *  over, so scene 1 can fly the mic all the way onto his hand while the
   *  stage is still below the fold. */
  function landPose(projected) {
    const wrap = els.canvasWrap.getBoundingClientRect();
    const origin = projected ? els.stage.getBoundingClientRect() : { left: 0, top: 0 };
    const r = frameRect(wrap);
    return {
      x: wrap.left - origin.left + r.x + A.land.cx * r.w,
      y: wrap.top - origin.top + r.y + A.land.cy * r.h,
      scale: (A.land.length * r.h) / MIC_BASE_H,
      rot: A.land.rotation,
    };
  }

  /** The pose the two scenes hand the mic over in. It is the landing pose
   *  itself: scene 1 now completes the whole journey, so the mic is already on
   *  his hand — inside the impact bloom — when the photo takes the screen.
   *  Nothing is left over for scene 2 to cross, which is what used to leave a
   *  blank panel between the mark and the photo. */
  function seamPose() {
    return landPose(true);
  }

  /** The logo mark's medallion — the point the mic is drawn out from — plus
   *  the point just clear of the mark where the travel proper begins. */
  function markPose() {
    const r = els.markLogo.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.22;
    return {
      cx,
      cy,
      // Down and to the left of the emblem: swinging out low gives the wavy
      // climb to his raised hand something to climb from.
      outX: cx - r.height * 0.3,
      outY: cy + r.height * 0.52,
    };
  }

  /** Same point as landPose, as percentages of the canvas wrap — the origin
   *  the photo irises open from, so the reveal blooms out of his hand. */
  function irisPct() {
    const wrap = els.canvasWrap.getBoundingClientRect();
    const r = frameRect(wrap);
    return {
      x: ((r.x + A.land.cx * r.w) / wrap.width) * 100,
      y: ((r.y + A.land.cy * r.h) / wrap.height) * 100,
    };
  }

  /** Parks the impact bloom on his hand. Driven from progress in both scenes
   *  rather than tweened, because it has to start in scene 1 and finish in
   *  scene 2 without the two timelines fighting over the same element. */
  function placeFlash(pose, opacity, scale) {
    els.flash.style.left = pose.x + 'px';
    els.flash.style.top = pose.y + 'px';
    gsap.set(els.flash, { opacity: clamp01(opacity), scale });
  }

  /* ══════════════════════════════════════════
     Scene 1 — the mark, and the mic it releases
     ══════════════════════════════════════════ */

  function playMarkIntro() {
    // Autoplay entrance on load. This animates the mark's *children* while the
    // scroll timeline animates their container, so the two never contend for
    // the same properties on the same element.
    gsap.set(els.markLogo, { opacity: 0, scale: 0.94, filter: 'blur(14px)' });
    gsap.set(els.markCue, { opacity: 0 });

    gsap
      .timeline({ delay: 0.15 })
      .to(els.markLogo, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' })
      .to(els.markCue, { opacity: 1, duration: 0.6 }, 0.9);
  }

  /* The mic's scene-1 pose — now the entire journey, medallion to hand. Two
     beats in one function so they are always continuous: it is drawn out from
     behind the mark (growing out of a blur at the medallion), then sweeps onto
     his hand along a single S-curve — the straight line to the seam plus one
     sine swing along its normal, damped so the pose at p = 1 is exactly
     seamPose(). The start point is re-read from the live logo rect every tick,
     so the mic stays attached to the mark while the mark scrolls away and only
     detaches as the travel takes over.

     The impact bloom is ramped up over the last stretch too. That stretch is
     the scroll where the mark has cleared the top of the screen and its
     backdrop is all that is left — filling it with the bloom is what joins the
     mark straight onto the photo with nothing blank in between. */
  function placeMicForMark(p) {
    const m = markPose();
    const seam = seamPose();

    const out = ease.outCubic(clamp01(p / EMERGE));
    const travel = clamp01((p - EMERGE) / (1 - EMERGE));
    const t = ease.inOutCubic(travel);

    // End of the emerge — the pose the travel starts from.
    const ox = lerp(m.cx, m.outX, out);
    const oy = lerp(m.cy, m.outY, out);

    const dx = seam.x - ox;
    const dy = seam.y - oy;
    const len = Math.hypot(dx, dy) || 1;
    const swing = Math.sin(travel * Math.PI * 2) * WAVE * len * (1 - travel * 0.35);

    gsap.set(els.mic, {
      x: lerp(ox, seam.x, t) + (-dy / len) * swing,
      y: lerp(oy, seam.y, t) + (dx / len) * swing,
      scale: lerp(lerp(0.1, seam.scale * 0.74, out), seam.scale, t),
      rotation:
        lerp(lerp(16, -2, out), seam.rot, t) +
        Math.sin(travel * Math.PI * 2) * 9 * (1 - travel),
      opacity: clamp01(p / (EMERGE * 0.5)),
      filter: 'blur(' + ((1 - out) * 12).toFixed(2) + 'px)',
    });

    // The mic charges up over the second half of the travel.
    gsap.set(els.micGlow, { opacity: ease.inQuad(clamp01((travel - 0.45) / 0.55)) });

    const impact = clamp01((p - FLASH_IN) / (1 - FLASH_IN));
    placeFlash(seam, impact, lerp(0.35, 1, impact));
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

    // The mark holds the frame for most of the scene and only dissolves on the
    // way out — the aura blooms once as the mic clears it, then falls away.
    tl.to(els.markCue, { opacity: 0, duration: 0.25 }, 0)
      .to(els.markAura, { opacity: 1, scale: 1.08, duration: 0.32, ease: 'power2.out' }, 0.06)
      .to(els.markAura, { opacity: 0.1, scale: 0.72, duration: 0.87, ease: 'power2.in' }, 0.38)
      .to(
        els.markStack,
        // Finishes at p ≈ 0.92, a shade before the section edge would have cut
        // it off anyway, so the mark dissolves rather than sliding out.
        { yPercent: -8, scale: 1.05, opacity: 0, filter: 'blur(10px)', duration: 0.52, ease: 'power2.in' },
        0.63
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
    const land = landPose(false);
    const t = ease.inOutCubic(clamp01(p / (DROP / total)));

    // Opacity is derived from progress rather than tweened, so a reload part
    // way into the stage still shows the mic in flight instead of inheriting
    // whatever value the scene-1 timeline last wrote.
    const fadeFrom = (DROP + 0.03) / total;
    const fadeTo = (DROP + 0.24) / total;

    gsap.set(els.mic, {
      x: lerp(seam.x, land.x, t),
      y: lerp(seam.y, land.y, t),
      scale: lerp(seam.scale, land.scale, t),
      rotation: lerp(seam.rot, land.rot, t),
      opacity: 1 - clamp01((p - fadeFrom) / (fadeTo - fadeFrom)),
      filter: 'blur(0px)',
    });

    // Scene 1 handed the bloom over at full strength; carry it out from there.
    // Anchored to the hand, not the mic, so it stays put as it expands.
    const outFrom = (DROP + 0.02) / total;
    const outTo = (DROP + 0.62) / total;
    const bloom = clamp01((p - outFrom) / (outTo - outFrom));
    placeFlash(land, 1 - bloom, lerp(1, 2.2, bloom));
  }

  // Total length of the stage timeline in its own units; kept in one place so
  // the mic's drop can be expressed as a fraction of overall progress.
  let stageTotal = DROP + 2.35;
  // (overwritten with tl.duration() once buildStageScene has run)
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
      // The glow and the impact bloom are both driven from progress instead
      // (see placeMicForMark / placeMicForStage) — they start in scene 1, and
      // tweening them here as well would have the two timelines fight for them.
      //
      // The photo irises open out of his hand from the very first pixel of
      // scroll in this scene, inside the bloom scene 1 already lit. Quick on
      // purpose: while the circle is small the screen is mostly backdrop.
      .fromTo(
        els.canvasWrap,
        { autoAlpha: 0, clipPath: () => `circle(0% at ${irisPct().x}% ${irisPct().y}%)` },
        {
          autoAlpha: 1,
          clipPath: () => `circle(165% at ${irisPct().x}% ${irisPct().y}%)`,
          duration: 0.2,
          ease: 'power2.out',
        },
        0
      )
      // (the mic's own fade is driven from progress in placeMicForStage)
      // Hand-off complete — scrub the sequence: he closes his hand around the
      // mic and brings it down to his mouth.
      .to(
        seqState,
        { p: 1, duration: 1.55, ease: 'none', onUpdate: () => seq.setProgress(seqState.p) },
        DROP + 0.2
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
