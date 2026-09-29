/* ==========================================================================
   ALPINEX – prace wysokościowe | skrypty strony
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Rok w stopce ---------- */
  var year = $('#year');
  if (year) { year.textContent = new Date().getFullYear(); }

  /* ---------- Nagłówek przyklejony ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  var lastY = -1;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y === lastY) { return; }
    lastY = y;
    if (header) { header.classList.toggle('is-stuck', y > 12); }
    if (toTop) { toTop.classList.toggle('is-visible', y > 700); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Menu mobilne ---------- */
  var drawer = $('#drawer');
  var burger = $('#hamburger');
  var drawerClose = $('#drawerClose');

  function openDrawer() {
    if (!drawer) { return; }
    drawer.classList.add('is-open');
    document.body.classList.add('is-locked');
    if (burger) { burger.setAttribute('aria-expanded', 'true'); }
    var first = $('.drawer__nav a', drawer);
    if (first) { first.focus({ preventScroll: true }); }
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) { return; }
    drawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus({ preventScroll: true }); }
  }

  if (burger) { burger.addEventListener('click', openDrawer); }
  if (drawerClose) { drawerClose.addEventListener('click', closeDrawer); }
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) { closeDrawer(); }
    });
    $$('.drawer__nav a, .drawer__actions a', drawer).forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ---------- Animacje wejścia ---------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Aktywna pozycja w menu ---------- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ======================================================================
     GALERIA – filtry + leniwe dokładanie zdjęć
     ====================================================================== */
  var masonry = $('#masonry');
  var filtersBox = $('#filters');
  var showAllBtn = $('#showAll');
  var batchSize = 24;
  var shown = batchSize;

  var items = masonry ? $$('.g-item', masonry) : [];
  items.forEach(function (item) {
    var img = $('img', item);
    if (img) { item.dataset.ratio = (img.naturalHeight || img.height || 1) / (img.naturalWidth || img.width || 1); }
  });

  var countAll = $('#countAll');
  if (countAll) { countAll.textContent = items.length; }

  var currentFilter = 'all';

  function matches(item, filter) {
    return filter === 'all' || item.dataset.cat === filter;
  }

  function applyFilter(filter) {
    currentFilter = filter;
    shown = batchSize;
    var matching = 0;
    items.forEach(function (item) {
      var ok = matches(item, filter);
      if (ok) {
        matching++;
        item.classList.toggle('is-hidden', matching > shown);
      } else {
        item.classList.add('is-hidden');
      }
    });
    if (showAllBtn) {
      var left = Math.max(0, matching - shown);
      showAllBtn.parentNode.style.display = left > 0 ? '' : 'none';
      showAllBtn.textContent = 'Pokaż więcej zdjęć (+' + Math.min(batchSize, left) + ')';
    }
  }

  if (showAllBtn) {
    showAllBtn.addEventListener('click', function () {
      var before = shown;
      shown += batchSize;
      var matching = 0;
      items.forEach(function (item) {
        if (!matches(item, currentFilter)) { return; }
        matching++;
        if (matching > before && matching <= shown) { item.classList.remove('is-hidden'); }
      });
      var left = Math.max(0, matching - shown);
      showAllBtn.parentNode.style.display = left > 0 ? '' : 'none';
      showAllBtn.textContent = 'Pokaż więcej zdjęć (+' + Math.min(batchSize, left) + ')';
    });
  }

  if (filtersBox) {
    filtersBox.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) { return; }
      $$('.filter', filtersBox).forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  }

  $$('[data-filter-link]').forEach(function (link) {
    link.addEventListener('click', function () {
      var wanted = link.dataset.filterLink;
      var btn = filtersBox ? $('.filter[data-filter="' + wanted + '"]', filtersBox) : null;
      if (btn) {
        $$('.filter', filtersBox).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        applyFilter(wanted);
      }
    });
  });

  applyFilter('all');

  /* ======================================================================
     LIGHTBOX
     ====================================================================== */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCaption = $('#lbCaption');
  var lbText = $('#lbText');
  var lbCounter = $('#lbCounter');
  var lbPrev = $('#lbPrev');
  var lbNext = $('#lbNext');
  var lbClose = $('#lbClose');
  var lbItems = [];
  var lbIndex = 0;
  var lastFocus = null;

  function collectItems(scope) {
    return $$('a[data-full]', scope).filter(function (a) {
      var fig = a.closest('.g-item, .g-thumb');
      return !fig || !fig.classList.contains('is-hidden');
    });
  }

  function preload(src) {
    if (!src) { return; }
    var img = new Image();
    img.src = src;
  }

  function render() {
    var a = lbItems[lbIndex];
    if (!a) { return; }
    var fig = a.closest('.g-item, .g-thumb') || a;
    lbImg.classList.remove('is-ready');
    lbImg.src = a.dataset.full;
    lbImg.alt = $('img', fig) ? $('img', fig).alt : '';
    lbCaption.textContent = a.dataset.caption || 'Galeria';
    lbText.textContent = a.dataset.text || '';
    lbCounter.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
    preload(lbItems[lbIndex + 1] ? lbItems[lbIndex + 1].dataset.full : null);
    preload(lbItems[lbIndex - 1] ? lbItems[lbIndex - 1].dataset.full : null);
  }

  function openLightbox(a) {
    var scope = a.closest('[data-gallery]') || document;
    lbItems = collectItems(scope);
    lbIndex = Math.max(0, lbItems.indexOf(a));
    lastFocus = document.activeElement;
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
    render();
    if (lbClose) { lbClose.focus({ preventScroll: true }); }
  }

  function closeLightbox() {
    if (!lb || !lb.classList.contains('is-open')) { return; }
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    lbImg.src = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus({ preventScroll: true }); }
  }

  function step(dir) {
    if (!lbItems.length) { return; }
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    render();
  }

  lbImg.addEventListener('load', function () { lbImg.classList.add('is-ready'); });
  lbImg.addEventListener('error', function () { lbImg.classList.add('is-ready'); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-full]');
    if (a) {
      e.preventDefault();
      openLightbox(a);
    }
  });

  if (lbClose) { lbClose.addEventListener('click', closeLightbox); }
  if (lbPrev) { lbPrev.addEventListener('click', function () { step(-1); }); }
  if (lbNext) { lbNext.addEventListener('click', function () { step(1); }); }
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) { closeLightbox(); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeLightbox();
      closeDrawer();
      return;
    }
    if (!lb || !lb.classList.contains('is-open')) { return; }
    if (e.key === 'ArrowLeft') { step(-1); }
    if (e.key === 'ArrowRight') { step(1); }
  });

  var touchX = null;
  if (lb) {
    lb.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) { return; }
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 55) { step(dx > 0 ? -1 : 1); }
    }, { passive: true });
  }

  /* ======================================================================
     FORMULARZ – zapytanie o wycenę (mailto)
     ====================================================================== */
  var form = $('#quoteForm');
  var status = $('#formStatus');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var phone = (data.get('phone') || '').toString().trim();
      var email = (data.get('email') || '').toString().trim();
      var service = (data.get('service') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      if (!name || !phone || !message) {
        if (status) {
          status.textContent = 'Uzupełnij imię, telefon i opis zlecenia.';
          status.style.color = '#b42318';
        }
        return;
      }

      var subject = 'Zapytanie o wycenę: ' + service + ' – ' + name;
      var body = [
        'Zakres usługi: ' + service,
        'Imię i nazwisko: ' + name,
        'Telefon: ' + phone,
        'E-mail: ' + (email || 'nie podano'),
        '',
        'Opis zlecenia:',
        message,
        '',
        '— wiadomość wysłana ze strony alpinex.lublin.pl'
      ].join('\r\n');

      window.location.href = 'mailto:biuro@alpinex.lublin.pl?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      if (status) {
        status.style.color = '#17703c';
        status.textContent = 'Dziękujemy! Otwieramy Twój program pocztowy z gotową wiadomością…';
      }
    });
  }
})();
