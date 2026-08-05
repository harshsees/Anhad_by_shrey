/* =============================================
   ANAHAD BY SHREY — Icon set

   Replaces the colour emoji the pages used to carry. Emoji render in each
   platform's own house style — glossy blue phones, yellow hands — which sat
   badly against the maroon/gold/cream palette and changed shape per device.
   These are stroke icons on currentColor, so they inherit the surrounding
   type colour and stay on-brand everywhere.

   Usage, static:   <span class="icon-glyph" data-icon="phone"></span>
   Usage, from JS:  el.innerHTML = Icons.svg('lotus');

   Anything injected after load (puja cards, modals) should call
   Icons.hydrate(container) once it is in the DOM.
   ============================================= */

(function () {
  const wrap = (body, opts) =>
    '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="' + ((opts && opts.weight) || 1.6) + '" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';

  const PATHS = {
    // ── Contact ──
    phone:
      '<path d="M6.2 3.5h3l1.5 3.7-1.9 1.4a11.5 11.5 0 0 0 5.6 5.6l1.4-1.9 3.7 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z"/>',
    chat:
      '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.4-4.4A7.5 7.5 0 1 1 20 12Z"/>',
    mail:
      '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.8 6.7 8.2 6 8.2-6"/>',
    location:
      '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    clock:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',

    // ── Devotion / craft ──
    // A lotus: the site's own idiom for reverence, in place of the folded-hands emoji.
    lotus:
      '<path d="M12 20.5c-4.2 0-7.6-2.6-7.6-5.1 0-1 .6-1.7 1.6-1.7 1.6 0 3 1.4 3.6 2.9"/>' +
      '<path d="M12 20.5c4.2 0 7.6-2.6 7.6-5.1 0-1-.6-1.7-1.6-1.7-1.6 0-3 1.4-3.6 2.9"/>' +
      '<path d="M12 20.5c-2.4-1.6-3.8-4-3.8-6.6 0-2.9 1.6-5.6 3.8-7.4 2.2 1.8 3.8 4.5 3.8 7.4 0 2.6-1.4 5-3.8 6.6Z"/>' +
      '<path d="M12 6.5V3.5"/>',
    note:
      '<path d="M9.2 17.5V6.2l8-1.7v11"/><circle cx="7" cy="17.8" r="2.3"/><circle cx="15" cy="15.8" r="2.3"/>',
    temple:
      '<path d="M12 3 4 8h16l-8-5Z"/><path d="M6 8v9M10 8v9M14 8v9M18 8v9"/><path d="M3.5 17h17M3 20.5h18"/>',
    beads:
      '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="4.5" r="1.5"/>' +
      '<circle cx="19.5" cy="12" r="1.5"/><circle cx="12" cy="19.5" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/>',
    // Diya — the lamp lit at the start of a puja.
    lamp:
      '<path d="M12 3.5c1.8 1.9 2.7 3.4 2.7 4.7a2.7 2.7 0 1 1-5.4 0c0-1.3.9-2.8 2.7-4.7Z"/>' +
      '<path d="M4.5 14.5h15c-.8 3.4-3.8 5.5-7.5 5.5s-6.7-2.1-7.5-5.5Z"/>',

    // ── Utility ──
    document:
      '<path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5.5-5.5Z"/>' +
      '<path d="M13.5 3.5V9H19"/><path d="M8.5 13.5h7M8.5 16.5h5"/>',
    image:
      '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.7"/>' +
      '<path d="m4.5 17.5 4.7-4.3 3.4 3 2.8-2.3 4.1 3.6"/>',
    check:
      '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.2 2.6 2.6 4.8-5.2"/>',
    star:
      '<path d="M12 3.2 14 9.6l6.4 2.4-6.4 2.4-2 6.4-2-6.4L3.6 12 10 9.6l2-6.4Z"/>',
  };

  const Icons = {
    has: (name) => Object.prototype.hasOwnProperty.call(PATHS, name),

    svg(name, opts) {
      if (!Icons.has(name)) return '';
      return wrap(PATHS[name], opts);
    },

    /** Fill every [data-icon] inside `root` (defaults to the document). Safe to
     *  call repeatedly: an already-filled span is skipped. */
    hydrate(root) {
      const scope = root || document;
      scope.querySelectorAll('[data-icon]').forEach((el) => {
        if (el.firstElementChild) return;
        const markup = Icons.svg(el.getAttribute('data-icon'), {
          weight: el.getAttribute('data-icon-weight'),
        });
        if (markup) el.innerHTML = markup;
      });
    },
  };

  window.Icons = Icons;
  document.addEventListener('DOMContentLoaded', () => Icons.hydrate());
})();
