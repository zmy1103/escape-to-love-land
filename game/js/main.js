import * as THREE from "three";
import {
  createAirport,
  createRide,
  createResort,
  createBanquet,
  createHotelMorning,
  createGarden,
  createDiningHall,
  createKid,
  blocked,
} from "./worlds.js?v=tang1";
import { openMini as runMini, stopMini, openBoothStudio, paintPolaroid } from "./minigames.js?v=replay1";

const D = () => window.GAME_DATA;
const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
const root = new THREE.Scene();
root.background = new THREE.Color(0xa8bdd0);
const player = createKid({ name: "你" });
root.add(player);

const keys = Object.create(null);
let camYaw = Math.PI;
let camPitch = 0.18;
let dragging = false;
let stickX = 0;
let stickY = 0;
let lastLookX = 0;
let lastLookY = 0;
let world = null;
let worldGroup = null;
let riding = false;
let rideT = 0;
let lockedMove = false;
let animT = 0;
let started = false;
let uiOpen = false;
let letterStash = false;
let near = null;
let talkLines = [];
let talkI = 0;
let talkDone = null;
let talkChoices = null;
let diceDenom = 50;
let partyIndex = 0;
let partyPhase = "idle";
let warmupReady = false;
let dancing = false;
let audioCtx = null;
let audioNodes = [];
let musicEl = null;
let musicTrack = null;
const gardenDone = {};

const quests = {
  letter: { title: "拆开纸船", hint: "座位扶手上有一艘纸船，按 E", place: "航班舱内" },
  door: { title: "下飞机", hint: "沿着过道走到发光的舱门，按 E", place: "航班舱内" },
  taxi: { title: "坐出租车", hint: "走下舷梯，去停在路边的黄色出租车", place: "双流机场到达" },
  ride: { title: "前往温江", hint: "坐稳，车正开向右岸天鹅湖民宿", place: "出租车上" },
  desk: { title: "办理入住", hint: "走进大堂，去前台办理入住", place: "右岸天鹅湖民宿" },
  awen: { title: "找阿文和王老师", hint: "16:30 破冰。去草坪找这一对 NPC 领 Bingo", place: "婚礼草坪" },
  bingo: { title: "填写 Bingo Card", hint: "和宾客交谈后会自动写入名字。想快体验：打开背包里的 Bingo Card，点「一键全填并保存」", place: "婚礼草坪" },
  redeem: { title: "换取 50 筹码", hint: "Bingo 已写满，回去找阿文和王老师", place: "婚礼草坪" },
  lawnTasks: { title: "合影与寻宝", hint: "找阿摄阿录拍一张，再去椅子下面找回散落筹码", place: "婚礼草坪" },
  dice: { title: "去猜大小", hint: "去钟意赌坊押一轮即可。有筹码可以一直赌，直到口袋空了", place: "婚礼草坪" },
  dinner: { title: "前往月光晚宴", hint: "去草坪尽头的「月光晚宴入口」，按 E 进入长桌区", place: "婚礼草坪" },
  ushers: { title: "找芊一和珂满", hint: "就餐区门口领欢迎卡和 Party 流程", place: "月光晚宴" },
  party: { title: "找主持人开场", hint: "去白幕前找主持人，听今晚怎么走", place: "月光晚宴" },
  warmup: { title: "落座看暖场", hint: "去长桌空位坐下，观看暖场视频", place: "月光晚宴" },
  opendance: { title: "开场舞", hint: "去台前找二姐。可以上台跳，也可以在台下看", place: "月光晚宴" },
  partygames: { title: "Party 游戏", hint: "回主持人那里，一项一项过，最后合唱干杯", place: "月光晚宴" },
  night: { title: "回酒店休息", hint: "第一关结束了", place: "右岸天鹅湖" },
  breakfast: { title: "用早餐", hint: "桌上有早餐。筹码已按张数换成游戏币", place: "酒店房间" },
  day2check: { title: "领取门票与伴手礼", hint: "找阿文和王老师完成签到，领 Love Land 入场券和专属伴手礼", place: "游园会签到处" },
  gardenDiy: { title: "先去 DIY 区", hint: "串珠、香囊、儿童游乐场都能玩，任玩一项即可过关", place: "DIY 区" },
  gardenPhoto: { title: "去 Photo Booth 合影", hint: "DIY 完成。去拍照区和小钟阿旭合影", place: "拍照区" },
  gardenGames: { title: "去游戏区玩一玩", hint: "合影完成。套圈、雀神、羽毛球都能玩，任玩一项即可过关", place: "游戏区" },
  gardenPrize: { title: "回签到处兑奖", hint: "游戏完成。找阿文和王老师用游戏币换奖品", place: "游园会签到处" },
  gardenVow: { title: "领取问誓卡", hint: "兑奖完成。再找阿文和王老师领取问誓卡，婚礼上一起问他们愿不愿意", place: "游园会签到处" },
  gardenDessert: { title: "甜品区", hint: "去 05 甜品台尝一口", place: "甜品区" },
  ceremony: { title: "入座开始婚礼", hint: "举起问誓卡入座。集体问誓后，听他们对大家说的话", place: "仪式草坪" },
  vows: { title: "婚礼与告白", hint: "小钟阿旭上台。听主持流程，再听他们对大家说的话", place: "仪式草坪" },
  lunch: { title: "圆桌午宴", hint: "仪式结束。去室内餐厅入席吃饭", place: "草坪" },
  diningBye: { title: "告别", hint: "已经入席。去 8 号结婚桌，和小钟阿旭告别", place: "室内圆桌" },
  done: { title: "两关都过完了", hint: "可以重置重玩，或在场地里闲逛", place: "Love Land" },
};

const flags = {
  letter: false,
  door: false,
  taxi: false,
  checkedIn: false,
  kit: false,
  bingoReward: false,
  photo: false,
  hiddenChip: false,
  seated: false,
  partyBriefed: false,
  warmupSeen: false,
  danceDone: false,
  dancedOnStage: false,
  partyDone: false,
  breakfast: false,
  satCeremony: false,
  vows: false,
  lunch: false,
  ateLunch: false,
  satDining: false,
  convertedChips: false,
  dicePlayed: false,
  day2Checkin: false,
  booth: false,
  dessert: false,
  prized: false,
  vowCard: false,
};
const inventory = [];
const chips = { 50: 0, 100: 0, 500: 0, 1000: 0 };
let coins = 0;
const bingo = {};

const hudTitle = document.getElementById("quest-title");
const hudHint = document.getElementById("quest-hint");
const hudPlace = document.getElementById("place");
const promptEl = document.getElementById("prompt");
const talkEl = document.getElementById("talk");
const talkWho = document.getElementById("talk-who");
const talkText = document.getElementById("talk-text");
const talkChoicesEl = document.getElementById("talk-choices");
const talkNext = document.getElementById("talk-next");
const fadeEl = document.getElementById("fade");

function uiBusy() {
  return uiOpen || talkEl.hidden === false;
}

function playedGardenGames() {
  return !!(gardenDone.ring || gardenDone.mahjong || gardenDone.badminton);
}
function diyDone() {
  return !!(gardenDone.beads || gardenDone.sachet || gardenDone.kids);
}
function isTouchMode() {
  return document.body.classList.contains("touch");
}
function actLabel(text) {
  return isTouchMode() ? text.replace(/按 E/g, "点互动") : text;
}

