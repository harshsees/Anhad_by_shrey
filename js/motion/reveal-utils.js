/* =============================================
   ANAHAD BY SHREY — Motion System: Shared Utilities
   Reduced-motion/mobile flags, object-fit:cover point
   mapping (used to land the traveling mic exactly on
   its real pixels), and an accessible word-split helper.
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
   * Given a container element rendering an image at CSS `object-fit: cover`
   * (object-position: center), returns the on-screen point (relative to the
   * container's top-left, in px) that a fractional point (px, py in 0..1)
   * of the *source* image currently maps to. This is what lets the
   * standalone mic crop line up with the real mic pixels inside the full
   * photo at any viewport size.
   */
  Motion.getCoverPoint = function (container, naturalW, naturalH, px, py) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const imageAspect = naturalW / naturalH;
    const containerAspect = w / h;

    let renderedW, renderedH, offsetX, offsetY;
    if (imageAspect > containerAspect) {
      renderedH = h;
      renderedW = h * imageAspect;
      offsetX = (w - renderedW) / 2;
      offsetY = 0;
    } else {
      renderedW = w;
      renderedH = w / imageAspect;
      offsetX = 0;
      offsetY = (h - renderedH) / 2;
    }

    return {
      x: offsetX + px * renderedW,
      y: offsetY + py * renderedH,
      // px-per-source-fraction scale, useful for sizing a crop box to stay
      // proportional to the rendered image (e.g. mic focus box width).
      scaleW: renderedW,
      scaleH: renderedH,
    };
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

  /**
   * The rectangle an `object-fit: cover` image occupies inside a box, with a
   * configurable focal point (fx/fy in 0..1 decide how the overflow is split
   * between the two sides — 0.5/0.5 is plain `object-position: center`).
   * Returned in box-local px. The hero canvas draws with exactly this rect,
   * so mapping a source-image fraction onto the screen is the same math in
   * both places.
   */
  Motion.coverRect = function (boxW, boxH, srcW, srcH, fx, fy) {
    const scale = Math.max(boxW / srcW, boxH / srcH);
    const w = srcW * scale;
    const h = srcH * scale;
    return {
      x: (boxW - w) * fx,
      y: (boxH - h) * fy,
      w,
      h,
    };
  };

  Motion.clamp01 = function (v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  };

  Motion.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  // Local easing helpers so the mic path can be driven from an onUpdate
  // callback (it needs live geometry every tick) instead of a tween.
  Motion.ease = {
    inQuad: (t) => t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

  // Known mic anchor points (fraction of source-image dimensions) used by
  // hero-story.js and section-motion.js. Measured against the real frames;
  // kept in one place so re-tuning doesn't require touching the animation
  // logic itself.
  Motion.micAnchors = {
    // The homepage hero canvas sequence (assets/hero-seq/**). Source frames
    // are 1920x1080 stills of Shrey performing.
    heroSeq: {
      naturalW: 1920,
      naturalH: 1080,
      // How the sequence is cropped when the stage is wider/taller than 16:9.
      // Biased up and slightly left so he stays clear of the copy column.
      focal: { x: 0.42, y: 0.34 },
      // Frame 001 — the mic in flight, just short of his raised right hand
      // (viewer's right). This is where the mic travelling out of the logo
      // scene has to land, so the drawn overlay and the photographed mic are
      // the same object at the moment of the cut. Measured on
      // assets/hero-seq/w1280/frame-001.jpg.
      land: { cx: 0.489, cy: 0.340, length: 0.167, rotation: -58.2 },
    },
  };
})();
