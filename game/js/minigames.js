let cleanup = () => {};

export function stopMini() {
  cleanup();
  cleanup = () => {};
}

function $(id) {
  return document.getElementById(id);
}

function setPanel(kind) {
  const panel = $("mini-panel");
  panel.className = "dice-panel mini-panel" + (kind ? ` is-${kind}` : "");
}

export function openMini(gameId, { done, finish, grantItem }) {
  stopMini();
  const field = $("mini-playfield");
  $("mini-result").textContent = "";
  $("mini-play").hidden = true;
  field.innerHTML = "";
  field.className = "mini-playfield";
  const data = (window.GAME_DATA?.gardenGames || []).find((x) => x.id === gameId) || {
    name: gameId,
    rule: "",
  };
  $("mini-title").textContent = data.name;

  const games = { ring, mahjong, badminton, beads, sachet, kids };
  const run = games[gameId];
  if (run) run({ field, done, finish, grantItem });
  else {
    setPanel("simple");
    $("mini-text").textContent = (data.rule || "动手做一份带走。") + " 参加即得 1 币。";
    $("mini-play").hidden = false;
    $("mini-play").onclick = () => finish(gameId, false);
  }
  $("game-overlay").hidden = false;
}

function ring({ field, finish }) {
  setPanel("ring");
  $("mini-text").textContent = "三枚藤圈。点你想套的瓶子，圈会飞出去。套中任意一个即获胜。";
  field.innerHTML = `
    <div class="ring-stage">
      <div class="ring-sky"></div>
      <div class="ring-grass"></div>
      <button type="button" class="peg peg-a" data-odds="0.42" aria-label="葡萄酒瓶">
        <span class="bottle green"></span><i>酒</i>
      </button>
      <button type="button" class="peg peg-b" data-odds="0.58" aria-label="花瓶">
        <span class="vase"></span><i>花</i>
      </button>
      <button type="button" class="peg peg-c" data-odds="0.36" aria-label="陶罐">
        <span class="bottle clay"></span><i>陶</i>
      </button>
      <div class="fly-ring" id="fly-ring"></div>
    </div>
    <div class="ring-stock" id="ring-stock"><span></span><span></span><span></span></div>`;
  let throws = 0;
  let busy = false;
  const ringEl = field.querySelector("#fly-ring");
  const stock = [...field.querySelectorAll("#ring-stock span")];
  field.querySelectorAll(".peg").forEach((peg) => {
    peg.onclick = () => {
      if (busy || throws >= 3) return;
      busy = true;
      throws += 1;
      if (stock[3 - throws]) stock[3 - throws].classList.add("gone");
      const rect = field.querySelector(".ring-stage").getBoundingClientRect();
      const p = peg.getBoundingClientRect();
      ringEl.classList.add("show");
      ringEl.style.left = "50%";
      ringEl.style.bottom = "8px";
      ringEl.style.opacity = "1";
      requestAnimationFrame(() => {
        ringEl.style.left = `${p.left + p.width / 2 - rect.left}px`;
        ringEl.style.bottom = `${rect.bottom - p.top - 12}px`;
      });
      const hit = Math.random() < Number(peg.dataset.odds);
      setTimeout(() => {
        if (hit) {
          peg.classList.add("ringed");
          $("mini-result").textContent = "圈稳稳套住了。阳光里一阵掌声。";
          finish("ring", true);
        } else {
          ringEl.classList.add("miss");
          $("mini-result").textContent =
            throws >= 3 ? "三圈都擦边而过。参与奖也算一份勇气。" : `擦过瓶颈。还剩 ${3 - throws} 圈。`;
          if (throws >= 3) finish("ring", false);
        }
        setTimeout(() => {
          ringEl.classList.remove("show", "miss");
          ringEl.style.opacity = "0";
          busy = false;
        }, 380);
      }, 520);
    };
  });
}