function currentQuestId() {
  if (world?.name === "dining") {
    if (!flags.satDining) return "diningSit";
    if (!flags.ateLunch) return "diningEat";
    if (!flags.lunch) return "diningBye";
    return "done";
  }
  if (!flags.letter) return "letter";
  if (!flags.door) return "door";
  if (!flags.taxi) return "taxi";
  if (world?.name === "ride") return "ride";
  if (!flags.checkedIn) return "desk";
  if (!flags.kit) return "awen";
  if (!flags.bingoReward && !bingoFull()) return "bingo";
  if (!flags.bingoReward) return "redeem";
  if (!flags.photo || !flags.hiddenChip) return "lawnTasks";
  if (!flags.dicePlayed) return "dice";
  if (world?.name === "resort") return "dinner";
  if (world?.name === "banquet" && !flags.seated) return "ushers";
  if (world?.name === "banquet" && !flags.partyBriefed) return "party";
  if (world?.name === "banquet" && !flags.warmupSeen) return "warmup";
  if (world?.name === "banquet" && !flags.danceDone) return "opendance";
  if (world?.name === "banquet" && !flags.partyDone) return "partygames";
  if (world?.name === "hotel" && !flags.breakfast) return "breakfast";
  if (world?.name === "hotel") return "day2check";
  if (!flags.day2Checkin) return "day2check";
  if (!diyDone()) return "gardenDiy";
  if (!flags.booth) return "gardenPhoto";
  if (!playedGardenGames()) return "gardenGames";
  if (!flags.prized) return "gardenPrize";
  if (!flags.vowCard) return "gardenVow";
  if (!flags.satCeremony) return "ceremony";
  if (!flags.vows) return "vows";
  if (!flags.ateLunch) return "lunch";
  if (!flags.lunch) return "diningBye";
  return "done";
}

function setQuestFromFlags() {
  const id = currentQuestId();
  const q = quests[id];
  hudTitle.textContent = q.title;
  hudHint.textContent = q.hint;
  hudPlace.textContent = q.place;
  refreshAwenMarker();
  refreshLawnMarkers();
}

function chipValue() {
  return 50 * chips[50] + 100 * chips[100] + 500 * chips[500] + 1000 * chips[1000];
}

function refreshMoney() {
  document.getElementById("chip-value").textContent = String(chipValue());
  document.getElementById("coin-value").textContent = String(coins);
  document.getElementById("hud-money").title =
    `筹码 ${chips[50]}×50  ${chips[100]}×100  ${chips[500]}×500  ${chips[1000]}×1000`;
}

function grantItem(id) {
  if (!inventory.includes(id)) inventory.push(id);
  renderBag();
}

function renderBag() {
  const box = document.getElementById("bag-list");
  if (!inventory.length) {
    box.innerHTML = "<p class='muted'>还是空的</p>";
    return;
  }
  box.innerHTML = inventory
    .map((id) => {
      const it = D().items[id] || { name: id, icon: "•" };
      const click = ["bingo", "letter", "partyflow", "vowcard", "seatmap", "photo", "boothSnap"].includes(id)
        ? `data-open="${id}"`
        : "";
      return `<button type="button" class="bag-item" ${click}>${it.icon} ${it.name}</button>`;
    })
    .join("");
  box.querySelectorAll("[data-open]").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.open === "bingo") openBingo();
      if (b.dataset.open === "letter") openLetter(false);
      if (b.dataset.open === "partyflow") {
        const rows = (D().partyFlow || [])
          .map((x) => `<li><b>${x.t}</b>${x.d ? ` <span class="muted">${x.d}</span>` : ""}</li>`)
          .join("");
        openBagDoc("Party 流程", `<ol class="flow-list">${rows}</ol>`);
      }
      if (b.dataset.open === "vowcard") {
        openBagDoc(
          "问誓卡",
          "<p>请在仪式上举起这张卡，和全体亲友一起问：</p><p><b>小钟、阿旭，你们是否愿意，把余生过成一场认真的逃跑计划？</b></p><p>你们是否愿意，在树下彼此成为自由而靠近的人？</p>"
        );
      }
      if (b.dataset.open === "seatmap") openSeatMap();
      if (b.dataset.open === "photo" || b.dataset.open === "boothSnap") {
        if (document.getElementById("polaroid-img").src) {
          document.getElementById("polaroid").hidden = false;
          uiOpen = true;
          lockedMove = true;
        }
      }
    };
  });
}

function bingoFull() {
  return D().bingoCells.every((c) => (bingo[c.id] || "").trim());
}

function bingoCount() {
  return D().bingoCells.filter((c) => (bingo[c.id] || "").trim()).length;
}

function fillBingo(cellId, name) {
  if (!cellId) return false;
  if ((bingo[cellId] || "").trim()) return false;
  bingo[cellId] = name;
  if (bingoFull() && flags.kit && !flags.bingoReward) setQuestFromFlags();
  return true;
}

function refreshAwenMarker() {
  if (!world || world.name !== "resort") return;
  const awen = world.interactives.find((i) => i.id === "awen");
  if (!awen) return;
  const show = flags.checkedIn && (!flags.kit || (bingoFull() && !flags.bingoReward));
  awen.locked = !show;
  if (awen.marker) awen.marker.visible = show;
}

