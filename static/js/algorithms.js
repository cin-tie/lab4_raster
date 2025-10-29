(() => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const algSelect = document.getElementById("algorithm");
  const scaleInput = document.getElementById("scale");
  const clearBtn = document.getElementById("clearBtn");
  const gridToggle = document.getElementById("gridToggle");
  const dotSizeInput = document.getElementById("dotSize");
  dotSizeInput.value = scaleInput.value;
  const info = document.getElementById("info");
  const coords = document.getElementById("coords");
  const timings = document.getElementById("timings");
  const container = document.querySelector(".canvas-container");

  let gridOn = true;
  let scale = +scaleInput.value;
  let dotSize = +dotSizeInput.value;
  let first = null;
  let segmentCount = 0;
  let pointLabels = [];

  const algColors = {
    step: "#e74c3c",
    dda: "#27ae60",
    bresenham: "#29b4b9ff",
    bresenham_circle: "#8e44ad"
  };

  function drawGrid() {
    if (!gridOn) return;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#ccc";
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.restore();
  }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    first = null;
    segmentCount = 0;
    info.textContent = "Выберите две точки для рисования.";
    timings.innerHTML = "";
    pointLabels.forEach(lbl => lbl.remove());
    pointLabels = [];
  }

  function plot(gx, gy, color = "#000") {
    ctx.fillStyle = color;
    ctx.fillRect(gx * scale, gy * scale, dotSize, dotSize);
  }

  function toGrid(x, y) {
    return { gx: Math.round(x / scale), gy: Math.round(y / scale) };
  }

  function addLabel(x, y, text, color) {
    const lbl = document.createElement("div");
    lbl.className = "point-label";
    lbl.style.left = `${x * scale + 260}px`;
    lbl.style.top = `${y * scale - 12}px`;
    lbl.style.color = color;
    lbl.textContent = text;
    container.appendChild(lbl);
    pointLabels.push(lbl);
  }

  function drawStep(x0, y0, x1, y1, color) {
    const t0 = performance.now();
    const dx = x1 - x0, dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const x = x0 + (dx * i) / steps;
      const y = y0 + (dy * i) / steps;
      plot(Math.round(x), Math.round(y), color);
    }
    return performance.now() - t0;
  }

  function drawDDA(x0, y0, x1, y1, color) {
    const t0 = performance.now();
    const dx = x1 - x0, dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xInc = dx / steps, yInc = dy / steps;
    let x = x0, y = y0;
    for (let i = 0; i <= steps; i++) {
      plot(Math.round(x), Math.round(y), color);
      x += xInc; y += yInc;
    }
    return performance.now() - t0;
  }

  function drawBresenhamLine(x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
        plot(x0, y0, color);
        if(x0 === x1 && y0 === y1) break;
        
        let e2 = 2 * err;
        if(e2 > -dy) {
        err -= dy;
        x0 += sx;
        }
        if(e2 < dx) {
        err += dx;
        y0 += sy;
        }
    }
    }

  function drawBresenhamCircle(cx, cy, r, color) {
    const t0 = performance.now();
    let x = 0, y = r, d = 3 - 2 * r;
    const plot8 = (x, y) => {
      plot(cx + x, cy + y, color);
      plot(cx - x, cy + y, color);
      plot(cx + x, cy - y, color);
      plot(cx - x, cy - y, color);
      plot(cx + y, cy + x, color);
      plot(cx - y, cy + x, color);
      plot(cx + y, cy - x, color);
      plot(cx - y, cy - x, color);
    };
    while (y >= x) {
      plot8(x, y);
      if (d < 0) d += 4 * x + 6;
      else { d += 4 * (x - y) + 10; y--; }
      x++;
    }
    return performance.now() - t0;
  }

  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    const g = toGrid(e.clientX - r.left, e.clientY - r.top);
    coords.textContent = `Координаты: ${g.gx}, ${g.gy}`;
  });

  canvas.addEventListener("click", e => {
    const r = canvas.getBoundingClientRect();
    const g = toGrid(e.clientX - r.left, e.clientY - r.top);
    const alg = algSelect.value;
    const color = algColors[alg] || "#000";

    if (!first) {
      first = g;
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(g.gx * scale, g.gy * scale, 4, 0, Math.PI * 2);
      ctx.fill();

      addLabel(g.gx, g.gy, `Начало ${segmentCount + 1}`, "red");
      info.textContent = `Первая точка (${g.gx}, ${g.gy})`;
    } else {
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(g.gx * scale, g.gy * scale, 4, 0, Math.PI * 2);
      ctx.fill();

      segmentCount++;
      addLabel(g.gx, g.gy, `Конец ${segmentCount} `, "green");

      let time = 0;
      if (alg === "step") time = drawStep(first.gx, first.gy, g.gx, g.gy, color);
      if (alg === "dda") time = drawDDA(first.gx, first.gy, g.gx, g.gy, color);
      if (alg === "bresenham") time = drawBresenhamLine(first.gx, first.gy, g.gx, g.gy, color);
      if (alg === "bresenham_circle") {
        const dx = g.gx - first.gx, dy = g.gy - first.gy;
        const r = Math.round(Math.sqrt(dx*dx + dy*dy));
        time = drawBresenhamCircle(first.gx, first.gy, r, color);
      }

      timings.innerHTML = `<p>${alg.toUpperCase()} — ${time.toFixed(3)} мс</p>` + timings.innerHTML;
      info.textContent = `Отрезок ${segmentCount} нарисован (${alg}). Время: ${time.toFixed(3)} мс`;
      first = null;
    }
  });

  clearBtn.addEventListener("click", clear);
  gridToggle.addEventListener("click", () => {
    gridOn = !gridOn;
    gridToggle.textContent = gridOn ? "Сетка: Вкл" : "Сетка: Выкл";
    clear();
  });
  scaleInput.addEventListener("input", () => { scale = +scaleInput.value; dotSize = scale; dotSizeInput.value = dotSize; clear(); });
  dotSizeInput.addEventListener("input", () => { 
    if(dotSizeInput.value >= scale)
        dotSize = +dotSizeInput.value; 
    else
        dotSizeInput.value = scale;
    });

  clear();
})();
