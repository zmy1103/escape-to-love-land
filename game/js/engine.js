/**
 * 最小 RPG 框架：场景切换 / 任务 / 背包 / 对话 / 存档
 * 新关卡优先写 GAME_DATA，再在 render 里加专用场景。
 */
(() => {
  const SAVE_KEY = "loveland-quest-v1";
  const D = () => window.GAME_DATA;

  const defaultState = () => ({
    playerName: "小小宾客",
    scene: "title",
    locationId: null,
    coins: 0,
    items: [],
    flags: {},
    questDone: {},
    gardenDone: {},
    chorusReady: false,
    seenLetter: false,
  });

  const Game = {
    state: defaultState(),

    save() {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    },
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) this.state = { ...defaultState(), ...JSON.parse(raw) };
      } catch (_) {
        this.state = defaultState();
      }
    },
    reset() {
      localStorage.removeItem(SAVE_KEY);
      this.state = defaultState();
      this.render();
    },

    currentQuest() {
      return D().quests.find((q) => !this.state.questDone[q.id]) || null;
    },
    complete(id, extraFlags = {}) {
      this.state.questDone[id] = true;
      Object.assign(this.state.flags, extraFlags);
      this.save();
    },
    hasItem(id) {
      return this.state.items.includes(id);
    },
    grant(id, nCoins = 0) {
      if (id && !this.hasItem(id)) this.state.items.push(id);
      if (nCoins) this.state.coins += nCoins;
      this.save();
    },

    go(scene, extra = {}) {
      this.state.scene = scene;
      if (extra.locationId) this.state.locationId = extra.locationId;
      this.save();
      this.render();
    },

    el(html) {
      const t = document.createElement("template");
      t.innerHTML = html.trim();
      return t.content;
    },

    hud() {
      const q = this.currentQuest();
      const items = this.state.items
        .map((id) => D().items[id]?.icon || "")
        .join(" ");
      return `
        <header class="hud">
          <div class="hud-brand">
            <span class="hud-mark">⛵</span>
            <div>
              <strong>Love Land</strong>
              <em>${this.state.playerName}</em>
            </div>
          </div>
          <div class="hud-quest">
            <span>当前任务</span>
            <b>${q ? q.title : "全部完成"}</b>
            <small>${q ? q.hint : "可以回去补支线，或重置重玩"}</small>
          </div>
          <div class="hud-stats">
            <span class="chip">🪙 ${this.state.coins}</span>
            <span class="chip items">${items || "背包空空"}</span>
            <button type="button" class="link" data-act="reset">重置</button>
          </div>
        </header>`;
    },

    bind(root) {
      root.querySelectorAll("[data-go]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const loc = btn.getAttribute("data-loc");
          this.go(btn.getAttribute("data-go"), loc ? { locationId: loc } : {});
        });
      });
      root.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => this.handle(btn.dataset.act, btn));
      });
    },

    handle(act, btn) {
      const q = this.currentQuest();
      switch (act) {
        case "reset":
          if (confirm("清空进度，从飞机重新开始？")) this.reset();
          break;
        case "start":
          this.go("plane");
          break;
        case "continue":
          this.load();
          if (this.state.scene === "title") this.go("map");
          else this.render();
          break;
        case "open-boat":
          this.complete("q_plane");
          this.go("letter");
          break;
        case "accept-letter":
          this.state.seenLetter = true;
          this.complete("q_letter");
          this.grant("letter");
          this.go("map");
          break;
        case "arrive":
          this.complete("q_arrive");
          this.go("location", { locationId: "checkin" });
          break;
        case "talk":
          this.go("talk");
          break;
        case "finish-talk":
          this.finishTalk();
          break;
        case "chorus":
          this.state.chorusReady = true;
          this.grant("chorus");
          this.complete("q_chorus");
          this.go("location", { locationId: "afterparty" });
          break;
        case "play-garden": {
          const gid = btn.dataset.gid;
          if (!this.state.gardenDone[gid]) {
            const g = D().gardenGames.find((x) => x.id === gid);
            this.state.gardenDone[gid] = true;
            this.grant(null, g.coins);
          }
          if (this.state.coins >= 3 && q?.id === "q_explore") {
            this.complete("q_explore");
          }
          this.save();
          this.render();
          break;
        }
        default:
          break;
      }
    },

    finishTalk() {
      const q = this.currentQuest();
      if (!q) {
        this.go("map");
        return;
      }
      if (q.id === "q_checkin") {
        this.grant("bingo");
        this.complete("q_checkin");
        this.go("location", { locationId: "ice" });
        return;
      }
      if (q.id === "q_ice") {
        this.grant(null, 1);
        this.complete("q_ice");
        this.go("location", { locationId: "buffet" });
        return;
      }
      if (q.id === "q_buffet") {
        this.complete("q_buffet");
        this.go("location", { locationId: "party" });
        return;
      }
      if (q.id === "q_party") {
        this.complete("q_party");
        this.go("location", { locationId: "party" });
        return;
      }
      if (q.id === "q_moon") {
        this.complete("q_moon");
        this.go("map");
        return;
      }
      if (q.id === "q_gate") {
        this.grant("ticket");
        this.grant("gift");
        this.complete("q_gate");
        this.go("location", { locationId: "games" });
        return;
      }
      if (q.id === "q_ceremony") {
        this.complete("q_ceremony");
        this.go("location", { locationId: "banquet" });
        return;
      }
      if (q.id === "q_banquet") {
        this.complete("q_banquet");
        this.go("ending");
        return;
      }
      this.go("map");
    },

    render() {
      const app = document.getElementById("app");
      const scene = this.state.scene;
      const hideHud = ["title", "plane", "letter", "ending"].includes(scene);
      app.innerHTML = "";
      if (!hideHud) app.appendChild(this.el(this.hud()));
      const stage = document.createElement("main");
      stage.className = `stage scene-${scene}`;
      stage.appendChild(this.el(this.sceneHtml(scene)));
      app.appendChild(stage);
      this.bind(app);
      if (scene === "talk") this.playTalk(stage);
    },

    sceneHtml(scene) {
      switch (scene) {
        case "title":
          return this.titleHtml();
        case "plane":
          return this.planeHtml();
        case "letter":
          return this.letterHtml();
        case "map":
          return this.mapHtml();
        case "location":
          return this.locationHtml();
        case "talk":
          return `<section class="talk-scene"><div class="talk-bg"></div><div class="talk-box" id="talk-box"></div></section>`;
        case "ending":
          return this.endingHtml();
        default:
          return `<p>未知场景</p>`;
      }
    },

    titleHtml() {
      const hasSave = !!localStorage.getItem(SAVE_KEY);
      return `
        <section class="title-scene">
          <div class="fog"></div>
          <p class="kicker">The Escape Plan to Love</p>
          <h1>逃向 Love Land</h1>
          <p class="lede">模拟一位宾客，坐飞机赴约，拆开纸船，再把 9.25 与 9.26 闯完。</p>
          <p class="meta">${D().meta.couple}  ·  ${D().meta.venue}</p>
          <div class="title-actions">
            <button type="button" class="btn primary" data-act="start">坐上飞机</button>
            ${hasSave ? `<button type="button" class="btn ghost" data-act="continue">继续进度</button>` : ""}
          </div>
          <p class="footnote">框架版：主线可跑通，Party 小游戏与部分对白标了【待补充】</p>
        </section>`;
    },

    planeHtml() {
      return `
        <section class="plane-scene">
          <div class="sky">
            <div class="cloud c1"></div>
            <div class="cloud c2"></div>
            <div class="cloud c3"></div>
          </div>
          <div class="cabin">
            <div class="window">
              <div class="wing"></div>
            </div>
            <div class="seat">
              <div class="kid" aria-hidden="true">
                <div class="hair"></div>
                <div class="face"></div>
                <div class="body"></div>
              </div>
              <p class="caption">小小宾客靠着舷窗。云层下面，成都在等一场婚礼。</p>
            </div>
          </div>
          <div class="plane-ui">
            <p>空乘把一艘折好的纸船放在小桌板上。</p>
            <button type="button" class="btn primary" data-act="open-boat">那是给我的吗？</button>
          </div>
        </section>`;
    },

    letterHtml() {
      const L = D().letter;
      return `
        <section class="letter-scene">
          <div class="boat" aria-hidden="true">⛵</div>
          <article class="letter">
            <p class="letter-hint">${L.hint}</p>
            <h2>${L.greeting}</h2>
            ${L.body.map((line) => (line ? `<p>${line}</p>` : "<br/>")).join("")}
            <footer>${L.sign}</footer>
          </article>
          <button type="button" class="btn primary" data-act="accept-letter">领取任务：前往右岸天鹅湖</button>
        </section>`;
    },

    mapHtml() {
      const q = this.currentQuest();
      const day1Open = this.state.questDone.q_letter;
      const day2Open = this.state.questDone.q_moon;
      const locBtn = (id) => {
        const loc = D().locations[id];
        const active = q && q.location === id;
        const locked =
          (loc.day === 1 && !day1Open) ||
          (loc.day === 2 && !day2Open) ||
          (loc.day === 2 && !this.state.questDone.q_moon);
        return `
          <button type="button" class="loc-card ${active ? "active" : ""} ${locked ? "locked" : ""}"
            data-go="location" data-loc="${id}" ${locked ? "disabled" : ""}>
            <span class="ico">${loc.icon || "📍"}</span>
            <span>
              <b>${loc.name}</b>
              <small>${loc.blurb}</small>
            </span>
            ${active ? `<em>去这里</em>` : ""}
          </button>`;
      };
      return `
        <section class="map-scene">
          <div class="map-hero" style="background-image:url('assets/venue.jpg')">
            <div class="map-hero-text">
              <p>指定地点 · 成都温江 右岸天鹅湖民宿</p>
              <h2>请到达任务标记处</h2>
              <p>点地点 → 触发任务 → 和 NPC 说话。两关分开：先 9.25 Party，再 9.26 游园会与仪式。</p>
              ${
                q?.id === "q_arrive"
                  ? `<button type="button" class="btn primary" data-act="arrive">我已到达草坪</button>`
                  : ""
              }
            </div>
          </div>
          <div class="days">
            <div>
              <h3>第一关 · 9.25 Before Party</h3>
              <div class="loc-grid">
                ${["checkin", "ice", "buffet", "party", "afterparty"].map(locBtn).join("")}
              </div>
            </div>
            <div class="${day2Open ? "" : "is-locked"}">
              <h3>第二关 · 9.26 游园会 & 仪式 ${day2Open ? "" : "· 先过完第一关"}</h3>
              <div class="loc-grid">
                ${["gardenGate", "photobooth", "games", "diy", "dessert", "ceremony", "banquet"].map(locBtn).join("")}
              </div>
            </div>
          </div>
        </section>`;
    },

    locationHtml() {
      const id = this.state.locationId;
      const loc = D().locations[id];
      const q = this.currentQuest();
      const here = q && q.location === id;
      const npc = q?.npc ? D().npcs[q.npc] : null;
      const bg = loc.photo ? `style="background-image:url('${loc.photo}')"` : "";

      let extra = "";
      if (id === "party") extra = this.partyPanel(here && q.id === "q_chorus");
      if (["games", "photobooth", "diy"].includes(id)) extra = this.gardenPanel(id);
      if (id === "dessert") extra = `<p class="todo-note">甜品台文案与兑换处规则【待补充】</p>`;

      const cta = (() => {
        if (!here) return `<button type="button" class="btn ghost" data-go="map">回地图</button>`;
        if (q.type === "talk") {
          return `<button type="button" class="btn primary" data-act="talk">和${npc.name}说话</button>`;
        }
        if (q.id === "q_chorus") {
          return `<button type="button" class="btn primary" data-act="chorus">加入合唱队 · 干杯</button>`;
        }
        if (q.id === "q_explore") {
          return `<p class="hint">再收集 ${Math.max(0, 3 - this.state.coins)} 枚游戏币。或回地图换地点。</p>
            <button type="button" class="btn ghost" data-go="map">回地图</button>`;
        }
        return `<button type="button" class="btn ghost" data-go="map">回地图</button>`;
      })();

      return `
        <section class="loc-scene">
          <div class="loc-banner ${loc.photo ? "has-photo" : ""}" ${bg}>
            <button type="button" class="back" data-go="map">← 地图</button>
            <div>
              <p class="kicker">${here ? "任务地点" : "可探索"}</p>
              <h2>${loc.name}</h2>
              <p>${loc.blurb}</p>
            </div>
          </div>
          <div class="loc-body">
            ${
              here && npc
                ? `<aside class="npc-card">
                    <span class="npc-av">${npc.avatar}</span>
                    <div><b>${npc.name}</b><small>${npc.title}</small><p>${npc.note}</p></div>
                  </aside>`
                : `<p class="muted">当前任务不在这里。打开右上任务提示，或回地图看「去这里」。</p>`
            }
            ${extra}
            <div class="cta-row">${cta}</div>
          </div>
        </section>`;
    },

    partyPanel(showChorus) {
      const rows = D()
        .partyFlow.map(
          (p) =>
            `<li class="${p.todo ? "todo" : ""}"><b>${p.t}</b><span>${p.d || "【待补充】"}</span></li>`
        )
        .join("");
      return `
        <div class="panel">
          <h4>Party 流程清单</h4>
          <ol class="flow">${rows}</ol>
          ${showChorus ? `<p class="lyric">会不会 有一天 时间真的能倒退 / 退回你的我的 回不去的 悠悠的岁月</p>` : ""}
        </div>`;
    },

    gardenPanel(locId) {
      const games = D().gardenGames.filter((g) => g.loc === locId);
      if (!games.length) return "";
      return `
        <div class="panel">
          <h4>可参与（框架：点击即完成）</h4>
          <div class="game-list">
            ${games
              .map((g) => {
                const done = this.state.gardenDone[g.id];
                return `<button type="button" class="game-btn ${done ? "done" : ""}" data-act="play-garden" data-gid="${g.id}" ${done ? "disabled" : ""}>
                  <b>${g.name}</b>
                  <small>${g.rule}</small>
                  <em>${done ? "已完成" : `+${g.coins} 币`}</em>
                </button>`;
              })
              .join("")}
          </div>
        </div>`;
    },

    playTalk(stage) {
      const q = this.currentQuest();
      const key = q ? `${q.npc}_${q.id}` : null;
      const lines = (key && D().dialogues[key]) || [
        { who: "system", text: "【待补充对白】" },
      ];
      const box = stage.querySelector("#talk-box");
      let i = 0;
      const show = () => {
        const line = lines[i];
        const npc = D().npcs[line.who];
        const name =
          line.who === "player"
            ? this.state.playerName
            : line.who === "system"
              ? "任务更新"
              : npc?.name || line.who;
        const av =
          line.who === "player" ? "🧳" : line.who === "system" ? "✦" : npc?.avatar || "💬";
        box.innerHTML = `
          <div class="bubble ${line.who}">
            <span class="av">${av}</span>
            <div>
              <b>${name}</b>
              <p>${line.text}</p>
            </div>
          </div>
          <button type="button" class="btn primary" id="talk-next">${i < lines.length - 1 ? "继续" : "完成交流"}</button>`;
        box.querySelector("#talk-next").onclick = () => {
          if (i < lines.length - 1) {
            i += 1;
            show();
          } else {
            this.handle("finish-talk");
          }
        };
      };
      show();
    },

    endingHtml() {
      return `
        <section class="ending-scene">
          <p class="kicker">The Escape Plan to Love</p>
          <h1>你已抵达 Love Land</h1>
          <p>两关主线跑通了。接下来可以把真实朋友做成 NPC，把小游戏做成可玩关卡，把信里没写完的话补进去。</p>
          <p class="meta">${D().meta.couple}  ·  ${D().meta.dates}</p>
          <div class="title-actions">
            <button type="button" class="btn primary" data-go="map">回到场地</button>
            <button type="button" class="btn ghost" data-act="reset">从头再来</button>
          </div>
        </section>`;
    },
  };

  window.Game = Game;
  document.addEventListener("DOMContentLoaded", () => {
    Game.load();
    if (!localStorage.getItem(SAVE_KEY)) Game.state.scene = "title";
    Game.render();
  });
})();