function refreshLawnMarkers() {
  if (!world) return;
  const hide = world.interactives.find((i) => i.id === "hiddenChip");
  const gate = world.interactives.find((i) => i.id === "dinnerGate");
  const host = world.interactives.find((i) => i.id === "partyHost");
  const lunch = world.interactives.find((i) => i.id === "lunch");
  const toG = world.interactives.find((i) => i.id === "toGarden");
  const zy = world.interactives.find((i) => i.id === "zhongyi");
  if (hide) {
    const show = flags.bingoReward && !flags.hiddenChip;
    hide.locked = !show;
    if (hide.marker) hide.marker.visible = show;
  }
  if (gate) {
    const show = flags.photo && flags.hiddenChip && flags.bingoReward && flags.dicePlayed;
    gate.locked = !show;
    if (gate.marker) gate.marker.visible = show;
  }
  if (zy) {
    const show = flags.bingoReward && flags.photo && flags.hiddenChip && !flags.dicePlayed;
    zy.locked = false;
    if (zy.marker) zy.marker.visible = show;
  }
  if (host) {
    const show = (flags.seated && !flags.partyBriefed) || (flags.danceDone && !flags.partyDone);
    host.locked = !show;
    if (host.marker) host.marker.visible = show;
  }
  const partySeat = world.interactives.find((i) => i.id === "partySeat");
  if (partySeat) {
    partySeat.locked = !flags.partyBriefed || !!flags.warmupSeen;
    if (partySeat.marker) partySeat.marker.visible = flags.partyBriefed && !flags.warmupSeen;
  }
  const ej = world.interactives.find((i) => i.id === "erjie");
  if (ej) {
    ej.locked = !flags.warmupSeen || !!flags.danceDone;
    if (ej.marker) ej.marker.visible = flags.warmupSeen && !flags.danceDone;
  }
  if (toG) {
    toG.locked = !flags.breakfast;
    if (toG.marker) toG.marker.visible = flags.breakfast;
  }
  const check = world.interactives.find((i) => i.id === "day2check");
  const prize = world.interactives.find((i) => i.id === "prize");
  const seat = world.interactives.find((i) => i.id === "ceremonySeat");
  if (check) {
    const needVow = flags.prized && !flags.vowCard;
    check.locked = flags.day2Checkin && !needVow;
    check.label = needVow ? "按 E 领取问誓卡" : "按 E 找阿文和王老师签到领券";
    if (check.marker) check.marker.visible = !flags.day2Checkin || needVow;
  }
  if (prize) {
    const show = flags.day2Checkin && diyDone() && flags.booth && playedGardenGames() && !flags.prized;
    prize.locked = !show;
    if (prize.marker) prize.marker.visible = show;
  }
  if (seat) {
    const ready = flags.vowCard && !flags.satCeremony;
    seat.locked = !ready;
    if (seat.marker) seat.marker.visible = ready;
  }
  world.interactives.forEach((it) => {
    if (it.id === "booth") {
      const show = flags.day2Checkin && diyDone() && !flags.booth;
      it.locked = !show;
      if (it.marker) it.marker.visible = show;
    }
    if (it.id === "game" && it.kind === "diy") {
      const open = flags.day2Checkin;
      it.locked = !open;
      if (it.marker) it.marker.visible = open;
    }
    if (it.id === "game" && it.kind === "play") {
      const open = !!flags.booth;
      it.locked = !open;
      if (it.marker) it.marker.visible = open;
    }
  });
  if (lunch) {
    lunch.locked = !flags.vows || !!flags.ateLunch;
    if (lunch.marker) lunch.marker.visible = flags.vows && !flags.ateLunch;
  }
  world.interactives.forEach((it) => {
    if (it.id === "diningSeat") {
      it.locked = !!flags.ateLunch;
      it.label = flags.satDining ? "按 E 开吃" : `按 E 在${it.title}入席`;
    }
    if (it.id === "diningBye") {
      const show = flags.ateLunch && !flags.lunch;
      it.locked = !show;
      if (it.marker) it.marker.visible = show;
    }
  });
}

function fade(ms = 420) {
  return new Promise((res) => {
    fadeEl.classList.add("on");
    setTimeout(() => {
      fadeEl.classList.remove("on");
      res();
    }, ms);
  });
}

function clearWorld() {
  if (worldGroup) {
    root.remove(worldGroup);
    worldGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
    });
  }
}

function mount(w, bg) {
  clearWorld();
  world = w;
  worldGroup = w.scene;
  root.add(worldGroup);
  root.background = new THREE.Color(bg);
  root.fog = new THREE.Fog(w.fog || bg, 24, 72);
  player.position.copy(w.spawn);
  player.rotation.y = w.spawnYaw || 0;
  camYaw = (w.spawnYaw || 0) + Math.PI;
  riding = !!w.cinematic;
  rideT = 0;
  lockedMove = !!w.cinematic;
  player.visible = !w.cinematic;
}

function restoreAirport() {
  const letter = world.interactives.find((i) => i.id === "letter");
  const door = world.interactives.find((i) => i.id === "door");
  const taxi = world.interactives.find((i) => i.id === "taxi");
  if (flags.letter) {
    if (letter) {
      letter.locked = true;
      if (letter.marker) letter.marker.visible = false;
    }
    door.locked = false;
    door.marker.visible = true;
  }
  if (flags.door) {
    door.marker.visible = false;
    door.locked = true;
    if (flags.taxi) {
      taxi.locked = true;
      taxi.marker.visible = false;
    } else {
      taxi.locked = false;
      taxi.marker.visible = true;
    }
  }
}

async function goAirport() {
  mount(createAirport(), 0xa8bdd0);
  restoreAirport();
  setQuestFromFlags();
  ensureDay1Music();
}

async function goRide() {
  await fade();
  mount(createRide(), 0xc5d4b8);
  setQuestFromFlags();
  ensureDay1Music();
}

async function goResort() {
  await fade();
  mount(createResort(), 0xd5ddc6);
  const desk = world.interactives.find((i) => i.id === "desk");
  if (flags.checkedIn && desk) {
    desk.locked = true;
    if (desk.marker) desk.marker.visible = false;
  }
  refreshAwenMarker();
  refreshLawnMarkers();
  setQuestFromFlags();
  ensureDay1Music();
}

async function goBanquet() {
  await fade();
  mount(createBanquet(), 0x1a2230);
  refreshLawnMarkers();
  setQuestFromFlags();
  ensureDay1Music();
}

async function goHotel() {
  await fade();
  if (!flags.convertedChips) {
    coins += chips[50] + chips[100] + chips[500] + chips[1000];
    chips[50] = chips[100] = chips[500] = chips[1000] = 0;
    flags.convertedChips = true;
    refreshMoney();
  }
  mount(createHotelMorning(), 0xefe8d8);
  refreshLawnMarkers();
  setQuestFromFlags();
  ensureDay2Music();
}

async function goGarden() {
  await fade();
  mount(createGarden(), 0xd5ddc6);
  refreshLawnMarkers();
  setQuestFromFlags();
  ensureDay2Music();
}

async function goDining() {
  await fade();
  const loader = new THREE.TextureLoader();
  const load = (url) =>
    new Promise((resolve) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        },
        undefined,
        () => resolve(null)
      );
    });
  const [room, seats] = await Promise.all([load("assets/dining-room.jpg"), load("assets/seats.png")]);
  mount(createDiningHall(room, seats), 0xefe4d2);
  grantItem("seatmap");
  flags.satDining = true;
  flags.ateLunch = true;
  const seat = world.interactives.find((i) => i.id === "diningSeat");
  if (seat) {
    player.position.set(seat.x, 0, seat.z);
    player.rotation.y = Math.atan2(seat.tableX - seat.x, seat.tableZ - seat.z);
  }
  refreshLawnMarkers();
  setQuestFromFlags();
  startMusic("farewell");
}

function openBagDoc(title, html) {
  stopMini();
  const panel = document.getElementById("mini-panel");
  panel.className = "dice-panel mini-panel";
  document.getElementById("mini-title").textContent = title;
  document.getElementById("mini-text").innerHTML = html;
  document.getElementById("mini-playfield").innerHTML = "";
  document.getElementById("mini-playfield").className = "mini-playfield";
  document.getElementById("mini-result").textContent = "";
  document.getElementById("mini-play").hidden = true;
  document.getElementById("game-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
}

function openSeatMap() {
  openBagDoc(
    "座位图",
    "<p>领取对应颜色手环 · 仪式结束后按桌号入席</p><img src='assets/seats.png' alt='座位图' class='seat-map'>"
  );
}

function chipCount() {
  return chips[50] + chips[100] + chips[500] + chips[1000];
}

function openTalk(key, onDone) {
  talkLines = D().dialogues[key] || [{ who: "system", text: "……" }];
  talkI = 0;
  talkDone = onDone;
  talkChoices = null;
  lockedMove = true;
  talkEl.hidden = false;
  showTalk();
}

function showTalk() {
  const line = talkLines[talkI];
  const npc = D().npcs[line.who];
  const guest = D().guests.find((g) => g.id === line.who);
  talkWho.textContent =
    line.who === "player"
      ? "小小宾客"
      : line.who === "system"
        ? "任务更新"
      : line.who === "crowd"
        ? "全体宾客"
        : npc?.name || guest?.name || line.who;
  talkText.textContent = line.text;
  talkChoicesEl.innerHTML = "";
  const last = talkI >= talkLines.length - 1;
  if (last && talkChoices) {
    talkNext.hidden = true;
    talkChoices.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.ask;
      b.onclick = () => {
        if (typeof c.onPick === "function") {
          talkChoices = null;
          talkEl.hidden = true;
          talkDone = null;
          c.onPick();
          return;
        }
        pickGuestQ(c);
      };
      talkChoicesEl.appendChild(b);
    });
  } else {
    talkNext.hidden = false;
    talkNext.textContent = last ? "好的" : "继续";
  }
}

