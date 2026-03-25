/* ═══════════════════════════════════════════════════════
   cursor.js — Custom gold cursor + lagging ring
   Starts off-screen. Activates only on first mousemove.
═══════════════════════════════════════════════════════ */
(function () {
  var dot  = document.getElementById('cdot');
  var ring = document.getElementById('cring');
  var tx = 0, ty = 0;
  var rx = 0, ry = 0;
  var started = false;

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    dot.style.left = tx + 'px';
    dot.style.top  = ty + 'px';
    if (!started) {
      started = true;
      rx = tx; ry = ty;
      animateRing();
    }
  });

  function animateRing() {
    rx += (tx - rx) * 0.13;
    ry += (ty - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
}());