function mahjong({ field, finish }) {
  setPanel("mahjong");
  $("mini-text").textContent = "谁是雀神：在牌河里摸出 东、发、中。点错会洗乱，18 秒内集齐即胜。";
  const pool = ["东", "南", "西", "北", "中", "发", "白", "春", "梅", "兰", "菊", "竹"];
  const need = ["东", "发", "中"];
  const got = new Set();
  let left = 18;
  const deal = () => {
    const tiles = [...pool].sort(() => Math.random() - 0.5);
    field.querySelector(".mj-board").innerHTML = tiles
      .map((t) => {
        const kind = t === "中" ? "red" : t === "发" ? "green" : t === "白" ? "blank" : "wind";
        return `<button type="button" class="mj-tile ${kind}" data-face="${t}"><b>${t}</b></button>`;
      })
      .join("");
    bind();
  };
  field.innerHTML = `
    <div class="mj-need">要：<span>东</span><span>发</span><span>中</span></div>
    <div class="mj-board"></div>
    <div class="mj-clock" id="mj-clock">18</div>`;
  const clock = field.querySelector("#mj-clock");
  const tick = setInterval(() => {
    left -= 1;
    clock.textContent = String(left);
    if (left <= 0) {
      clearInterval(tick);
      $("mini-result").textContent = "时间到。牌河还在响，你也算入局了。";
      finish("mahjong", false);
    }
  }, 1000);
  cleanup = () => clearInterval(tick);
  function bind() {
    field.querySelectorAll(".mj-tile").forEach((b) => {
      if (got.has(b.dataset.face)) b.classList.add("caught");
      b.onclick = () => {
        const face = b.dataset.face;
        if (got.has(face)) return;
        if (need.includes(face)) {
          got.add(face);
          b.classList.add("caught");
          field.querySelectorAll(".mj-need span").forEach((s) => {
            if (s.textContent === face) s.classList.add("on");
          });
          $("mini-result").textContent =
            got.size === 3 ? "三张齐了。今夜你就是雀神。" : `摸到「${face}」，还差 ${3 - got.size} 张。`;
          if (got.size === 3) {
            clearInterval(tick);
            finish("mahjong", true);
          }
        } else {
          b.classList.add("wrong");
          $("mini-result").textContent = `「${face}」不是指定牌，牌河重新洗过。`;
          setTimeout(deal, 280);
        }
      };
    });
  }
  deal();
}

function badminton({ field, finish }) {
  setPanel("badminton");
  $("mini-text").textContent = "球落到金色击球带时点击画面。接住 5 次获胜，漏 3 次仍算参与。";
  field.innerHTML = `
    <div class="court" id="court">
      <div class="court-sun"></div>
      <div class="court-net"></div>
      <div class="shuttle" id="shuttle">🏸</div>
      <div class="hit-band"></div>
    </div>
    <div class="court-hud"><span id="bd-hit">接住 0/5</span><span id="bd-miss">漏接 0/3</span></div>`;
  const court = field.querySelector("#court");
  const shuttle = field.querySelector("#shuttle");
  let hits = 0;
  let misses = 0;
  let y = 8;
  let v = 1.6;
  let x = 50;
  let vx = 0.35;
  let live = true;
  let waiting = false;
  const loop = () => {
    if (!live) return;
    x += vx;
    if (x > 88 || x < 12) vx *= -1;
    y += v;
    v += 0.045;
    if (y > 86) {
      y = 86;
      if (!waiting) {
        waiting = true;
        misses += 1;
        $("bd-miss").textContent = `漏接 ${misses}/3`;
        $("mini-result").textContent = "球擦着草地走了。";
        if (misses >= 3) {
          live = false;
          finish("badminton", false);
          return;
        }
        setTimeout(reset, 400);
      }
    }
    shuttle.style.left = x + "%";
    shuttle.style.top = y + "%";
    raf = requestAnimationFrame(loop);
  };
  let raf = requestAnimationFrame(loop);
  function reset() {
    y = 8;
    v = 1.35 + Math.random() * 0.4;
    x = 20 + Math.random() * 60;
    vx = (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.25);
    waiting = false;
  }
  court.onclick = () => {
    if (!live || waiting) return;
    if (y >= 62 && y <= 84) {
      hits += 1;
      $("bd-hit").textContent = `接住 ${hits}/5`;
      $("mini-result").textContent = "清脆一声。羽毛在阳光里停了一下。";
      waiting = true;
      if (hits >= 5) {
        live = false;
        finish("badminton", true);
        return;
      }
      setTimeout(reset, 280);
    } else {
      $("mini-result").textContent = "太早或太晚。等它进入金色带子。";
    }
  };
  cleanup = () => {
    live = false;
    cancelAnimationFrame(raf);
  };
}