function advanceTalk() {
  if (talkI < talkLines.length - 1) {
    talkI += 1;
    showTalk();
    return;
  }
  if (talkChoices) return;
  closeTalk();
}

function closeTalk() {
  talkEl.hidden = true;
  talkChoices = null;
  lockedMove = riding || uiOpen;
  const done = talkDone;
  talkDone = null;
  done?.();
}

function pickGuestQ(q) {
  const g = D().guests.find((x) => x.id === q.gid);
  let extra = q.yes;
  let filled = false;
  if (q.bingo && flags.kit) {
    filled = fillBingo(q.bingo, g.name);
    extra += filled
      ? `（已把「${g.name}」写进 Bingo：${D().bingoCells.find((c) => c.id === q.bingo).prompt}）`
      : "（这一格已经写过了。）";
  } else if (q.bingo && !flags.kit) {
    extra += "（先去阿文那儿领 Bingo Card，才能写名字。）";
  }
  talkChoices = null;
  talkLines = [{ who: q.gid, text: extra }];
  if (filled && bingoFull()) {
    talkLines.push({ who: "system", text: "Bingo 写满了。回去找阿文和王老师，换 50 筹码。" });
  }
  talkI = 0;
  showTalk();
  talkDone = () => setQuestFromFlags();
}

function talkGuest(g) {
  talkLines = [{ who: g.id, text: g.hello }];
  talkI = 0;
  talkDone = null;
  talkChoices = g.questions.map((q) => ({ ...q, gid: g.id }));
  lockedMove = true;
  talkEl.hidden = false;
  showTalk();
}

function stashLetter() {
  const el = document.getElementById("letter-overlay");
  if (el.hidden) return false;
  el.hidden = true;
  uiOpen = false;
  lockedMove = riding;
  if (letterStash && !flags.letter) {
    flags.letter = true;
    grantItem("letter");
    const letter = world?.interactives.find((i) => i.id === "letter");
    const door = world?.interactives.find((i) => i.id === "door");
    if (letter) {
      letter.locked = true;
      if (letter.marker) letter.marker.visible = false;
    }
    if (door) {
      door.locked = false;
      if (door.marker) door.marker.visible = true;
    }
    setQuestFromFlags();
  }
  letterStash = false;
  return true;
}

