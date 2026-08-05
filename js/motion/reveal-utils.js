/* =============================================
   ANAHAD BY SHREY — Motion System: Shared Utilities
   Reduced-motion/mobile flags, small math helpers, and
   an accessible word-split helper.
   ============================================= */

(function () {
  window.Motion = window.Motion || {};

  Motion.prefersReducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Matches the layout breakpoint where pinned/travel sequences degrade
  // to simpler scroll-linked fades (mobile browser chrome resize makes
  // ScrollTrigger pin distances unreliable below this width).
  Motion.isCompact = function () {
    return window.innerWidth < 900;
  };

  /**
   * Splits an element's text into per-word spans for stagger reveals
   * without touching the actual text content — screen readers read the
   * element exactly as before. Returns the animatable inner spans.
   */
  Motion.splitWords = function (el) {
    if (el.dataset.split === 'true') {
      return Array.from(el.querySelectorAll('.split-word__inner'));
    }
    const tokens = el.textContent.split(/(\s+)/);
    el.textContent = '';
    const inners = [];

    tokens.forEach((token) => {
      if (token === '') return;
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
        return;
      }
      const outer = document.createElement('span');
      outer.className = 'split-word';
      const inner = document.createElement('span');
      inner.className = 'split-word__inner';
      inner.textContent = token;
      outer.appendChild(inner);
      el.appendChild(outer);
      inners.push(inner);
    });

    el.dataset.split = 'true';
    return inners;
  };

  Motion.debounce = function (fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  Motion.clamp01 = function (v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  };

  Motion.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  // Local easing helpers for motion driven from an onUpdate callback (live
  // geometry every tick) rather than from a tween.
  Motion.ease = {
    inQuad: (t) => t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

})();
