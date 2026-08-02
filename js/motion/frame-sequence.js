/* =============================================
   ANAHAD BY SHREY — Canvas Frame Sequence
   Scroll-scrubbable image sequence player used by
   the homepage hero (js/hero-story.js). Loads a
   sparse ladder of frames first so scrubbing is
   usable almost immediately, then backfills the
   rest at low concurrency.
   ============================================= */

(function () {
  window.Motion = window.Motion || {};

  const LADDER_STEP = 5; // every 5th frame loads first
  const BACKFILL_CONCURRENCY = 5;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   *   count        — number of frames
   *   path         — (tier, index1) => src
   *   tiers        — [{ name, maxCssWidth }] ordered small → large
   *   naturalW/H   — source frame dimensions
   *   focal        — { x, y } cover focal point
   *   onFirstFrame — called once frame 1 has painted
   *   onReady      — called once the sparse ladder has loaded
   */
  Motion.createFrameSequence = function (canvas, options) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const count = options.count;
    const frames = new Array(count).fill(null);
    const tier = pickTier(options.tiers);

    let currentIndex = 0;
    let disposed = false;
    let boxW = 0;
    let boxH = 0;
    let rect = null;

    function pickTier(tiers) {
      // Save-Data / 2G stays on the small tier regardless of screen size — a
      // retina phone on a metered connection should not pull the 7 MB set.
      const conn = navigator.connection;
      if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) {
        return tiers[0].name;
      }
      // Matched on CSS width, not device pixels: the small tier is already
      // ~1.6x density on a phone, which is plenty for a moving sequence.
      const target = canvas.clientWidth;
      for (let i = 0; i < tiers.length; i++) {
        if (target <= tiers[i].maxCssWidth) return tiers[i].name;
      }
      return tiers[tiers.length - 1].name;
    }

    function load(i) {
      if (frames[i]) return Promise.resolve(frames[i]);
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames[i] = img;
          // The scrub may be parked on a frame that was still loading and is
          // currently showing a stale neighbour — repaint now that it's here.
          if (i === currentIndex) draw();
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = options.path(tier, i + 1);
      });
    }

    // Nearest already-loaded frame, so a scrub that outruns the backfill
    // shows a slightly stale frame instead of tearing or going blank.
    function nearestLoaded(i) {
      if (frames[i]) return frames[i];
      for (let d = 1; d < count; d++) {
        if (i - d >= 0 && frames[i - d]) return frames[i - d];
        if (i + d < count && frames[i + d]) return frames[i + d];
      }
      return null;
    }

    function measure() {
      boxW = canvas.clientWidth;
      boxH = canvas.clientHeight;
      if (!boxW || !boxH) return false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.round(boxW * dpr);
      const bh = Math.round(boxH * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rect = Motion.coverRect(
        boxW,
        boxH,
        options.naturalW,
        options.naturalH,
        options.focal.x,
        options.focal.y
      );
      return true;
    }

    function draw() {
      if (disposed || !rect) return;
      const img = nearestLoaded(currentIndex);
      if (!img) return;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, rect.x, rect.y, rect.w, rect.h);
    }

    function setProgress(p) {
      const i = Math.round(Motion.clamp01(p) * (count - 1));
      if (i === currentIndex && rect) return;
      currentIndex = i;
      draw();
    }

    function resize() {
      if (measure()) draw();
    }

    // ── Loading: frame 1, then the ladder, then everything else ──
    let readyResolve;
    const ready = new Promise((r) => (readyResolve = r));

    load(0).then(() => {
      if (disposed) return;
      measure();
      draw();
      if (options.onFirstFrame) options.onFirstFrame();

      const ladder = [];
      for (let i = LADDER_STEP; i < count; i += LADDER_STEP) ladder.push(i);
      if (ladder[ladder.length - 1] !== count - 1) ladder.push(count - 1);

      Promise.all(ladder.map(load)).then(() => {
        if (disposed) return;
        draw();
        if (options.onReady) options.onReady();
        readyResolve();
        backfill();
      });
    });

    function backfill() {
      const queue = [];
      for (let i = 0; i < count; i++) if (!frames[i]) queue.push(i);

      let active = 0;
      let next = 0;
      const pump = () => {
        while (active < BACKFILL_CONCURRENCY && next < queue.length && !disposed) {
          active++;
          load(queue[next++]).then(() => {
            active--;
            pump();
          });
        }
      };
      pump();
    }

    const onResize = Motion.debounce(resize, 150);
    window.addEventListener('resize', onResize);

    return {
      count,
      ready,
      setProgress,
      resize,
      /** Cover rect in canvas-local px — used to place the mic on his hand. */
      getRect: () => rect,
      destroy: () => {
        disposed = true;
        window.removeEventListener('resize', onResize);
      },
    };
  };
})();
