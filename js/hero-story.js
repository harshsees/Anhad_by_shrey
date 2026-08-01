/* =============================================
   ANAHAD BY SHREY — Hero Story
   Scenes 1-4: opening mic sequence -> travel ->
   hero photo reveal -> handoff into #intro.
   Built on GSAP + ScrollTrigger, wired to the
   existing Lenis instance (js/smooth-scroll.js).
   ============================================= */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const heroStory = document.getElementById('heroStory');
    if (!heroStory) return;

    const els = collectEls(heroStory);

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // No motion library available — content is already in the DOM and
      // visible via the reduced-motion CSS fallback state, so nothing to do.
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    bridgeLenis();

    if (Motion.prefersReducedMotion()) {
      // CSS (@media prefers-reduced-motion) already renders the fully
      // settled hero — no ScrollTrigger/pin/particles are created.
      return;
    }

    fitAllCropImages(els);
    window.addEventListener(
      'resize',
      Motion.debounce(() => fitAllCropImages(els), 200)
    );

    playIntroReveal(els);

    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const cleanup = buildHeroScrollTimeline(els, { pin: true, end: '+=280%' });
        return cleanup;
      },
      '(max-width: 899px)': () => {
        const cleanup = buildHeroScrollTimeline(els, { pin: false, end: '+=140%' });
        return cleanup;
      },
    });

    buildHandoff(els);
  }

  function collectEls(heroStory) {
    return {
      heroStory,
      photoWrap: document.getElementById('heroPhotoWrap'),
      photo: document.getElementById('heroPhoto'),
      sweep: document.getElementById('heroSweep'),
      glow: document.getElementById('heroGlow'),
      particlesMount: document.getElementById('heroParticles'),
      micFocus: document.getElementById('micFocus'),
      micFocusImg: document.getElementById('micFocusImg'),
      opening: document.getElementById('heroOpening'),
      openingTitle: document.getElementById('heroOpeningTitle'),
      scrollCue: document.getElementById('heroScrollCue'),
      content: document.getElementById('heroContent'),
      pretitle: document.getElementById('heroPretitle'),
      title: document.getElementById('heroTitle'),
      tagline: document.getElementById('heroTagline'),
      buttons: document.getElementById('heroButtons'),
      socialProof: document.getElementById('heroSocialProof'),
      micEcho: document.getElementById('micEcho'),
      micEchoFrom: document.getElementById('micEchoFrom'),
      micEchoTo: document.getElementById('micEchoTo'),
      introSection: document.getElementById('intro'),
      introImageFrame: document.getElementById('introImageFrame'),
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

  /* ── Crop-image fitting: sizes/positions the mic crop <img>s so they
     show exactly the mic region of the source photo, scaled to fill
     their (fixed-size) box. Only re-run on init/resize — the travel
     animation itself only touches `transform` on the parent box, so
     the crop stays framed correctly throughout at zero extra cost. ── */
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

  function fitAllCropImages(els) {
    fitCropImage(els.micFocusImg, els.micFocus.offsetWidth, els.micFocus.offsetHeight, Motion.micAnchors.hero);
    fitCropImage(els.micEchoFrom, els.micEcho.offsetWidth, els.micEcho.offsetHeight, Motion.micAnchors.hero);
    fitCropImage(els.micEchoTo, els.micEcho.offsetWidth, els.micEcho.offsetHeight, Motion.micAnchors.intro);
  }

  /* ── Scene metrics: where the mic's true pixels land on screen right
     now, used to drive both the mic-focus travel and the photo's iris
     reveal origin from the same single source of truth. ── */
  function computeSceneMetrics(els) {
    const anchor = Motion.micAnchors.hero;
    const containerW = els.photoWrap.clientWidth;
    const containerH = els.photoWrap.clientHeight;
    const cover = Motion.getCoverPoint(els.photoWrap, anchor.naturalW, anchor.naturalH, anchor.cx, anchor.cy);
    const startY = Motion.isCompact() ? 0.4 : 0.44;
    const startCenter = { x: containerW * 0.5, y: containerH * startY };
    const baseW = els.micFocus.offsetWidth;
    const targetMicW = anchor.boxW * cover.scaleW;

    return {
      dx: cover.x - startCenter.x,
      dy: cover.y - startCenter.y,
      scale: targetMicW / baseW,
      irisXPct: (cover.x / containerW) * 100,
      irisYPct: (cover.y / containerH) * 100,
    };
  }

  /* ── Scene 1: autoplay entrance on load (not scroll-linked) ── */
  function playIntroReveal(els) {
    // openingTitle contains <em>/<br> markup, so it's animated as one
    // block rather than word-split (which would flatten that markup via
    // textContent) — Motion.splitWords is only safe on plain-text headings.
    const eyebrow = els.opening.querySelector('.hero-story__eyebrow');

    gsap.set(eyebrow, { opacity: 0, y: 12 });
    gsap.set(els.openingTitle, { y: 26, opacity: 0, filter: 'blur(10px)' });
    gsap.set(els.micFocus, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' });
    gsap.set(els.scrollCue, { opacity: 0 });

    gsap
      .timeline({ delay: 0.2 })
      .to(els.micFocus, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' })
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.3)
      .to(els.openingTitle, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 0.5)
      .to(els.scrollCue, { opacity: 1, duration: 0.6 }, '>-0.2');
  }

  /* ── Scenes 2-3: travel + reveal, scroll-scrubbed ── */
  function buildHeroScrollTimeline(els, options) {
    gsap.set(els.micFocus, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
    gsap.set(els.photo, { scale: 1.08 });
    gsap.set(els.content, { autoAlpha: 0 });

    const contentChildren = [els.pretitle, els.title, els.tagline, els.buttons, els.socialProof];
    gsap.set(contentChildren, { opacity: 0, y: 22, filter: 'blur(8px)' });

    let particles = null;
    if (!Motion.isCompact()) {
      particles = Motion.createParticleField(els.particlesMount, { count: 46 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.heroStory,
        start: 'top top',
        end: options.end,
        scrub: 1,
        pin: options.pin,
        anticipatePin: options.pin ? 1 : 0,
        invalidateOnRefresh: true,
      },
    });

    tl.to(els.opening, { autoAlpha: 0, y: -24, filter: 'blur(6px)', duration: 1 }, 0)
      .to(els.glow, { opacity: 0, scale: 0.7, duration: 1 }, 0)
      .to(els.scrollCue, { opacity: 0, duration: 0.5 }, 0);

    if (particles) {
      tl.to(
        {},
        { duration: 1, onUpdate: () => particles.setIntensity(gsap.getProperty(els.opening, 'opacity')) },
        0
      );
    }

    tl.to(
      els.micFocus,
      {
        x: () => computeSceneMetrics(els).dx,
        y: () => computeSceneMetrics(els).dy,
        scale: () => computeSceneMetrics(els).scale,
        duration: 2,
        ease: 'power2.inOut',
      },
      0.6
    )
      .fromTo(
        els.photoWrap,
        { clipPath: () => `circle(0% at ${computeSceneMetrics(els).irisXPct}% ${computeSceneMetrics(els).irisYPct}%)` },
        {
          clipPath: () => `circle(145% at ${computeSceneMetrics(els).irisXPct}% ${computeSceneMetrics(els).irisYPct}%)`,
          duration: 1.8,
          ease: 'power1.inOut',
        },
        1.1
      )
      .to(els.photo, { scale: 1, duration: 1.8, ease: 'power1.inOut' }, 1.1)
      .to(els.sweep, { x: '140%', duration: 1.3, ease: 'power2.inOut' }, 1.3)
      .to(els.micFocus, { opacity: 0, duration: 0.5 }, 2.5)
      .to(els.content, { autoAlpha: 1, duration: 0.4 }, 2.55)
      .to(contentChildren, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.12 }, 2.6);

    return () => {
      if (particles) particles.destroy();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* ── Scene 4: mic echo travels from the settled hero into #intro ── */
  function getHeroMicViewportPoint(els) {
    const anchor = Motion.micAnchors.hero;
    const w = els.heroStory.clientWidth;
    const h = els.heroStory.clientHeight;
    return Motion.getCoverPoint({ clientWidth: w, clientHeight: h }, anchor.naturalW, anchor.naturalH, anchor.cx, anchor.cy);
  }

  function buildHandoff(els) {
    if (!els.introSection || !els.introImageFrame) return;
    const anchor = Motion.micAnchors.intro;
    const easeFn = gsap.parseEase('power1.inOut');

    gsap.set(els.micEcho, { opacity: 0 });
    gsap.set(els.micEchoFrom, { opacity: 1 });
    gsap.set(els.micEchoTo, { opacity: 0 });

    ScrollTrigger.create({
      trigger: els.heroStory,
      start: 'bottom bottom',
      endTrigger: els.introSection,
      end: 'center center',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const eased = easeFn(p);

        const start = getHeroMicViewportPoint(els);
        const localEnd = Motion.getCoverPoint(els.introImageFrame, anchor.naturalW, anchor.naturalH, anchor.cx, anchor.cy);
        const introRect = els.introImageFrame.getBoundingClientRect();
        const endX = introRect.left + localEnd.x;
        const endY = introRect.top + localEnd.y;

        const x = gsap.utils.interpolate(start.x, endX, eased);
        const y = gsap.utils.interpolate(start.y, endY, eased);

        let opacity = 1;
        if (p < 0.12) opacity = p / 0.12;
        else if (p > 0.85) opacity = (1 - p) / 0.15;
        opacity = Math.max(0, Math.min(1, opacity));

        gsap.set(els.micEcho, {
          left: x,
          top: y,
          xPercent: -50,
          yPercent: -50,
          opacity,
          scale: gsap.utils.interpolate(0.7, 1, eased),
        });
        gsap.set(els.micEchoFrom, { opacity: 1 - eased });
        gsap.set(els.micEchoTo, { opacity: eased });
      },
    });
  }
})();