function beads({ field, finish, grantItem }) {
  setPanel("beads");
  $("mini-text").textContent = "从托盘里选珠子，穿成一条属于你的手串。至少 6 颗即可收下。";
  const colors = [
    ["#c4a35a", "金"],
    ["#7d8b6a", "sage"],
    ["#e8c9c9", "粉"],
    ["#f4efe6", "米"],
    ["#8a6238", "木"],
    ["#6b7eb5", "雾蓝"],
  ];
  field.innerHTML = `
    <div class="bead-wire" id="bead-wire"></div>
    <div class="bead-tray">
      ${colors.map(([c, n], i) => `<button type="button" class="bead" data-i="${i}" style="--c:${c}" title="${n}"></button>`).join("")}
    </div>
    <button type="button" id="bead-done" class="craft-done" disabled>系上绳子，带走</button>`;
  const wire = field.querySelector("#bead-wire");
  const picked = [];
  field.querySelectorAll(".bead").forEach((b) => {
    b.onclick = () => {
      if (picked.length >= 10) return;
      const i = Number(b.dataset.i);
      picked.push(colors[i][0]);
      const d = document.createElement("span");
      d.className = "bead on-wire";
      d.style.setProperty("--c", colors[i][0]);
      wire.appendChild(d);
      field.querySelector("#bead-done").disabled = picked.length < 6;
      $("mini-result").textContent = `已穿 ${picked.length} 颗。`;
    };
  });
  field.querySelector("#bead-done").onclick = () => {
    grantItem("bracelet");
    $("mini-result").textContent = "手串在腕上轻轻一响。";
    finish("beads", false);
  };
}

function sachet({ field, finish, grantItem }) {
  setPanel("sachet");
  $("mini-text").textContent = "往香囊里放三样：雏菊、桂花、薄荷、玫瑰、柑橘或艾草。";
  const herbs = [
    ["雏菊", "#f7f3e8"],
    ["桂花", "#e2c36b"],
    ["薄荷", "#7d8b6a"],
    ["玫瑰", "#e8c9c9"],
    ["柑橘", "#e6b35c"],
    ["艾草", "#5b7a45"],
  ];
  field.innerHTML = `
    <div class="pouch" id="pouch"><div class="pouch-fill" id="pouch-fill"></div><em>香囊</em></div>
    <div class="herb-row">
      ${herbs.map(([n, c]) => `<button type="button" class="herb" data-name="${n}" style="--c:${c}">${n}</button>`).join("")}
    </div>`;
  const picked = [];
  field.querySelectorAll(".herb").forEach((b) => {
    b.onclick = () => {
      if (picked.includes(b.dataset.name) || picked.length >= 3) return;
      picked.push(b.dataset.name);
      b.classList.add("in");
      const fill = field.querySelector("#pouch-fill");
      fill.style.height = `${picked.length * 28}%`;
      fill.style.background = b.style.getPropertyValue("--c");
      $("mini-result").textContent = picked.join(" · ");
      if (picked.length === 3) {
        grantItem("sachet");
        $("mini-result").textContent = `${picked.join("、")}，扎口。香气会跟着你一整天。`;
        finish("sachet", false);
      }
    };
  });
}

function kids({ field, finish, grantItem }) {
  setPanel("kids");
  $("mini-text").textContent = "小熊和兔子在毯子上跳。12 秒内点到 8 次，它们会把气球送给你。";
  field.innerHTML = `
    <div class="yard" id="yard">
      <div class="yard-blanket"></div>
      <button type="button" class="pal bear" id="pal-a">🧸</button>
      <button type="button" class="pal bunny" id="pal-b">🐰</button>
    </div>
    <div class="yard-hud"><span id="kid-n">0/8</span> · <span id="kid-t">12</span>s</div>`;
  let n = 0;
  let t = 12;
  const yard = field.querySelector("#yard");
  const move = (el) => {
    el.style.left = 8 + Math.random() * 78 + "%";
    el.style.top = 18 + Math.random() * 58 + "%";
  };
  ["pal-a", "pal-b"].forEach((id) => {
    const el = field.querySelector("#" + id);
    move(el);
    el.onclick = (e) => {
      e.stopPropagation();
      n += 1;
      $("kid-n").textContent = `${n}/8`;
      move(el);
      el.classList.add("pop");
      setTimeout(() => el.classList.remove("pop"), 200);
      if (n >= 8) {
        clearInterval(tick);
        grantItem("balloon");
        $("mini-result").textContent = "气球拴在你手腕上，小熊鞠躬了。";
        finish("kids", false);
      }
    };
  });
  const hop = setInterval(() => {
    move(field.querySelector("#pal-a"));
    if (Math.random() > 0.4) move(field.querySelector("#pal-b"));
  }, 900);
  const tick = setInterval(() => {
    t -= 1;
    $("kid-t").textContent = String(t);
    if (t <= 0) {
      clearInterval(tick);
      clearInterval(hop);
      grantItem("balloon");
      $("mini-result").textContent = n >= 8 ? "刚好！" : "它们跑累了，仍把气球塞给你。";
      finish("kids", false);
    }
  }, 1000);
  cleanup = () => {
    clearInterval(tick);
    clearInterval(hop);
  };
  yard.onclick = () => {
    $("mini-result").textContent = "点到小熊或兔子身上。";
  };
}

