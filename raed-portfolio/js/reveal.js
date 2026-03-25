/* ═══════════════════════════════════════════════════════
   reveal.js — Scroll reveal + project score bars + 3D card tilt
   Uses getBoundingClientRect (no IntersectionObserver quirks).
═══════════════════════════════════════════════════════ */

/* ── SCROLL REVEAL ────────────────────────────────────── */
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('.rev'));

  function check() {
    var vh = window.innerHeight;
    for (var i = els.length - 1; i >= 0; i--) {
      if (els[i].getBoundingClientRect().top < vh - 20) {
        els[i].classList.add('on');
        els.splice(i, 1);
      }
    }
  }

  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check, { passive: true });
  check();
  setTimeout(check, 150);
  setTimeout(check, 500);
  setTimeout(check, 1200);
}());

/* ── PROJECT SCORE BARS ───────────────────────────────── */
(function () {
  var bars = Array.prototype.slice.call(document.querySelectorAll('.pcfill'));

  bars.forEach(function (bar) {
    bar._pct = parseFloat(bar.getAttribute('data-pct')) || 1;
  });

  function check() {
    var vh = window.innerHeight;
    for (var i = bars.length - 1; i >= 0; i--) {
      if (bars[i].getBoundingClientRect().top < vh - 10) {
        bars[i].style.transform = 'scaleX(' + bars[i]._pct + ')';
        bars.splice(i, 1);
      }
    }
  }

  window.addEventListener('scroll', check, { passive: true });
  setTimeout(check, 700);
}());

/* ── 3D CARD TILT ─────────────────────────────────────── */
(function () {
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width  - 0.5;
      var y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = 'perspective(700px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-4px)';
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top)  + 'px');
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
}());