function openLetter(grant = true) {
  letterStash = grant;
  const L = D().letter;
  document.getElementById("letter-hint").textContent = L.hint;
  document.getElementById("letter-greet").textContent = L.greeting;
  document.getElementById("letter-body").innerHTML = L.body
    .map((line) => (line ? `<p>${line}</p>` : "<br/>"))
    .join("");
  document.getElementById("letter-sign").textContent = L.sign;
  document.getElementById("letter-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
  document.getElementById("letter-ok").textContent = grant
    ? isTouchMode()
      ? "收进背包"
      : "收进背包，去下飞机"
    : "放回背包";
  document.getElementById("letter-ok").onclick = stashLetter;
}

function fillAllBingo() {
  D().guests.forEach((g) => {
    (g.questions || []).forEach((q) => {
      if (q.bingo) bingo[q.bingo] = g.name;
    });
    (g.tags || []).forEach((tag) => {
      if (!bingo[tag]) bingo[tag] = g.name;
    });
  });
  document.querySelectorAll("#bingo-grid input").forEach((inp) => {
    inp.value = bingo[inp.dataset.cell] || "";
  });
  saveBingo();
}

function openBingo() {
  const grid = document.getElementById("bingo-grid");
  grid.innerHTML = D()
    .bingoCells.map(
      (c) =>
        `<input data-cell="${c.id}" maxlength="8" size="6" placeholder="名字" value="${bingo[c.id] || ""}" />`
    )
    .join("");
  document.getElementById("bingo-progress").textContent = `${bingoCount()}/16 格`;
  document.getElementById("bingo-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
  document.querySelectorAll("#bingo-grid input").forEach((inp) => {
    inp.addEventListener("input", saveBingo);
  });
}

function saveBingo() {
  document.querySelectorAll("#bingo-grid input").forEach((inp) => {
    bingo[inp.dataset.cell] = inp.value.trim();
  });
  document.getElementById("bingo-progress").textContent = `${bingoCount()}/16 格`;
  setQuestFromFlags();
}

function closeBingo() {
  saveBingo();
  document.getElementById("bingo-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
}

function openHelp() {
  const h = D().currencyHelp;
  document.getElementById("help-title").textContent = h.title;
  document.getElementById("help-body").innerHTML = h.body.map((p) => `<p>${p}</p>`).join("");
  const img = document.getElementById("help-img");
  if (h.image) {
    img.src = h.image;
    img.classList.add("show");
  }
  document.getElementById("help-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
}

function openDice() {
  const box = document.getElementById("dice-denoms");
  const owned = [50, 100, 500, 1000].filter((d) => chips[d] > 0);
  if (!owned.length) {
    box.innerHTML = "口袋空了。写满 Bingo 找阿文换筹码，或去凳子下面找散落的，再来继续赌。";
    document.getElementById("bet-small").disabled = true;
    document.getElementById("bet-big").disabled = true;
  } else {
    if (!owned.includes(diceDenom)) diceDenom = owned[0];
    box.innerHTML = owned
      .map(
        (d) =>
          `<button type="button" class="denom ${d === diceDenom ? "on" : ""}" data-d="${d}">${d}（${chips[d]}）</button>`
      )
      .join("");
    box.querySelectorAll(".denom").forEach((b) => {
      b.onclick = () => {
        diceDenom = Number(b.dataset.d);
        openDice();
      };
    });
    document.getElementById("bet-small").disabled = false;
    document.getElementById("bet-big").disabled = false;
  }
  document.getElementById("dice-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
}

function rollDice(big) {
  if (chips[diceDenom] <= 0) return;
  chips[diceDenom] -= 1;
  const n = 1 + Math.floor(Math.random() * 6);
  document.getElementById("dice-face").textContent = String(n);
  const isBig = n >= 4;
  const win = big ? isBig : !isBig;
  if (win) {
    chips[diceDenom] += 2;
    document.getElementById("dice-result").textContent = `${n} 是${isBig ? "大" : "小"}。你赢了，收回押注并再得一枚 ${diceDenom}。`;
  } else {
    document.getElementById("dice-result").textContent = `${n} 是${isBig ? "大" : "小"}。押错了，这枚 ${diceDenom} 归钟意。`;
  }
  refreshMoney();
  flags.dicePlayed = true;
  setQuestFromFlags();
  if (chipCount() <= 0) {
    document.getElementById("dice-result").textContent += " 口袋空了，这桌先到这儿。";
  }
  openDice();
}

function burstFireworks() {
  const box = document.getElementById("fireworks");
  box.hidden = false;
  box.innerHTML = "";
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("div");
    s.className = "fw-spark";
    s.style.left = 40 + Math.random() * 20 + "%";
    s.style.top = 30 + Math.random() * 20 + "%";
    s.style.setProperty("--x", (Math.random() * 240 - 120) + "px");
    s.style.setProperty("--y", (Math.random() * 180 - 160) + "px");
    s.style.background = ["#ffe08a", "#ff8a8a", "#c9e8ff", "#f7c6e6"][i % 4];
    box.appendChild(s);
  }
  setTimeout(() => {
    box.hidden = true;
    box.innerHTML = "";
  }, 1000);
}

function startMusic(track = "day1") {
  if (musicTrack === track && musicEl) {
    musicEl.play().catch(() => {});
    return;
  }
  stopMusic();
  const files = {
    day1: "brightest-star.mp3",
    day2: "chengaiying.mp3",
    cheers: "cheers.mp3",
    dance: "brightest-star.mp3",
    farewell: "cixing.mp3",
  };
  const file = files[track] || "chengaiying.mp3";
  const skip = track === "cheers" ? 3 : 0;
  musicTrack = track;
  try {
    musicEl = new Audio(`assets/${file}`);
    musicEl.loop = true;
    musicEl.volume =
      track === "farewell" ? 0.48 : track === "day1" || track === "day2" || track === "dance" ? 0.126 : 0.55;
    const jumpIn = () => {
      if (skip && musicEl && musicEl.currentTime < skip) musicEl.currentTime = skip;
    };
    if (skip) {
      musicEl.addEventListener("loadedmetadata", jumpIn);
      musicEl.addEventListener("timeupdate", jumpIn);
    }
    musicEl.play().then(jumpIn).catch(() => {});
  } catch (_) {}
}

function ensureDay1Music() {
  if (musicTrack === "cheers") return;
  startMusic("day1");
}

function ensureDay2Music() {
  if (musicTrack === "farewell") return;
  startMusic("day2");
}

function stopMusic() {
  musicTrack = null;
  if (musicEl) {
    try {
      musicEl.pause();
      musicEl.removeAttribute("src");
      musicEl.load();
    } catch (_) {}
    musicEl = null;
  }
  audioNodes.forEach((n) => {
    try {
      n.stop?.();
      n.disconnect?.();
    } catch (_) {}
  });
  audioNodes = [];
  dancing = false;
}

function stopWarmupVideo() {
  const v = document.getElementById("party-video");
  if (!v) return;
  v.pause();
  v.removeAttribute("src");
  v.load();
}

function playWarmup() {
  partyPhase = "warmup";
  warmupReady = false;
  document.getElementById("party-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
  document.getElementById("party-title").textContent = "暖场视频";
  document.getElementById("party-text").textContent = "请看大幕。";
  const stage = document.getElementById("party-stage");
  stage.className = "video";
  stage.style.backgroundImage = "";
  stage.style.background = "#10141a";
  stage.innerHTML = `<video id="party-video" autoplay playsinline muted></video>`;
  const v = document.getElementById("party-video");
  const clipDone = () => {
    if (warmupReady) return;
    warmupReady = true;
    burstFireworks();
    document.getElementById("party-text").textContent = "短片结束了。";
    document.getElementById("party-next").textContent = "去找二姐看开场舞";
  };
  v.src = "assets/warmup.mp4";
  v.onended = clipDone;
  v.onerror = clipDone;
  document.getElementById("party-next").textContent = "跳过短片";
}

function closeWarmup() {
  stopWarmupVideo();
  flags.warmupSeen = true;
  partyPhase = "idle";
  const stage = document.getElementById("party-stage");
  stage.className = "";
  stage.innerHTML = "";
  document.getElementById("party-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
  setQuestFromFlags();
}

function joinDance(onStage) {
  flags.danceDone = true;
  flags.dancedOnStage = onStage;
  if (world) world.stageDancing = true;
  ensureDay1Music();
  dancing = true;
  if (onStage) {
    player.position.set(0.75, 0, -11.1);
    player.rotation.y = 0;
  }
  talkLines = [
    {
      who: "erjie",
      text: onStage ? "跟上我。副歌一起举手——对，就是这样。" : "好。那你在下面看着。我们跳给大家看。",
    },
    { who: "system", text: "开场舞结束。回主持人那里，游戏一项一项过。" },
  ];
  talkI = 0;
  talkChoices = null;
  talkDone = () => {
    setQuestFromFlags();
  };
  lockedMove = true;
  talkEl.hidden = false;
  showTalk();
}

function showPartyAct() {
  const acts = D().partyActs;
  const act = acts[partyIndex];
  if (!act) {
    flags.partyDone = true;
    partyPhase = "idle";
    dancing = false;
    if (world) world.stageDancing = false;
    document.getElementById("party-overlay").hidden = true;
    uiOpen = false;
    stopMusic();
    document.getElementById("night-overlay").hidden = false;
    return;
  }
  partyPhase = "games";
  document.getElementById("party-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
  document.getElementById("party-title").textContent = `${partyIndex + 1}/${acts.length}  ${act.title}`;
  document.getElementById("party-text").textContent = act.text;
  const stage = document.getElementById("party-stage");
  stage.innerHTML = "";
  stage.className = "";
  stage.style.backgroundImage = "";
  if (act.kind === "cheers") {
    stage.className = "fire";
    stage.textContent = "会不会 有一天 时间真的能倒退";
    burstFireworks();
    startMusic("cheers");
  } else {
    stage.textContent = act.title;
    ensureDay1Music();
  }
  document.getElementById("party-next").textContent =
    partyIndex === acts.length - 1 ? "合唱结束，回酒店" : "下一项";
}

function finishMini(gameId, won) {
  const first = !gardenDone[gameId];
  gardenDone[gameId] = true;
  if (first) {
    coins += 1;
    if (won) coins += 3;
    refreshMoney();
  }
  const extra = first
    ? won
      ? "参与 +1，获胜 +3。"
      : "参与 +1 游戏币。"
    : "再玩一次，游戏币只记第一次。";
  const el = document.getElementById("mini-result");
  el.textContent = `${el.textContent ? el.textContent + " " : ""}${extra}`;
  setQuestFromFlags();
  setTimeout(() => {
    stopMini();
    document.getElementById("game-overlay").hidden = true;
    uiOpen = false;
    lockedMove = false;
  }, 1500);
}

function openMini(gameId) {
  uiOpen = true;
  lockedMove = true;
  runMini(gameId, { done: gardenDone, finish: finishMini, grantItem });
}

function openPrize() {
  const box = document.getElementById("prize-btns");
  const tiers = [
    { name: "一等奖", cost: 15 },
    { name: "二等奖", cost: 10 },
    { name: "三等奖", cost: 5 },
    { name: "四等奖", cost: 3 },
    { name: "参与奖", cost: 1 },
  ];
  document.getElementById("prize-coins").textContent = String(coins);
  box.innerHTML = tiers
    .map(
      (t) =>
        `<button type="button" ${coins < t.cost ? "disabled" : ""} data-cost="${t.cost}">${t.name} ${t.cost}币</button>`
    )
    .join("");
  box.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      const cost = Number(b.dataset.cost);
      if (coins < cost) return;
      coins -= cost;
      grantItem("gift");
      refreshMoney();
      flags.prized = true;
      document.getElementById("prize-overlay").hidden = true;
      uiOpen = false;
      lockedMove = false;
      setQuestFromFlags();
    };
  });
  document.getElementById("prize-overlay").hidden = false;
  uiOpen = true;
  lockedMove = true;
}

function startCoupleWalk() {
  if (!world?.couple) return;
  const { zhong, xu } = world.couple;
  world.coupleWalk = {
    t: 0,
    zx0: zhong.position.x,
    zz0: zhong.position.z,
    ux0: xu.position.x,
    uz0: xu.position.z,
    zx1: -0.55,
    zz1: -22.5,
    ux1: 0.55,
    uz1: -22.5,
  };
  lockedMove = true;
}

function openBoothPhoto() {
  uiOpen = true;
  lockedMove = true;
  openBoothStudio({
    onShot(pose) {
      document.getElementById("polaroid-img").src = paintPolaroid(pose);
      document.getElementById("polaroid").hidden = false;
      flags.booth = true;
      grantItem("boothSnap");
      setQuestFromFlags();
    },
  });
}

function useNear() {
  if (!near || uiBusy()) return;
  if (near.locked) return;
  if (near.id === "letter") openLetter(true);
  else if (near.id === "door") {
    flags.door = true;
    near.marker.visible = false;
    const taxi = world.interactives.find((i) => i.id === "taxi");
    taxi.locked = false;
    taxi.marker.visible = true;
    setQuestFromFlags();
  } else if (near.id === "taxi") {
    if (flags.taxi) return;
    flags.taxi = true;
    near.locked = true;
    if (near.marker) near.marker.visible = false;
    goRide();
  } else if (near.id === "desk") {
    openTalk("hotel_checkin", () => {
      flags.checkedIn = true;
      near.locked = true;
      if (near.marker) near.marker.visible = false;
      setQuestFromFlags();
    });
  } else if (near.id === "awen") {
    if (!flags.kit) {
      openTalk("awen_kit", () => {
        flags.kit = true;
        grantItem("bingo");
        grantItem("glow");
        grantItem("spray");
        setQuestFromFlags();
      });
    } else if (bingoFull() && !flags.bingoReward) {
      openTalk("awen_reward", () => {
        flags.bingoReward = true;
        chips[50] += 1;
        refreshMoney();
        setQuestFromFlags();
      });
    } else {
      openTalk("awen_wait");
    }
  } else if (near.id === "guest") {
    const g = D().guests.find((x) => x.id === near.guestId);
    if (g) talkGuest(g);
  } else if (near.id === "zhongyi") {
    if (chipCount() <= 0) {
      talkLines = [
        {
          who: "zhongyi",
          text: flags.dicePlayed
            ? "口袋空了。去换筹码或找散落的，再来继续赌。"
            : "赌坊开张。先去填 Bingo 换筹码，凳子下面也藏着。有钱再来押大小。",
        },
      ];
      talkI = 0;
      talkDone = null;
      talkChoices = null;
      lockedMove = true;
      talkEl.hidden = false;
      showTalk();
    } else {
      talkLines = [
        {
          who: "zhongyi",
          text: flags.dicePlayed
            ? "还来？大小随你押。赢了同面额再给你一枚，输了归我。可以一直赌到没钱。"
            : "赌坊开张。猜大小，用筹码押注。赢了同面额再给你一枚，输了归我。想玩几轮就玩几轮，直到口袋空了。",
        },
      ];
      talkI = 0;
      talkDone = () => openDice();
      talkChoices = null;
      lockedMove = true;
      talkEl.hidden = false;
      showTalk();
    }
  } else if (near.id === "photo") {
    openTalk("photo_take", () => {
      flags.photo = true;
      grantItem("photo");
      setQuestFromFlags();
    });
  } else if (near.id === "hiddenChip") {
    openTalk("hidden_chip", () => {
      flags.hiddenChip = true;
      chips[100] += 1;
      refreshMoney();
      if (near.marker) near.marker.visible = false;
      near.locked = true;
      setQuestFromFlags();
    });
  } else if (near.id === "dinnerGate") {
    goBanquet();
  } else if (near.id === "ushers") {
    openTalk("qianyi_seat", () => {
      flags.seated = true;
      grantItem("welcome");
      grantItem("partyflow");
      setQuestFromFlags();
    });
  } else if (near.id === "partyHost") {
    if (!flags.partyBriefed) {
      openTalk("host_start_party", () => {
        flags.partyBriefed = true;
        setQuestFromFlags();
      });
    } else if (flags.danceDone && !flags.partyDone) {
      showPartyAct();
    }
  } else if (near.id === "partySeat") {
    player.position.set(near.x, 0, near.z);
    player.rotation.y = Math.PI;
    playWarmup();
  } else if (near.id === "erjie") {
    talkLines = D().dialogues.erjie_dance;
    talkI = 0;
    talkDone = null;
    talkChoices = [
      { ask: "上台，跟着二姐跳", onPick: () => joinDance(true) },
      { ask: "我就在台下看", onPick: () => joinDance(false) },
    ];
    lockedMove = true;
    talkEl.hidden = false;
    showTalk();
  } else if (near.id === "breakfast") {
    openTalk("breakfast", () => {
      flags.breakfast = true;
      if (near.marker) near.marker.visible = false;
      near.locked = true;
      setQuestFromFlags();
    });
  } else if (near.id === "toGarden") {
    goGarden();
  } else if (near.id === "game") {
    openMini(near.gameId);
  } else if (near.id === "prize") {
    if (!flags.day2Checkin) {
      openTalk("day2_check");
      return;
    }
    if (!diyDone() || !flags.booth || !playedGardenGames()) {
      openTalk("prize_wait");
      return;
    }
    openPrize();
  } else if (near.id === "day2check") {
    if (flags.prized && !flags.vowCard) {
      openTalk("vow_card", () => {
        flags.vowCard = true;
        grantItem("vowcard");
        setQuestFromFlags();
      });
      return;
    }
    openTalk("day2_check", () => {
      flags.day2Checkin = true;
      grantItem("pass");
      grantItem("ticket");
      grantItem("gift");
      setQuestFromFlags();
    });
  } else if (near.id === "booth") {
    openBoothPhoto();
  } else if (near.id === "dessert") {
    openTalk("dessert_talk", () => {
      flags.dessert = true;
      grantItem("dessert");
      setQuestFromFlags();
    });
  } else if (near.id === "ceremonySeat") {
    flags.satCeremony = true;
    if (near.marker) near.marker.visible = false;
    near.locked = true;
    player.position.set(near.x, 0, near.z);
    player.rotation.y = Math.PI;
    startCoupleWalk();
    setQuestFromFlags();
  } else if (near.id === "lunch") {
    goDining();
  } else if (near.id === "seatmap") {
    openSeatMap();
  } else if (near.id === "diningSeat") {
    player.position.set(near.x, 0, near.z);
    player.rotation.y = Math.atan2(near.tableX - near.x, near.tableZ - near.z);
    if (!flags.satDining) {
      openTalk("dining_sit", () => {
        flags.satDining = true;
        setQuestFromFlags();
      });
    } else {
      openTalk("dining_eat", () => {
        flags.ateLunch = true;
        setQuestFromFlags();
      });
    }
  } else if (near.id === "diningBye") {
    openTalk("zhong_q_banquet", () => {
      flags.lunch = true;
      document.getElementById("end-overlay").hidden = false;
      uiOpen = true;
    });
  }
}

function dismissOpenView() {
  if (stashLetter()) return true;
  if (!document.getElementById("bingo-overlay").hidden) {
    closeBingo();
    return true;
  }
  if (!document.getElementById("polaroid").hidden) {
    document.getElementById("polaroid").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  if (!document.getElementById("help-overlay").hidden) {
    document.getElementById("help-overlay").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  if (!document.getElementById("dice-overlay").hidden) {
    document.getElementById("dice-overlay").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  if (!document.getElementById("prize-overlay").hidden) {
    document.getElementById("prize-overlay").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  if (!document.getElementById("game-overlay").hidden) {
    stopMini();
    document.getElementById("game-overlay").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  if (!document.getElementById("bag").hidden) {
    document.getElementById("bag").hidden = true;
    return true;
  }
  if (!document.getElementById("party-overlay").hidden) {
    stopWarmupVideo();
    if (partyPhase === "warmup") partyPhase = "idle";
    document.getElementById("party-overlay").hidden = true;
    uiOpen = false;
    lockedMove = riding;
    return true;
  }
  return false;
}

window.addEventListener("keydown", (e) => {
  if (e.target && e.target.matches && e.target.matches("input, textarea")) return;
  keys[e.key.toLowerCase()] = true;
  if ((e.key === "e" || e.key === "E") && !uiBusy()) useNear();
  if (e.key === "Enter" && !talkEl.hidden) advanceTalk();
  if (e.key === "Escape") {
    e.preventDefault();
    dismissOpenView();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});
canvas.addEventListener("pointerdown", (e) => {
  if (uiBusy()) return;
  if (e.target.closest?.("#touch-ui")) return;
  dragging = true;
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
window.addEventListener("pointerup", () => {
  dragging = false;
});
window.addEventListener("pointermove", (e) => {
  if (!dragging || !started || uiBusy()) return;
  const dx = e.movementX || e.clientX - lastLookX;
  const dy = e.movementY || e.clientY - lastLookY;
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  camYaw -= dx * 0.006;
  camPitch = Math.max(-0.15, Math.min(0.7, camPitch + dy * 0.0035));
});

talkNext.onclick = advanceTalk;
document.getElementById("btn-start").onclick = async () => {
  document.getElementById("title-overlay").classList.add("hide");
  started = true;
  const jump = new URLSearchParams(location.search).get("jump");
  if (jump === "garden") {
    Object.assign(flags, {
      letter: true,
      door: true,
      taxi: true,
      checkedIn: true,
      kit: true,
      bingoReward: true,
      photo: true,
      hiddenChip: true,
      dicePlayed: true,
      seated: true,
      partyDone: true,
      breakfast: true,
    });
    await goGarden();
    const g = new URLSearchParams(location.search).get("g");
    if (g) openMini(g);
    return;
  }
  if (jump === "resort" || jump === "lawn") {
    Object.assign(flags, {
      letter: true,
      door: true,
      taxi: true,
      checkedIn: true,
      kit: true,
    });
    grantItem("bingo");
    await goResort();
    player.position.set(0, 0, -16.5);
    return;
  }
  if (jump === "banquet") {
    Object.assign(flags, {
      letter: true,
      door: true,
      taxi: true,
      checkedIn: true,
      kit: true,
      bingoReward: true,
      photo: true,
      hiddenChip: true,
      dicePlayed: true,
    });
    await goBanquet();
    return;
  }
  if (jump === "dining") {
    Object.assign(flags, {
      letter: true,
      door: true,
      taxi: true,
      checkedIn: true,
      kit: true,
      bingoReward: true,
      photo: true,
      hiddenChip: true,
      dicePlayed: true,
      seated: true,
      partyDone: true,
      breakfast: true,
      day2Checkin: true,
      booth: true,
      prized: true,
      vowCard: true,
      satCeremony: true,
      vows: true,
    });
    await goDining();
    return;
  }
  await goAirport();
};
document.getElementById("btn-reset").onclick = () => {
  if (!confirm("清空进度，从飞机重新开始？")) return;
  Object.assign(flags, {
    letter: false,
    door: false,
    taxi: false,
    checkedIn: false,
    kit: false,
    bingoReward: false,
    photo: false,
    hiddenChip: false,
    seated: false,
    partyBriefed: false,
    warmupSeen: false,
    danceDone: false,
    dancedOnStage: false,
    partyDone: false,
    breakfast: false,
    satCeremony: false,
    vows: false,
    lunch: false,
    ateLunch: false,
    satDining: false,
    convertedChips: false,
    dicePlayed: false,
    day2Checkin: false,
    booth: false,
    dessert: false,
    prized: false,
    vowCard: false,
  });
  Object.keys(gardenDone).forEach((k) => delete gardenDone[k]);
  partyIndex = 0;
  partyPhase = "idle";
  warmupReady = false;
  dancing = false;
  stopMusic();
  inventory.length = 0;
  chips[50] = chips[100] = chips[500] = chips[1000] = 0;
  coins = 0;
  Object.keys(bingo).forEach((k) => delete bingo[k]);
  refreshMoney();
  renderBag();
  document.getElementById("title-overlay").classList.remove("hide");
  started = false;
  lockedMove = false;
  riding = false;
  uiOpen = false;
  talkEl.hidden = true;
  if (worldGroup) clearWorld();
  world = null;
};
document.getElementById("btn-bag").onclick = () => {
  const bag = document.getElementById("bag");
  bag.hidden = !bag.hidden;
  renderBag();
};
document.getElementById("bag-close").onclick = () => {
  document.getElementById("bag").hidden = true;
};
document.getElementById("bingo-fill").onclick = fillAllBingo;
document.getElementById("bingo-save").onclick = closeBingo;
document.getElementById("bingo-close").onclick = closeBingo;
document.getElementById("btn-help").onclick = openHelp;
document.getElementById("help-close").onclick = () => {
  document.getElementById("help-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
};
document.getElementById("dice-close").onclick = () => {
  document.getElementById("dice-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
};
document.getElementById("bet-small").onclick = () => rollDice(false);
document.getElementById("bet-big").onclick = () => rollDice(true);
document.getElementById("party-next").onclick = () => {
  if (partyPhase === "warmup") {
    if (!warmupReady) {
      warmupReady = true;
      stopWarmupVideo();
      burstFireworks();
      document.getElementById("party-text").textContent = "短片结束了。";
      document.getElementById("party-next").textContent = "去找二姐看开场舞";
      return;
    }
    closeWarmup();
    return;
  }
  partyIndex += 1;
  showPartyAct();
};
document.getElementById("mini-close").onclick = () => {
  stopMini();
  document.getElementById("game-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
};
document.getElementById("prize-close").onclick = () => {
  document.getElementById("prize-overlay").hidden = true;
  uiOpen = false;
  lockedMove = false;
};
document.getElementById("polaroid-ok").onclick = () => {
  document.getElementById("polaroid").hidden = true;
  uiOpen = false;
  lockedMove = false;
};
document.getElementById("btn-day2").onclick = () => {
  document.getElementById("night-overlay").hidden = true;
  uiOpen = false;
  goHotel();
};
document.getElementById("btn-replay").onclick = () => {
  document.getElementById("end-overlay").hidden = true;
  document.getElementById("btn-reset").click();
};

function setupTouch() {
  const ui = document.getElementById("touch-ui");
  const stick = document.getElementById("stick");
  const knob = document.getElementById("stick-knob");
  const act = document.getElementById("btn-act");
  const sync = () => {
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 820px)").matches;
    document.body.classList.toggle("touch", touch);
    ui.hidden = !touch;
    const hint = document.getElementById("keys-hint");
    if (hint) {
      hint.textContent = touch
        ? "左摇杆走路 · 滑动屏幕转视角 · 点「互动」· 背包"
        : "WASD 走路 · 按住鼠标拖拽视角 · E 互动 · 右下角背包";
    }
  };
  sync();
  window.addEventListener("resize", sync);
  const setStick = (x, y) => {
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = x - cx;
    let dy = y - cy;
    const max = rect.width * 0.36;
    const m = Math.hypot(dx, dy) || 1;
    if (m > max) {
      dx *= max / m;
      dy *= max / m;
    }
    stickX = dx / max;
    stickY = dy / max;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const clearStick = () => {
    stickX = 0;
    stickY = 0;
    knob.style.transform = "translate(0px, 0px)";
  };
  stick.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    stick.setPointerCapture(e.pointerId);
    setStick(e.clientX, e.clientY);
  });
  stick.addEventListener("pointermove", (e) => {
    if (!stick.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    setStick(e.clientX, e.clientY);
  });
  const endStick = () => clearStick();
  stick.addEventListener("pointerup", endStick);
  stick.addEventListener("pointercancel", endStick);
  act.addEventListener("click", (e) => {
    e.preventDefault();
    if (dismissOpenView()) return;
    if (!talkEl.hidden) advanceTalk();
    else if (!uiBusy()) useNear();
  });
}
setupTouch();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  animT += dt;
  if (world?.update) world.update(animT);

  if (started && world?.cinematic && world.path) {
    rideT = Math.min(1, rideT + dt * 0.26);
    const p = world.path.getPointAt(rideT);
    const look = world.path.getPointAt(Math.min(1, rideT + 0.02));
    world.taxi.position.copy(p);
    world.taxi.rotation.y = Math.atan2(look.x - p.x, look.z - p.z);
    camera.position.lerp(p.clone().add(new THREE.Vector3(3.2, 2.1, 5.5)), 0.12);
    camera.lookAt(p.x, 1.1, p.z);
    if (rideT >= 1 && !world.arriving) {
      world.arriving = true;
      goResort();
    }
  } else if (started && world?.coupleWalk && !flags.vows) {
    world.coupleWalk.t = Math.min(1, world.coupleWalk.t + dt * 0.22);
    const t = world.coupleWalk.t;
    const w = world.coupleWalk;
    const zx = w.zx0 + (w.zx1 - w.zx0) * t;
    const zz = w.zz0 + (w.zz1 - w.zz0) * t;
    const ux = w.ux0 + (w.ux1 - w.ux0) * t;
    const uz = w.uz0 + (w.uz1 - w.uz0) * t;
    world.couple.zhong.position.set(zx, 0, zz);
    world.couple.xu.position.set(ux, 0, uz);
    world.couple.zhong.rotation.y = Math.atan2(w.zx1 - w.zx0, w.zz1 - w.zz0) + Math.PI;
    world.couple.xu.rotation.y = Math.atan2(w.ux1 - w.ux0, w.uz1 - w.uz0) + Math.PI;
    const mx = (zx + ux) * 0.5;
    const mz = (zz + uz) * 0.5;
    camera.position.lerp(new THREE.Vector3(mx + 4.2, 2.4, mz + 5), 0.08);
    camera.lookAt(mx, 1.1, mz);
    if (t >= 1) {
      world.coupleWalk = null;
      lockedMove = true;
      openTalk("ceremony_host", () => {
        openTalk("collective_vow", () => {
          openTalk("couple_confession", () => {
            flags.vows = true;
            lockedMove = false;
            setQuestFromFlags();
          });
        });
      });
    }
  } else if (started && world) {
    const sm = Math.hypot(stickX, stickY);
    let f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
    let r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    if (sm > 0.18) {
      f = -stickY;
      r = stickX;
    }
    let moving = false;
    if (!lockedMove && !uiBusy() && (f || r)) {
      const fwdX = -Math.sin(camYaw);
      const fwdZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);
      let vx = fwdX * f + rightX * r;
      let vz = fwdZ * f + rightZ * r;
      const len = Math.hypot(vx, vz) || 1;
      vx /= len;
      vz /= len;
      const sp = 4.2 * dt * (sm > 0.18 ? Math.min(1, sm) : 1);
      const nx = player.position.x + vx * sp;
      const nz = player.position.z + vz * sp;
      if (!blocked(world.colliders, nx, player.position.z, 0.32, world.bounds)) player.position.x = nx;
      if (!blocked(world.colliders, player.position.x, nz, 0.32, world.bounds)) player.position.z = nz;
      player.rotation.y = Math.atan2(vx, vz);
      moving = true;
    }
    const { la, ra, ll, rl } = player.userData.limbs;
      const swing = moving ? Math.sin(animT * 10) * 0.55 : dancing ? Math.sin(animT * 8) * 0.7 : 0;
    la.rotation.x = swing;
    ra.rotation.x = -swing;
    ll.rotation.x = -swing;
    rl.rotation.x = swing;

    const dist = 4.6;
    const ch = 1.72;
    camera.position.lerp(
      new THREE.Vector3(
        player.position.x + Math.sin(camYaw) * dist,
        player.position.y + ch + camPitch * 2.5,
        player.position.z + Math.cos(camYaw) * dist
      ),
      0.12
    );
    camera.lookAt(player.position.x, player.position.y + 1.05, player.position.z);

    near = null;
    let best = 9;
    for (const it of world.interactives) {
      if (it.id === "taxi" && flags.taxi) continue;
      if (it.locked) continue;
      const d = Math.hypot(player.position.x - it.x, player.position.z - it.z);
      if (d < it.r && d < best) {
        best = d;
        near = it;
      }
    }
    if (near && !uiBusy()) {
      promptEl.hidden = false;
      promptEl.textContent = actLabel(near.label);
    } else {
      promptEl.hidden = true;
    }
  }

  renderer.render(root, camera);
  requestAnimationFrame(tick);
}
tick();
refreshMoney();
renderBag();

window.__ll = {
  keys,
  player,
  flags,
  chips,
  bingo,
  skipRide() {
    rideT = 1;
  },
  goBanquet,
  goHotel,
  goGarden,
  goDining,
  goResort,
};
