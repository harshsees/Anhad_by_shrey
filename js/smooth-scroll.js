/* =============================================
   ANAHAD BY SHREY — Smooth Scroll (Lenis)
   Premium scroll feel, skipped entirely under
   prefers-reduced-motion.
   ============================================= */

(function () {
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function createLenis() {
    if (typeof Lenis === 'undefined') return;
    window.lenis = new Lenis({
      autoRaf: true,
      duration: 1.1,
      easing: easeOutExpo,
      smoothWheel: true,
    });
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
