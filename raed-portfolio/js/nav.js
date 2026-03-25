/* ═══════════════════════════════════════════════════════
   nav.js — Sticky nav with blur on scroll
═══════════════════════════════════════════════════════ */
(function () {
  var nav = document.getElementById('nav');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) nav.classList.add('on');
    else nav.classList.remove('on');
  }, { passive: true });
}());