export function openBoothStudio({ onShot }) {
  stopMini();
  setPanel("booth");
  $("mini-title").textContent = "Photo Booth";
  $("mini-text").textContent = "小钟和阿旭已经在框里等你。选一个姿势，倒数后合影。";
  $("mini-play").hidden = true;
  $("mini-result").textContent = "";
  const field = $("mini-playfield");
  field.innerHTML = `
    <div class="booth-stage" id="booth-stage">
      <div class="booth-frame"></div>
      <div class="booth-people">
        <span class="bp you">小钟</span>
        <span class="bp friend">阿旭</span>
      </div>
      <div class="booth-count" id="booth-count"></div>
    </div>
    <div class="booth-poses">
      <button type="button" data-pose="wave">举手</button>
      <button type="button" data-pose="heart">比心</button>
      <button type="button" data-pose="quiet">安静</button>
    </div>`;
  $("game-overlay").hidden = false;
  field.querySelectorAll(".booth-poses button").forEach((b) => {
    b.onclick = () => {
      field.querySelector(".booth-people").dataset.pose = b.dataset.pose;
      let n = 3;
      const el = field.querySelector("#booth-count");
      el.textContent = "3";
      const tick = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(tick);
          el.textContent = "";
          $("game-overlay").hidden = true;
          onShot(b.dataset.pose);
        } else el.textContent = String(n);
      }, 700);
      cleanup = () => clearInterval(tick);
    };
  });
}

export function paintPolaroid(pose = "wave") {
  const c = document.createElement("canvas");
  c.width = 400;
  c.height = 500;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f7f3e8";
  ctx.fillRect(0, 0, 400, 500);
  const sky = ctx.createLinearGradient(0, 24, 0, 360);
  sky.addColorStop(0, "#d7e8f4");
  sky.addColorStop(1, "#f3ead4");
  ctx.fillStyle = sky;
  ctx.fillRect(24, 24, 352, 380);
  ctx.fillStyle = "#8aa56c";
  ctx.fillRect(24, 268, 352, 136);
  ctx.fillStyle = "#7a4e2e";
  ctx.beginPath();
  ctx.moveTo(148, 268);
  ctx.lineTo(252, 268);
  ctx.lineTo(240, 232);
  ctx.lineTo(160, 232);
  ctx.fill();
  ctx.fillStyle = "#f4efe6";
  ctx.beginPath();
  ctx.moveTo(200, 108);
  ctx.lineTo(244, 232);
  ctx.lineTo(200, 232);
  ctx.fill();
  const drawGuest = (x, shirt, arm) => {
    ctx.fillStyle = shirt;
    ctx.fillRect(x - 16, 300, 32, 42);
    ctx.fillStyle = "#f0d2b6";
    ctx.beginPath();
    ctx.arc(x, 288, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b2a1d";
    ctx.beginPath();
    ctx.ellipse(x, 280, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shirt;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, 312);
    if (arm === "wave") {
      ctx.lineTo(x + 22, 292);
    } else if (arm === "heart") {
      ctx.lineTo(x + 10, 318);
      ctx.lineTo(x + 18, 308);
    } else {
      ctx.lineTo(x + 14, 332);
    }
    ctx.stroke();
  };
  drawGuest(168, "#5d6f8a", pose);
  drawGuest(228, "#c45c7a", pose);
  ctx.fillStyle = "#4c5840";
  ctx.font = "20px 'Noto Serif SC', serif";
  ctx.textAlign = "center";
  const label = pose === "heart" ? "比心 · Love Land" : pose === "quiet" ? "安静 · Love Land" : "举手 · Love Land";
  ctx.fillText(label, 200, 456);
  return c.toDataURL("image/png");
}
