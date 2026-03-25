/* ═══════════════════════════════════════════════════════
   hero.js — Futuristic 2050 Holographic Code Board
   v3 — Teacher silhouettes + hover interaction

   Layers (back to front):
   1. Dark bg with motion-blur trail
   2. Tron perspective grid (floor)
   3. Falling code / matrix streams
   4. Floating holographic panels with scrolling ML code
   5. Futuristic TEACHER figures beside each panel
      → idle: slow pointer gestures
      → hover: fast writing arm + panel lights up
   6. Scan line sweep
   7. Concentric hologram rings (centre)
   8. Ambient particles

   CRITICAL: #cv needs CSS width:100% height:100% (in style.css).
             offsetWidth/offsetHeight read inside rAF after layout.
═══════════════════════════════════════════════════════ */
(function () {
  try {
    var cv  = document.getElementById('cv');
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0;
    function setSize() {
      W = cv.width  = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      if (W === 0 || H === 0) {
        W = cv.width  = window.innerWidth;
        H = cv.height = window.innerHeight;
      }
    }

    requestAnimationFrame(function () {
      setSize();
      window.addEventListener('resize', function () { setSize(); init(); });
      init();
      draw();
    });

    /* ── Mouse ── */
    var mx = 0, my = 0;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    /* ── Code lines (Raed's actual dissertation work) ── */
    var CODE = [
      'def detect_fake_review(text, lang):',
      '    model = load_model("bert-multilingual")',
      '    tokens = NLP.tokenize(text, lang)',
      '    pred   = model.predict(tokens)',
      '    return pred.confidence > 0.95',
      '',
      'class FakeReviewDetector:',
      '    def __init__(self, threshold=0.97):',
      '        self.model = TransformerModel()',
      '        self.threshold = threshold',
      '',
      '# Multilingual NLP — Raed Alshammari 2026',
      'from transformers import BertTokenizer',
      'import torch, numpy as np, pandas as pd',
      '',
      'def preprocess_arabic(text):',
      '    return normalizer.normalize(text)',
      '',
      'model.fit(X_train, y_train, epochs=100)',
      'accuracy = evaluate(model, test_set)',
      'F1 = compute_metrics(predictions)',
      '',
      'if lang == "arabic":',
      '    text = translate_ar_to_en(text)',
      '',
      'results = {"FAKE": 0.97, "REAL": 0.03}',
      'confidence = softmax(logits)[1].item()',
      'print(f"Prediction: {label} ({conf:.2%})")',
      'assert accuracy >= 0.94, "retrain model"',
      'pipeline.run(dataset="ecommerce_ar_en")',
    ];

    /* ── State ── */
    var streams   = [];
    var panels    = [];
    var rings     = [];
    var particles = [];
    var scanY     = 0;
    var frame     = 0;

    /* ═══════════════════════════════════════════════
       TEACHER OBJECT
    ═══════════════════════════════════════════════ */
    function makeTeacher() {
      return {
        armAngle:   -0.6,
        armTarget:  -0.6,
        armTimer:   0,
        writePhase: 0,
        bobPhase:   Math.random() * Math.PI * 2,
        bobSpeed:   0.018 + Math.random() * 0.01,
        gestures:   [-1.1, -0.4, -0.85, -1.3, -0.25],
        gestureIdx: 0
      };
    }

    /* ═══════════════════════════════════════════════
       INIT
    ═══════════════════════════════════════════════ */
    function init() {
      scanY = 0; frame = 0;

      /* Falling code streams */
      streams = [];
      var cols = Math.floor(W / 55);
      for (var i = 0; i < cols; i++) {
        streams.push({
          x:     (i / Math.max(cols - 1, 1)) * W,
          chars: [],
          speed: 0.7 + Math.random() * 1.1,
          timer: Math.floor(Math.random() * 50),
          gold:  Math.random() > 0.62
        });
      }

      /* Panel dimensions scale with viewport so they never overflow or overlap */
      var pw = Math.min(290, W * 0.22);   /* panel width  — max 290px, min ~18% viewport */
      var ph = Math.round(pw * 0.64);      /* panel height — fixed aspect ratio          */

      /* On narrow screens hide side panels; on very wide screens cap positions */
      var showSide = W > 700;

      /* Panels */
      panels = [
        {
          x: 0.03, y: 0.09, w: pw, h: ph,
          startLine: 0,  alpha: 0, target: showSide ? 0.85 : 0, scroll: 0,
          hovered: false, hoverAlpha: 0,
          teacherSide: 'right',
          teacher: makeTeacher()
        },
        {
          x: Math.min(0.74, 1 - (pw + 20) / W), y: 0.14, w: pw, h: ph,
          startLine: 7,  alpha: 0, target: showSide ? 0.78 : 0, scroll: 0,
          hovered: false, hoverAlpha: 0,
          teacherSide: 'left',
          teacher: makeTeacher()
        },
        {
          x: Math.min(0.70, 1 - (pw + 20) / W), y: 0.54, w: pw, h: ph,
          startLine: 16, alpha: 0, target: showSide ? 0.72 : 0, scroll: 0,
          hovered: false, hoverAlpha: 0,
          teacherSide: 'left',
          teacher: makeTeacher()
        }
      ];
      setTimeout(function () { panels[0].target = 0.88; }, 300);
      setTimeout(function () { panels[1].target = 0.80; }, 750);
      setTimeout(function () { panels[2].target = 0.75; }, 1200);

      /* Rings */
      rings = [];
      for (var i = 0; i < 5; i++) {
        rings.push({
          r:     55 + i * 52,
          phase: i * (Math.PI * 2 / 5),
          speed: 0.006 - i * 0.0008,
          baseA: 0.07 - i * 0.01
        });
      }

      /* Particles */
      particles = [];
      for (var i = 0; i < 130; i++) {
        particles.push({
          x:    Math.random() * W, y: Math.random() * H,
          r:    0.4 + Math.random() * 1.4,
          vx:   (Math.random() - 0.5) * 0.28,
          vy:   (Math.random() - 0.5) * 0.28,
          gold: Math.random() > 0.5,
          a:    0.08 + Math.random() * 0.35,
          ph:   Math.random() * Math.PI * 2,
          sp:   0.008 + Math.random() * 0.018
        });
      }
    }

    /* ═══════════════════════════════════════════════
       UPDATE TEACHER
    ═══════════════════════════════════════════════ */
    function updateTeacher(t, hovered) {
      t.bobPhase += t.bobSpeed;

      if (hovered) {
        t.writePhase += 0.22;
        t.armTarget   = -0.65 + Math.sin(t.writePhase) * 0.55;
        t.armAngle   += (t.armTarget - t.armAngle) * 0.25;
      } else {
        t.armTimer--;
        if (t.armTimer <= 0) {
          t.armTimer   = 60 + Math.floor(Math.random() * 80);
          t.gestureIdx = (t.gestureIdx + 1) % t.gestures.length;
          t.armTarget  = t.gestures[t.gestureIdx];
        }
        t.armAngle += (t.armTarget - t.armAngle) * 0.045;
      }
    }

    /* ═══════════════════════════════════════════════
       DRAW TEACHER
       px,py = panel top-left; pw,ph = panel size
       side = 'left'|'right'; alpha = panel alpha
    ═══════════════════════════════════════════════ */
    function drawTeacher(t, px, py, pw, ph, side, alpha, hovered) {
      if (alpha < 0.05) return;

      /* Scale figure to panel height */
      var scale   = (ph * 0.72) / 120;
      var margin  = 18 * scale;
      var standX  = (side === 'right')
        ? px + pw + margin + 28 * scale
        : px - margin - 28 * scale;
      var groundY = py + ph * 0.92 + Math.sin(t.bobPhase) * 1.8;

      var bodyCol = hovered
        ? 'rgba(255,215,0,' + alpha + ')'
        : 'rgba(0,229,255,' + alpha + ')';
      var lw = 2 * scale;

      ctx.save();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';

      /* Ambient glow behind figure */
      var gr = ctx.createRadialGradient(
        standX, groundY - 50 * scale, 0,
        standX, groundY - 50 * scale, 55 * scale
      );
      gr.addColorStop(0, hovered
        ? 'rgba(255,215,0,' + (alpha * 0.28) + ')'
        : 'rgba(0,229,255,' + (alpha * 0.22) + ')');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(standX - 55*scale, groundY - 115*scale, 110*scale, 125*scale);

      /* HEAD */
      ctx.beginPath();
      ctx.arc(standX, groundY - 105*scale, 10*scale, 0, Math.PI*2);
      ctx.strokeStyle = bodyCol;
      ctx.lineWidth   = lw;
      ctx.stroke();

      /* Visor */
      ctx.beginPath();
      ctx.moveTo(standX - 7*scale, groundY - 105*scale);
      ctx.lineTo(standX + 7*scale, groundY - 105*scale);
      ctx.strokeStyle = hovered
        ? 'rgba(255,255,100,' + alpha + ')'
        : 'rgba(255,215,0,' + alpha + ')';
      ctx.lineWidth = 1.5*scale;
      ctx.stroke();

      /* TORSO */
      ctx.beginPath();
      ctx.moveTo(standX, groundY - 95*scale);
      ctx.lineTo(standX, groundY - 55*scale);
      ctx.strokeStyle = bodyCol;
      ctx.lineWidth   = lw;
      ctx.stroke();

      /* LEGS */
      ctx.beginPath();
      ctx.moveTo(standX, groundY - 55*scale);
      ctx.lineTo(standX - 13*scale, groundY);
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(standX, groundY - 55*scale);
      ctx.lineTo(standX + 13*scale, groundY);
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw; ctx.stroke();

      /* BACK ARM (relaxed) */
      var backAngle = (side === 'right') ? 1.4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(standX, groundY - 85*scale);
      ctx.lineTo(
        standX + Math.cos(backAngle) * 28*scale,
        groundY - 85*scale + Math.sin(backAngle) * 28*scale
      );
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw; ctx.stroke();

      /* WRITING / POINTER ARM */
      var shoulderX = standX;
      var shoulderY = groundY - 85*scale;
      var dir       = (side === 'right') ? -1 : 1;
      /* Right-side teacher: board is to their LEFT → arm must point left-upward.
         Mirror the gesture angle around the leftward axis (π). */
      var armAngle  = (side === 'right')
        ? -(Math.PI - Math.abs(t.armAngle))
        : t.armAngle * dir;

      /* Upper arm */
      var elbowX = shoulderX + Math.cos(armAngle) * 22*scale;
      var elbowY = shoulderY + Math.sin(armAngle) * 22*scale;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(elbowX, elbowY);
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw; ctx.stroke();

      /* Forearm */
      var foreAngle = armAngle + dir * 0.35;
      var tipX = elbowX + Math.cos(foreAngle) * 22*scale;
      var tipY = elbowY + Math.sin(foreAngle) * 22*scale;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = bodyCol; ctx.lineWidth = lw; ctx.stroke();

      /* Stylus */
      var sx = tipX + Math.cos(foreAngle) * 14*scale;
      var sy = tipY + Math.sin(foreAngle) * 14*scale;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = hovered
        ? 'rgba(255,255,100,' + Math.min(1, alpha + 0.1) + ')'
        : 'rgba(255,215,0,' + Math.min(1, alpha + 0.05) + ')';
      ctx.lineWidth = 1.5*scale; ctx.stroke();

      /* Stylus tip glow dot */
      var dotA = hovered ? 1.0 : 0.6 + 0.4*Math.sin(frame*0.07);
      ctx.beginPath();
      ctx.arc(sx, sy, 4*scale, 0, Math.PI*2);
      ctx.fillStyle = hovered
        ? 'rgba(255,255,100,' + (dotA*alpha) + ')'
        : 'rgba(255,215,0,' + (dotA*alpha) + ')';
      ctx.fill();

      /* Writing sparks on hover */
      if (hovered) {
        for (var s = 0; s < 5; s++) {
          var sa = Math.random() * Math.PI * 2;
          var sr = (3 + Math.random() * 8) * scale;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(sa)*sr, sy + Math.sin(sa)*sr);
          ctx.strokeStyle = 'rgba(255,255,100,' + (Math.random()*0.6*alpha) + ')';
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }

      /* Ground shadow */
      ctx.beginPath();
      ctx.ellipse(standX, groundY + 3, 15*scale, 3*scale, 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,229,255,' + (alpha*0.12) + ')';
      ctx.fill();

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════
       HIT TEST — accounts for parallax offset
    ═══════════════════════════════════════════════ */
    function panelRect(p) {
      return {
        px: p.x * W + (mx - W/2) * 0.018,
        py: p.y * H + (my - H/2) * 0.012
      };
    }

    function isHovered(p) {
      var r = panelRect(p);
      return mx >= r.px && mx <= r.px + p.w &&
             my >= r.py && my <= r.py + p.h;
    }

    /* ═══════════════════════════════════════════════
       DRAW GRID
    ═══════════════════════════════════════════════ */
    function drawGrid() {
      var vx = W/2 + (mx - W/2)*0.03, vy = H*0.94;
      var floorTop = H*0.56, spread = W*0.85;
      var numH = 9, numV = 14;
      ctx.lineWidth = 0.55;
      for (var i = 0; i < numH; i++) {
        var t  = i/(numH-1);
        var y  = floorTop + t*(vy-floorTop);
        var xl = vx - spread*t*0.5, xr = vx + spread*t*0.5;
        ctx.beginPath(); ctx.moveTo(xl,y); ctx.lineTo(xr,y);
        ctx.strokeStyle = 'rgba(0,229,255,'+(t*0.07)+')'; ctx.stroke();
      }
      for (var i = 0; i < numV; i++) {
        var t  = i/(numV-1), ex = vx - spread*0.5 + t*spread;
        ctx.beginPath(); ctx.moveTo(vx,vy); ctx.lineTo(ex,floorTop);
        ctx.strokeStyle = 'rgba(255,215,0,'+(0.035+t*(1-t)*0.07)+')'; ctx.stroke();
      }
    }

    /* ═══════════════════════════════════════════════
       DRAW STREAMS
    ═══════════════════════════════════════════════ */
    var CHARS = '01010110100011NLP{};AI>=<[]ML.py01010011001';
    function drawStreams() {
      ctx.font = '11px "Syne Mono",monospace';
      ctx.textAlign = 'center';
      streams.forEach(function (s) {
        s.timer--;
        if (s.timer <= 0) {
          s.timer = 10 + Math.floor(Math.random()*22);
          s.chars.push({ ch: CHARS[Math.floor(Math.random()*CHARS.length)], y: -8, a: 0.85+Math.random()*0.15 });
        }
        for (var i = s.chars.length-1; i >= 0; i--) {
          var c = s.chars[i];
          c.y += s.speed; c.a -= 0.0035;
          if (c.a <= 0 || c.y > H+10) { s.chars.splice(i,1); continue; }
          ctx.fillStyle = s.gold
            ? 'rgba(255,215,0,'+(i===s.chars.length-1?c.a:c.a*0.38)+')'
            : 'rgba(0,229,255,'+(i===s.chars.length-1?c.a:c.a*0.38)+')';
          ctx.fillText(c.ch, s.x, c.y);
        }
      });
    }

    /* ═══════════════════════════════════════════════
       DRAW SCAN LINE
    ═══════════════════════════════════════════════ */
    function drawScan() {
      scanY += 1.3; if (scanY > H) scanY = 0;
      var g = ctx.createLinearGradient(0,scanY-18,0,scanY+18);
      g.addColorStop(0,'rgba(0,229,255,0)');
      g.addColorStop(0.5,'rgba(0,229,255,0.07)');
      g.addColorStop(1,'rgba(0,229,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0,scanY-18,W,36);
      ctx.beginPath(); ctx.moveTo(0,scanY); ctx.lineTo(W,scanY);
      ctx.strokeStyle='rgba(0,229,255,0.13)'; ctx.lineWidth=1; ctx.stroke();
    }

    /* ═══════════════════════════════════════════════
       DRAW PANEL
    ═══════════════════════════════════════════════ */
    function drawPanel(p) {
      var hovered = isHovered(p);
      p.hoverAlpha += hovered ? 0.08 : -0.05;
      p.hoverAlpha  = Math.max(0, Math.min(1, p.hoverAlpha));

      updateTeacher(p.teacher, hovered);

      p.alpha += (p.target - p.alpha) * 0.028;
      if (p.alpha < 0.015) return;

      var r  = panelRect(p);
      var px = r.px, py = r.py;
      var a  = p.alpha, ha = p.hoverAlpha;

      p.scroll += hovered ? 0.9 : 0.22;

      /* Background */
      ctx.fillStyle = 'rgba(2,12,24,'+(a*0.58+ha*0.2)+')';
      ctx.fillRect(px, py, p.w, p.h);

      /* Border */
      ctx.strokeStyle = hovered
        ? 'rgba(255,215,0,'+(a*0.7+ha*0.3)+')'
        : 'rgba(0,229,255,'+(a*0.55)+')';
      ctx.lineWidth = hovered ? 1.5 : 1;
      ctx.strokeRect(px, py, p.w, p.h);

      /* Outer glow on hover */
      if (ha > 0.05) {
        ctx.shadowColor = 'rgba(255,215,0,'+(ha*0.5)+')';
        ctx.shadowBlur  = 18*ha;
        ctx.strokeRect(px, py, p.w, p.h);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      }

      /* Corner accents */
      var cs = 10;
      ctx.strokeStyle = hovered
        ? 'rgba(255,215,0,'+(a*0.95)+')'
        : 'rgba(255,215,0,'+(a*0.8)+')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px,py+cs); ctx.lineTo(px,py); ctx.lineTo(px+cs,py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+p.w-cs,py); ctx.lineTo(px+p.w,py); ctx.lineTo(px+p.w,py+cs); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px,py+p.h-cs); ctx.lineTo(px,py+p.h); ctx.lineTo(px+cs,py+p.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+p.w-cs,py+p.h); ctx.lineTo(px+p.w,py+p.h); ctx.lineTo(px+p.w,py+p.h-cs); ctx.stroke();

      /* Title bar */
      ctx.fillStyle = hovered
        ? 'rgba(255,215,0,'+(a*0.18)+')'
        : 'rgba(0,229,255,'+(a*0.12)+')';
      ctx.fillRect(px, py, p.w, 22);

      /* Traffic dots */
      ['rgba(255,80,80,.85)','rgba(255,200,0,.85)','rgba(50,220,90,.85)'].forEach(function(c,d){
        ctx.beginPath(); ctx.arc(px+10+d*16, py+11, 4, 0, Math.PI*2);
        ctx.fillStyle = c; ctx.fill();
      });

      /* Filename */
      var fnSize = Math.max(7, Math.round(p.w * 0.032));
      ctx.font = fnSize + 'px "Syne Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = hovered
        ? 'rgba(255,215,0,'+(a*0.9)+')'
        : 'rgba(0,229,255,'+(a*0.7)+')';
      ctx.fillText('fake_review_detector.py', px+p.w/2, py+14);

      /* Live badge on hover */
      if (ha > 0.05) {
        ctx.font='7px "Syne Mono",monospace'; ctx.textAlign='right';
        ctx.fillStyle='rgba(80,255,120,'+(ha*a)+')';
        ctx.fillText('● LIVE', px+p.w-6, py+14);
      }

      /* Scrolling code */
      var codeSize = Math.max(7, Math.round(p.w * 0.033));
      var lineH = codeSize * 1.5, codeTop = py+30;
      var maxL  = Math.floor((p.h-30)/lineH)+1;
      var offset = p.scroll % lineH;
      ctx.textAlign='left'; ctx.font=codeSize+'px "Syne Mono",monospace';

      for (var l = 0; l <= maxL; l++) {
        var li  = (p.startLine+l+Math.floor(p.scroll/lineH)) % CODE.length;
        var lly = codeTop + l*lineH - offset;
        if (lly < py+22 || lly > py+p.h-2) continue;
        var line = CODE[li]; if (!line) continue;

        /* Hover highlight on one line */
        if (hovered && l === 2) {
          ctx.fillStyle='rgba(255,215,0,'+(ha*0.12)+')';
          ctx.fillRect(px, lly-11, p.w, 14);
        }

        var col;
        if      (line.indexOf('#')      === 0)                    col='rgba(100,210,100,'+(a*0.75)+')';
        else if (line.indexOf('def ')   === 0 ||
                 line.indexOf('class ') === 0)                    col='rgba(255,215,0,'  +(a*0.9) +')';
        else if (line.indexOf('from ')  === 0 ||
                 line.indexOf('import') >= 0)                     col='rgba(0,229,255,'  +(a*0.88)+')';
        else if (line.indexOf('return') >= 0)                     col='rgba(255,120,90,' +(a*0.88)+')';
        else if (line.indexOf('if ')    === 0)                    col='rgba(200,140,255,'+(a*0.82)+')';
        else                                                       col='rgba(180,220,255,'+(a*0.8) +')';
        ctx.fillStyle = col;
        ctx.fillText(line.substring(0,40), px+8, lly);
      }

      /* Fade mask */
      var fade = ctx.createLinearGradient(px, py+22, px, py+p.h);
      fade.addColorStop(0,   'rgba(2,12,24,'+(a*0.65)+')');
      fade.addColorStop(0.1, 'rgba(0,0,0,0)');
      fade.addColorStop(0.88,'rgba(0,0,0,0)');
      fade.addColorStop(1,   'rgba(2,12,24,'+(a*0.65)+')');
      ctx.fillStyle = fade;
      ctx.fillRect(px, py+22, p.w, p.h-22);

      /* Teacher figure */
      drawTeacher(p.teacher, px, py, p.w, p.h, p.teacherSide, a*0.85, hovered);
    }

    /* ═══════════════════════════════════════════════
       DRAW RINGS
    ═══════════════════════════════════════════════ */
    function drawRings() {
      var cx = W/2+(mx-W/2)*0.025, cy = H/2+(my-H/2)*0.018;
      rings.forEach(function(rng,idx) {
        rng.phase += rng.speed;
        var pulse = 0.5+0.5*Math.sin(rng.phase);
        var a = rng.baseA*(0.5+0.5*pulse), rad = rng.r*(1+pulse*0.03);
        ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2);
        ctx.strokeStyle=(idx%2===0)?'rgba(255,215,0,'+a+')':'rgba(0,229,255,'+a+')';
        ctx.lineWidth=0.7+pulse*0.5; ctx.stroke();
        for(var d=0;d<5+idx*3;d++){
          var angle=(d/(5+idx*3))*Math.PI*2+rng.phase*0.4;
          ctx.beginPath(); ctx.arc(cx+Math.cos(angle)*rad, cy+Math.sin(angle)*rad, 1.4, 0, Math.PI*2);
          ctx.fillStyle=(idx%2===0)?'rgba(255,215,0,'+(a*2.2)+')':'rgba(0,229,255,'+(a*2.2)+')';
          ctx.fill();
        }
      });
    }

    /* ═══════════════════════════════════════════════
       DRAW PARTICLES
    ═══════════════════════════════════════════════ */
    function drawParticles() {
      particles.forEach(function(p) {
        p.ph+=p.sp; p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        var a=p.a*(0.5+0.5*Math.sin(p.ph));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.gold?'rgba(255,215,0,'+a+')':'rgba(0,229,255,'+a+')';
        ctx.fill();
      });
    }

    /* ═══════════════════════════════════════════════
       MAIN LOOP
    ═══════════════════════════════════════════════ */
    function draw() {
      requestAnimationFrame(draw);
      frame++;
      ctx.fillStyle='rgba(4,4,10,0.88)';
      ctx.fillRect(0,0,W,H);
      drawGrid();
      drawStreams();
      drawScan();
      for(var i=0;i<panels.length;i++) drawPanel(panels[i]);
      drawRings();
      drawParticles();
    }

  } catch(e) { /* silent fail */ }
}());