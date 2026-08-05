/* =============================================
   ANAHAD BY SHREY — Smooth Scroll (Lenis)
   Premium scroll feel, skipped entirely under
   prefers-reduced-motion.
   ============================================= */

(function () {
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ScrollTrigger's pin transform only applies correctly when gsap.ticker is
     the SOLE driver of Lenis's raf loop (the official Lenis+GSAP recipe).
     Pages without GSAP keep Lenis's own autoRaf; pages with it hand driving
     over to the ticker exclusively, so there is exactly one time source —
     two conflicting drivers previously caused a runaway scroll. Lives here
     rather than in a page script because every pinned page needs it. */
  function bridgeGsap() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (!window.lenis || window.lenis.__gsapBridged) return;

    window.lenis.options.autoRaf = false;
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => window.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.lenis.__gsapBridged = true;
  }

  function createLenis() {
    if (typeof Lenis === 'undefined') return;
    window.lenis = new Lenis({
      autoRaf: true,
      duration: 1.1,
      easing: easeOutExpo,
      smoothWheel: true,
    });
    bridgeGsap();
  }

  function destroyLenis() {
    if (window.lenis) {
      window.lenis.destroy();
      window.lenis = undefined;
    }
  }

  if (!reduceMotion.matches) {
    createLenis();
  }

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) {
        destroyLenis();
      } else {
        createLenis();
      }
    });
  }
})();
