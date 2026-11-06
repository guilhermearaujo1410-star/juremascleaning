(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 901px)');

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Details that are open on desktop and collapsed on mobile
  function syncDetails() {
    document.querySelectorAll('[data-desktop-open]').forEach(function (d) { d.open = desktop.matches; });
  }
  syncDetails();
  desktop.addEventListener ? desktop.addEventListener('change', syncDetails) : desktop.addListener(syncDetails);

  var root = document.documentElement;
  if (reduce) root.classList.add('rm');

  // Split hero headings into words, each sliding up from a mask (desktop only)
  if (desktop.matches && !reduce) {
    document.querySelectorAll('[data-split]').forEach(function (h) {
      var words = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', h.textContent.trim());
      h.innerHTML = words.map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span style="animation-delay:' + (0.02 + i * 0.06) + 's">' + w + '</span></span>';
      }).join(' ');
    });
  }

  // Stagger children of [data-stagger], then reveal on scroll
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.setAttribute('data-reveal', g.getAttribute('data-stagger') || 'up'); c.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  var revealEls = document.querySelectorAll('[data-reveal], .steps li, .map');
  if (!reduce && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
  // map towns pop in one after another
  document.querySelectorAll('.map').forEach(function (m) {
    m.querySelectorAll('.m-dot').forEach(function (d, i) { d.style.setProperty('--d', (0.6 + i * 0.07) + 's'); if (d.nextElementSibling) d.nextElementSibling.style.setProperty('--d', (0.65 + i * 0.07) + 's'); });
  });

  // Header gets compact + shadow on scroll
  var hdr = document.querySelector('.site-header');
  if (hdr) {
    var onS = function () { hdr.classList.toggle('scrolled', window.scrollY > 12); };
    onS(); window.addEventListener('scroll', onS, { passive: true });
  }

  // Before / after cards (same behavior as Cleanplicity)
  document.querySelectorAll('[data-ba]').forEach(function (card, i) {
    var media = card.querySelector('.ba-media'), tag = card.querySelector('.ba-tag'), btns = card.querySelectorAll('.ba-toggle button');
    function set(after) {
      card.style.setProperty('--w', media.offsetWidth + 'px');
      if (after && !card.classList.contains('after')) { card.classList.add('wiping'); setTimeout(function () { card.classList.remove('wiping'); }, 1150); }
      card.classList.toggle('after', after);
      tag.textContent = after ? 'After' : 'Before';
      btns.forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.v === 'a') === after ? 'true' : 'false'); });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { card._touched = true; set(b.dataset.v === 'a'); }); });
    media.addEventListener('click', function () { card._touched = true; set(!card.classList.contains('after')); });
    media.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card._touched = true; set(!card.classList.contains('after')); } });
    if (reduce || !('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { o.disconnect(); setTimeout(function () { if (!card._touched) set(true); }, 900 + i * 450); } }); }, { threshold: .55 });
    o.observe(card);
  });

  // Checklist: room tabs, Recurring / Deep, sparkles on the room drawing
  document.querySelectorAll('[data-checklist]').forEach(function (cl) {
    var tabs = cl.querySelectorAll('[role=tab]');
    function panel() { return cl.querySelector('.cl-panel:not([hidden])'); }
    function sparkle(p) {
      if (!p) return;
      var spots = p.querySelectorAll('.hs');
      spots.forEach(function (s) { s.classList.remove('show'); });
      var visible = Array.prototype.filter.call(spots, function (s) { return !s.classList.contains('deep') || cl.dataset.mode === 'deep'; });
      visible.forEach(function (s, k) { setTimeout(function () { s.classList.add('show'); }, reduce ? 0 : 90 * k); });
      p.querySelectorAll('.cl-list li').forEach(function (li, k) { li.style.setProperty('--k', k); li.style.animation = 'none'; li.offsetHeight; li.style.animation = ''; });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          x.tabIndex = on ? 0 : -1;
          document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
        });
        sparkle(panel());
      });
      t.addEventListener('keydown', function (e) {
        var i = Array.prototype.indexOf.call(tabs, t);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          n.focus(); n.click(); e.preventDefault();
        }
      });
    });
    cl.querySelectorAll('.cl-mode [data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        cl.dataset.mode = b.dataset.mode;
        cl.querySelectorAll('.cl-mode [data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var note = cl.querySelector('[data-mode-note]');
        if (note) note.textContent = b.dataset.mode === 'deep'
          ? 'Deep: everything in a regular visit, plus the detail work marked “Deep”.'
          : 'Recurring: what Ju takes care of on a regular visit.';
        sparkle(panel());
      });
    });
    // hovering or tapping an item lights its spot in the drawing
    cl.querySelectorAll('.cl-list li').forEach(function (li) {
      function on(v) {
        var p = li.closest('.cl-panel');
        p.querySelectorAll('.hs[data-i="' + li.dataset.i + '"]').forEach(function (s) { s.classList.toggle('on', v); });
        li.classList.toggle('on', v);
      }
      li.addEventListener('mouseenter', function () { on(true); });
      li.addEventListener('mouseleave', function () { on(false); });
      li.addEventListener('click', function () {
        var p = li.closest('.cl-panel');
        p.querySelectorAll('.cl-list li.on').forEach(function (x) { if (x !== li) { x.classList.remove('on'); p.querySelectorAll('.hs[data-i="' + x.dataset.i + '"]').forEach(function (s) { s.classList.remove('on'); }); } });
        on(!li.classList.contains('on'));
      });
    });
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { so.disconnect(); sparkle(panel()); } });
      }, { threshold: 0.3 });
      so.observe(cl);
    } else { sparkle(panel()); }
    var det = cl.closest('details');
    if (det) det.addEventListener('toggle', function () { if (det.open) sparkle(panel()); });
  });

  // Reviews: 2 on mobile, then "Show more"
  document.querySelectorAll('.show-more').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.previousElementSibling; r.classList.add('all'); b.hidden = true; b.setAttribute('aria-expanded', 'true');
    });
  });

  // Floating call button (desktop) after the hero
  var fab = document.querySelector('.fab'), hero = document.querySelector('.hero, .page-hero');
  if (fab) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { fab.classList.toggle('show', !en[0].isIntersecting); }, { threshold: 0 }).observe(hero);
    } else { fab.classList.add('show'); }
  }
})();
