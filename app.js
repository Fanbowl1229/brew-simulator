/**
 * 手沖沖煮模擬器 — 核心邏輯（v2）
 * 基準：15g / 250g · S3 4.9 · 肯尼亞水洗 · V60 · 93°C
 */
(function () {
  "use strict";

  const STORAGE_KEY = "brew-simulator-v2";
  const BEANS_STORAGE_KEY = "brew-simulator-beans-v1";
  const BD = window.BREW_BEAN_DATA;
  const RD = window.BREW_RECIPES;

  const FILTERS = [
    { id: "hario-v60-01-bleached", label: "Hario V60 01 漂白", shapes: ["cone"], preferred: ["v60", "v60-01", "hario-switch"] },
    { id: "hario-v60-01-unbleached", label: "Hario V60 01 未漂白", shapes: ["cone"], preferred: ["v60", "v60-01", "hario-switch"] },
    { id: "hario-v60-02-bleached", label: "Hario V60 02 漂白", shapes: ["cone"], preferred: ["v60", "v60-02", "hario-switch", "origami", "origami-air-s", "ufo-v3", "solo"] },
    { id: "hario-v60-02-unbleached", label: "Hario V60 02 未漂白", shapes: ["cone"], preferred: ["v60", "v60-02", "hario-switch", "origami"] },
    { id: "kalita-155", label: "Kalita Wave 155", shapes: ["flat", "wave"], preferred: ["kalita-155", "orea-v3", "april"] },
    { id: "kalita-185", label: "Kalita Wave 185", shapes: ["flat", "wave"], preferred: ["kalita-185", "orea-v4-narrow", "stagg-x"] },
    { id: "cafec-abaca", label: "Cafec Abaca", shapes: ["cone"], preferred: ["v60", "v60-01", "v60-02", "origami", "origami-air-s"] },
    { id: "cafec-light", label: "Cafec Light Roast", shapes: ["cone"], preferred: ["v60", "v60-02", "origami"] },
    { id: "cafec-medium", label: "Cafec Medium Roast", shapes: ["cone"], preferred: ["v60", "v60-02"] },
    { id: "cafec-dark", label: "Cafec Dark Roast", shapes: ["cone"], preferred: ["v60", "v60-02"] },
    { id: "cafec-t92", label: "Cafec Abaca T-92", shapes: ["cone"], preferred: ["origami", "origami-air-s", "v60-02"] },
    { id: "sibarist-fast", label: "Sibarist FAST", shapes: ["cone", "flat"], preferred: ["orea-v4-narrow", "orea-v3", "solo", "april", "v60-02"] },
    { id: "sibarist-fast-wave", label: "Sibarist FAST WAVE", shapes: ["wave", "flat"], preferred: ["kalita-155", "kalita-185", "orea-v3"] },
    { id: "sibarist-b3", label: "Sibarist B3", shapes: ["cone"], preferred: ["v60", "v60-02", "origami"] },
    { id: "april-flat", label: "April Flat Bottom", shapes: ["flat"], preferred: ["april", "orea-v3", "orea-v4-narrow"] },
    { id: "origami-dedicated", label: "Origami 專用波紋", shapes: ["wave", "flat"], preferred: ["origami", "origami-air-s"] },
    { id: "origami-cone", label: "Origami 錐形紙", shapes: ["cone"], preferred: ["origami", "origami-air-s"] },
    { id: "melitta", label: "Melitta", shapes: ["cone"], preferred: ["kalita-101", "kalita-102"] },
    { id: "chemex", label: "Chemex", shapes: ["cone"], preferred: [] },
    { id: "clever", label: "Clever 相容", shapes: ["immersion"], preferred: ["clever", "pulsar"] },
  ];

  const BREWER_META = {
    v60: { shape: "cone", label: "V60" },
    "v60-01": { shape: "cone", label: "V60 01" },
    "v60-02": { shape: "cone", label: "V60 02" },
    "hario-switch": { shape: "cone", label: "Switch", isSwitch: true },
    origami: { shape: "cone", label: "Origami" },
    "origami-air-s": { shape: "cone", label: "Origami Air S" },
    "kalita-155": { shape: "flat", label: "Wave 155" },
    "kalita-185": { shape: "flat", label: "Wave 185" },
    "kalita-101": { shape: "cone", label: "Kalita 101" },
    "kalita-102": { shape: "cone", label: "Kalita 102" },
    "orea-v3": { shape: "flat", label: "Orea V3" },
    "orea-v4-narrow": { shape: "flat", label: "Orea V4" },
    april: { shape: "flat", label: "April" },
    "stagg-x": { shape: "flat", label: "Stagg X" },
    "ufo-v3": { shape: "cone", label: "UFO V3", isUfo: true },
    clever: { shape: "immersion", label: "Clever", isImmersion: true },
    solo: { shape: "cone", label: "SOLO" },
    pulsar: { shape: "immersion", label: "Pulsar", isImmersion: true },
  };

  const BASELINE = {
    dose: 15,
    water: 250,
    ratio: 250 / 15,
    grinder: "s3",
    grind: 4.9,
    temp: 93,
    brewer: "v60",
    filter: "hario-v60-02-bleached",
    pourStyle: "3pour",
    kasuya46Mode: "balanced",
    bloomWait: 45,
    iced: false,
    lockRatio: true,
    brewStyle: "pour-over",
    switchMode: "immersion-then-open",
    immersionHold: 90,
    coldSteepHours: 14,
    recipeId: "",
    bean: {
      name: "",
      origins: ["肯亞"],
      varieties: ["SL28"],
      processes: ["肯亞式雙重水洗"],
      flavors: ["黑加侖子", "西柚"],
      density: "hard",
      tendencies: ["明亮酸質", "乾淨清爽"],
      roastDate: "",
      notes: "",
      savedId: "",
      quickPreset: "kenya",
    },
  };

  const GRINDER = {
    s3: { min: 0, max: 9, step: 0.1, label: "S3", baseline: 4.9 },
    ode: { min: 1, max: 11, step: 0.1, label: "Ode", baseline: 5.5 },
  };

  const $ = (id) => document.getElementById(id);
  const els = {};
  [
    "dose", "water", "lockRatio", "ratioDisplay", "grinder", "grind", "grindValue",
    "temp", "tempValue", "brewer", "filter", "filterHint", "pourStyle", "bloomWait",
    "bloomWaitValue", "iced", "resetBtn", "outRatio", "outTime", "outGrind",
    "icedStat", "outIced", "tipText", "schedule", "pourBars", "brewStyle",
    "recipePick", "switchMode", "immersionHold", "immersionHoldValue",
    "switchModeRow", "immersionHoldRow", "coldSteepRow", "coldSteepHours",
    "coldSteepValue", "pourStyleRow", "kasuya46ModeRow", "kasuya46Mode", "bloomRow", "icedToggleRow", "tempRow",
    "origin", "variety", "varietySearch", "process", "density", "flavorSelect",
    "flavorChips", "tendencyChips", "beanQuickPresets", "myBeansList", "myBeansEmpty",
    "beanName", "roastDate", "beanNotes", "beanSaveBtn", "beanUpdateBtn", "beanDeleteBtn",
    "beanSaveStatus", "beanExportBtn", "beanImportBtn", "beanImportFile", "teachingCard",
    "teachingName", "teachingMeta", "teachingSteps", "teachingNotes", "teachingLink",
    "brewTimer", "timerStartBtn", "timerColdHint", "timerPanel", "timerClock",
    "timerStatus", "timerStepLabel", "timerOverallFill", "timerOverallPct",
    "timerSegments", "timerPauseBtn", "timerResumeBtn", "timerResetBtn",
    "timerSticky", "timerStickyClock", "timerStickyLabel", "timerStickyBtn",
  ].forEach((id) => { els[id] = $(id); });

  let state = JSON.parse(JSON.stringify(BASELINE));
  let filterOverride = false; // user manually picked filter
  let myBeans = []; // personal bean journal (localStorage)

  // ——— Helpers ———
  /** Kasuya 4:6 baselines @ 20g / 300ml — scale pours by waterHot/300; times = rhythm only */
  const KASUYA46_BASE_WATER = 300;
  const KASUYA46_MODES = {
    bright: {
      id: "bright",
      label: "清爽果酸型",
      shortLabel: "清爽果酸",
      desc: "前段拆細 → 香氣更立體、果酸更明亮",
      pours: [40, 40, 40, 90, 90],
      times: [0, 45, 75, 105, 150],
      bloomSec: 45,
      dripLo: 210,
      dripHi: 240,
      notes: [
        "第 1 注（悶蒸）",
        "第 2 注 · 目標約 30 秒內注完",
        "第 3 注 · 完成前段 40%",
        "第 4 注 · 後段 60%（1）",
        "第 5 注 · 後段 60%（2）· 滴完約 3:30–4:00",
      ],
    },
    balanced: {
      id: "balanced",
      label: "平衡風味型",
      shortLabel: "平衡風味",
      desc: "標準分法 · 最適合作基準對比",
      pours: [60, 60, 60, 60, 60],
      times: [0, 45, 90, 135, 180],
      bloomSec: 45,
      dripLo: 240,
      dripHi: 300,
      notes: [
        "第 1 注（悶蒸）",
        "第 2 注 · 完成前段 40%",
        "第 3 注 · 後段開始",
        "第 4 注 · 後段",
        "第 5 注 · 收尾 · 滴完約 4:00–5:00",
      ],
    },
    full: {
      id: "full",
      label: "濃郁厚實型",
      shortLabel: "濃郁厚實",
      desc: "前段集中、後段拆細 → 甜感集中、Body 更厚",
      pours: [120, 45, 45, 45, 45],
      times: [0, 60, 90, 120, 150],
      bloomSec: 60,
      dripLo: 240,
      dripHi: 300,
      notes: [
        "第 1 注（悶蒸）· 前段一次集中",
        "第 2 注 · 後段拆細開始",
        "第 3 注 · 維持穩定流速",
        "第 4 注 · 避免外圈沖刷",
        "第 5 注 · 收尾 · 滴完約 4:00–5:00",
      ],
    },
  };

  function getKasuya46Mode() {
    const m = state.kasuya46Mode;
    return KASUYA46_MODES[m] || KASUYA46_MODES.balanced;
  }

  function isKasuya46Active() {
    return state.pourStyle === "kasuya46" || state.recipeId === "kasuya-46";
  }

  function scaleKasuya46Pours(waterHot, mode) {
    const base = mode.pours;
    const n = base.length;
    if (!waterHot || waterHot <= 0) return base.map(() => 0);
    const scale = waterHot / KASUYA46_BASE_WATER;
    const rounded = [];
    let cum = 0;
    for (let i = 0; i < n - 1; i++) {
      let g = round0(base[i] * scale);
      rounded.push(g);
      cum += g;
    }
    let last = waterHot - cum;
    if (last < 0) {
      // rounding overflow — peel from earlier pours
      let deficit = -last;
      last = 0;
      for (let i = n - 2; i >= 0 && deficit > 0; i--) {
        const take = Math.min(rounded[i], deficit);
        rounded[i] -= take;
        deficit -= take;
      }
    }
    rounded.push(last);
    return rounded;
  }

  function buildKasuya46Schedule(waterHot) {
    const mode = getKasuya46Mode();
    const pours = scaleKasuya46Pours(waterHot, mode);
    const steps = [];
    let cum = 0;
    for (let i = 0; i < pours.length; i++) {
      cum += pours[i];
      const isBloom = i === 0;
      steps.push({
        label: isBloom ? "悶蒸／第 1 注" : "第 " + (i + 1) + " 注",
        atSec: mode.times[i],
        pourG: pours[i],
        cumulativeG: cum,
        note: mode.notes[i] + " · 目標累計 " + cum + "g",
      });
    }
    return steps;
  }

  function fmtTimeSec(sec) {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }

  function round1(n) { return Math.round(n * 10) / 10; }
  function round0(n) { return Math.round(n); }
  function fmtRatioClean(r) {
    return "1:" + (Math.round(r * 100) / 100).toFixed(2);
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }
  function s3ToOde(s3) { return clamp(round1(1 + (s3 / 9) * 10), 1, 11); }
  function odeToS3(ode) { return clamp(round1(((ode - 1) / 10) * 9), 0, 9); }
  function isUfo(b) { return b === "ufo-v3" || b === "ufo"; }
  function isKalita(b) { return String(b).indexOf("kalita") === 0; }
  function isSwitch(b) { return b === "hario-switch"; }
  /** Valve schedule / Switch UI: native Switch, or Resistance mode (UFO V3 on Switch base). */
  function usesValveControls(b) {
    return isSwitch(b) || state.switchMode === "resistance";
  }

  function beanHeuristics() {
    return BD.heuristicsFromBean(state.bean);
  }

  function suggestedGrindS3(dose, iced) {
    let g = BASELINE.grind;
    const h = beanHeuristics();
    g += h.grindOffset;
    if (dose < 12) {
      g -= dose < 10 ? 0.5 : 0.3 + ((12 - dose) / 2) * 0.1;
    } else if (dose > 18) {
      g += Math.min(0.4, (dose - 18) * 0.05);
    }
    if (iced || state.brewStyle === "iced") g -= 0.3;
    if (state.brewStyle === "cold") g += 1.2; // much coarser
    if (state.brewStyle === "immersion" || usesValveControls(state.brewer) && state.switchMode !== "full-flow") {
      g += 0.25;
    }
    return clamp(round1(g), 0, 9);
  }

  // ——— Schedule ———
  function buildSchedule(dose, waterHot, style, bloomWait, brewer, iced) {
    const steps = [];
    const bloomRatio = iced ? 2.5 : 2.8;
    let bloomG = round0(clamp(dose * bloomRatio, dose * 2, Math.min(waterHot * 0.25, dose * 3.5)));
    let intervalScale = 1;
    if (dose < 12) intervalScale = 0.75;
    else if (dose > 18) intervalScale = 1.15 + Math.min(0.2, (dose - 18) * 0.02);

    let bloomSec = bloomWait;
    if (isUfo(brewer) && bloomWait < 55) bloomSec = Math.max(bloomWait, 60);
    const pourStart = bloomSec;

    // Cold brew: no pour schedule — steep instructions
    if (state.brewStyle === "cold") {
      steps.push({
        label: "混合",
        atSec: 0,
        pourG: waterHot,
        cumulativeG: waterHot,
        note: "粗粉＋冷水拌匀，入雪櫃",
      });
      steps.push({
        label: "浸泡",
        atSec: 0,
        pourG: 0,
        cumulativeG: waterHot,
        note: state.coldSteepHours + " 小時後過濾",
      });
      return steps;
    }

    // Switch / valve modes (Hario Switch, or UFO V3 + Switch「阻力 Resistance」)
    if (usesValveControls(brewer) && state.switchMode !== "full-flow") {
      const hold = state.immersionHold || 90;
      // Resistance：開閥滲濾 → 關閥浸泡 → 開閥放流（Nas Jaafar）
      if (state.switchMode === "resistance") {
        const half = round0(waterHot / 2);
        const rest = waterHot - half;
        const closeAt = bloomWait != null ? bloomWait : 58;
        const openAt = closeAt + hold;
        steps.push({
          label: "開閥滲濾",
          atSec: 0,
          pourG: half,
          cumulativeG: half,
          note: "閥門開啟 · 滲濾注水",
        });
        steps.push({
          label: "關閥浸泡",
          atSec: closeAt,
          pourG: rest,
          cumulativeG: waterHot,
          note: "關閉閥門 · 浸泡注水",
        });
        steps.push({
          label: "開閥放流",
          atSec: openAt,
          pourG: 0,
          cumulativeG: waterHot,
          note: "打開閥門 · 約 2:10 滴完",
        });
        return steps;
      }
      if (state.switchMode === "immersion-then-open") {
        steps.push({
          label: "關閥注水",
          atSec: 0,
          pourG: waterHot,
          cumulativeG: waterHot,
          note: "閥門關閉 · 一次注滿",
        });
        steps.push({
          label: "開閥放流",
          atSec: hold,
          pourG: 0,
          cumulativeG: waterHot,
          note: "打開閥門 · 浸泡 " + hold + "s 後",
        });
        return steps;
      }
      // hybrid: bloom closed, then open and continue
      bloomG = round0(Math.min(waterHot * 0.3, dose * 3));
      const rest = waterHot - bloomG;
      steps.push({
        label: "關閥悶蒸",
        atSec: 0,
        pourG: bloomG,
        cumulativeG: bloomG,
        note: "閥門關閉",
      });
      steps.push({
        label: "開閥",
        atSec: bloomSec,
        pourG: 0,
        cumulativeG: bloomG,
        note: "打開閥門開始流下",
      });
      steps.push({
        label: "續注",
        atSec: bloomSec + 5,
        pourG: rest,
        cumulativeG: waterHot,
        note: "閥門開啟 · 注至目標",
      });
      return steps;
    }

    // Kasuya 4:6 — cumulative water is truth; times are rhythm only
    if (style === "kasuya46") {
      return buildKasuya46Schedule(waterHot);
    }

    if (style === "ufo-official" || (style === "3pour" && isUfo(brewer))) {
      bloomG = round0(Math.min(waterHot * 0.2, dose * 3));
      const mid = round0((waterHot - bloomG) * 0.45);
      const last = waterHot - bloomG - mid;
      steps.push({ label: "悶蒸", atSec: 0, pourG: bloomG, cumulativeG: bloomG, note: "溫和繞圈" });
      steps.push({
        label: "第二段",
        atSec: round0(pourStart * intervalScale),
        pourG: mid,
        cumulativeG: bloomG + mid,
        note: "中心向外",
      });
      steps.push({
        label: "尾段（高攪動）",
        atSec: round0((pourStart + 35) * intervalScale),
        pourG: last,
        cumulativeG: waterHot,
        note: "稍高攪動 · UFO 風格",
      });
      return steps;
    }

    if (style === "bloom3") {
      const rest = waterHot - bloomG;
      const p1 = round0(rest / 3);
      const p2 = round0(rest / 3);
      const p3 = rest - p1 - p2;
      const gap = round0(25 * intervalScale);
      steps.push({ label: "悶蒸", atSec: 0, pourG: bloomG, cumulativeG: bloomG, note: "濕潤粉床" });
      let cum = bloomG;
      let t = pourStart;
      [p1, p2, p3].forEach((g, i) => {
        cum += g;
        steps.push({
          label: "第" + (i + 2) + "段",
          atSec: round0(t),
          pourG: g,
          cumulativeG: cum,
          note: i === 2 ? "收尾" : "穩定流速",
        });
        t += gap;
      });
      return steps;
    }

    if (style === "4equal" || style === "5equal") {
      const n = style === "4equal" ? 4 : 5;
      const each = round0(waterHot / n);
      let cum = 0;
      const gap = round0((style === "5equal" ? 20 : 25) * intervalScale);
      for (let i = 0; i < n; i++) {
        const g = i === n - 1 ? waterHot - cum : each;
        cum += g;
        steps.push({
          label: i === 0 ? "悶蒸／第一段" : "第" + (i + 1) + "段",
          atSec: 0,
          pourG: g,
          cumulativeG: cum,
          note: i === 0 ? "等待 " + bloomSec + "s" : "等量注水",
        });
      }
      for (let i = 1; i < n; i++) {
        steps[i].atSec = round0(bloomSec + (i - 1) * gap);
      }
      return steps;
    }

    // Clever-style immersion dripper without switch
    if ((BREWER_META[brewer] || {}).isImmersion && state.brewStyle === "immersion") {
      const hold = state.immersionHold || 120;
      steps.push({
        label: "注滿浸泡",
        atSec: 0,
        pourG: waterHot,
        cumulativeG: waterHot,
        note: "攪匀、蓋上",
      });
      steps.push({
        label: "放流",
        atSec: hold,
        pourG: 0,
        cumulativeG: waterHot,
        note: "放到壺上開始滴濾",
      });
      return steps;
    }

    // Default 3pour
    const midTarget = round0(waterHot * 0.6);
    const midPour = Math.max(0, midTarget - bloomG);
    const lastPour = waterHot - bloomG - midPour;
    const gap = round0(30 * intervalScale);
    steps.push({ label: "悶蒸", atSec: 0, pourG: bloomG, cumulativeG: bloomG, note: "約粉量 × 2.5–3" });
    steps.push({
      label: "第二段",
      atSec: round0(pourStart),
      pourG: midPour,
      cumulativeG: bloomG + midPour,
      note: "繞圈至累計 ~60%",
    });
    steps.push({
      label: "第三段",
      atSec: round0(pourStart + gap),
      pourG: lastPour,
      cumulativeG: waterHot,
      note: "收尾至目標水量",
    });
    return steps;
  }

  function estimateTotalTime(dose, steps, iced, brewer) {
    if (state.brewStyle === "cold") {
      const h = state.coldSteepHours || 14;
      return { lo: h * 3600, hi: (h + 2) * 3600, cold: true };
    }
    if (state.pourStyle === "kasuya46") {
      const mode = getKasuya46Mode();
      return { lo: mode.dripLo, hi: mode.dripHi };
    }
    const lastPourAt = steps.length ? steps[steps.length - 1].atSec : 45;
    let drain = 45;
    if (dose < 12) drain = 30;
    else if (dose > 18) drain = 55 + Math.min(25, (dose - 18) * 2);
    if (isKalita(brewer)) drain += 10;
    if (isUfo(brewer)) drain += 5;
    if (state.switchMode === "resistance") {
      drain = 10; // last open ~2:00 → finish ~2:10
    } else if (usesValveControls(brewer) && state.switchMode !== "full-flow") {
      drain = 40;
    }
    if (iced || state.brewStyle === "iced") drain = Math.round(drain * 0.7);
    const mid = lastPourAt + drain;
    return { lo: Math.max(90, mid - 20), hi: mid + 25 };
  }

  function buildTip(suggestedS3) {
    const parts = [];
    const h = beanHeuristics();
    if (h.tip) parts.push(h.tip);

    if (state.pourStyle === "kasuya46") {
      const mode = getKasuya46Mode();
      parts.push(
        "4:6「" + mode.label + "」：" + mode.desc +
        "。累積水量係真理；時間只係節奏。基準表 20g/300ml，而家按你嘅粉水自動縮放。"
      );
    } else if (state.dose < 12) {
      parts.push("粉量細過 12g，建議研磨再細少少，注水間隔縮短啲。");
    } else if (state.dose > 18) {
      parts.push("粉量大過 18g，研磨可略粗或維持，總時間會長啲。");
    }

    if (state.iced || state.brewStyle === "iced") {
      parts.push("冰手沖：熱水約六成、其餘落冰；研磨再細少少。");
    }
    if (state.brewStyle === "cold") {
      parts.push("冷萃用粗研磨、雪櫃浸泡 " + state.coldSteepHours + " 小時，之後過濾。");
    }
    if (state.switchMode === "resistance") {
      parts.push(
        "阻力 Resistance：UFO V3 坐 Switch 底座。0:00 開閥滲濾半水 → 約 0:58 關閥浸泡半水 → 2:00 開閥放流；總約 2:10。"
      );
    } else if (isUfo(state.brewer)) {
      parts.push("UFO V3 建議悶蒸約 60 秒，尾段可以稍為加大攪動。");
    } else if (isKalita(state.brewer)) {
      parts.push("Kalita Wave 平底流速穩，適合脈衝注水。");
    } else if (String(state.brewer).indexOf("origami") === 0) {
      parts.push("Origami 濾杯靈活，可跟錐形或波紋紙調整風格。");
    } else if (isSwitch(state.brewer)) {
      const modeLabel = {
        "full-flow": "全開流下（似 V60）",
        "immersion-then-open": "浸泡後開閥",
        hybrid: "混合（先關閥悶蒸再開閥續注）",
        resistance: "阻力 Resistance（開→關→開）",
      }[state.switchMode];
      parts.push("Switch 模式：" + modeLabel + "。時間表會標示開關閥。");
    }

    const delta = round1(suggestedS3 - BASELINE.grind);
    if (Math.abs(delta) >= 0.2) {
      parts.push(
        "相對基準研磨（S3 4.9）：建議 " +
          (delta < 0 ? "細 " : "粗 ") +
          Math.abs(delta).toFixed(1) +
          " → S3 " +
          suggestedS3.toFixed(1) +
          "。"
      );
    }
    if (h.agitation === "gentle") {
      parts.push("呢隻豆建議溫和攪動，唔好大力轉圈。");
    }
    if (!parts.length) {
      return "基準配方：肯尼亞水洗 · V60 · 15g / 250g · S3 4.9 · 93°C。調參數會即時更新建議。";
    }
    return parts.join(" ");
  }

  function icedSplit(totalLiquid) {
    const hot = round0(totalLiquid * 0.62);
    return { hot, ice: totalLiquid - hot, totalLiquid };
  }

  // ——— Filters soft-match ———
  function preferredFilters(brewerId) {
    const preferred = FILTERS.filter((f) => f.preferred.indexOf(brewerId) >= 0);
    const meta = BREWER_META[brewerId] || { shape: "cone" };
    const shapeMatch = FILTERS.filter(
      (f) => preferred.indexOf(f) < 0 && f.shapes.indexOf(meta.shape) >= 0
    );
    const rest = FILTERS.filter((f) => preferred.indexOf(f) < 0 && shapeMatch.indexOf(f) < 0);
    return { preferred, shapeMatch, rest };
  }

  function populateFilterSelect(keepValue) {
    const { preferred, shapeMatch, rest } = preferredFilters(state.brewer);
    const sel = els.filter;
    const cur = keepValue || state.filter;
    sel.innerHTML = "";
    function addGroup(label, list) {
      if (!list.length) return;
      const og = document.createElement("optgroup");
      og.label = label;
      list.forEach((f) => {
        const o = document.createElement("option");
        o.value = f.id;
        o.textContent = f.label;
        og.appendChild(o);
      });
      sel.appendChild(og);
    }
    addGroup("★ 建議（跟濾杯）", preferred);
    addGroup("同形狀", shapeMatch);
    addGroup("其他（可手動選）", rest);

    if (FILTERS.some((f) => f.id === cur)) {
      sel.value = cur;
      state.filter = cur;
    } else if (preferred[0]) {
      sel.value = preferred[0].id;
      state.filter = preferred[0].id;
    }
    els.filterHint.textContent = filterOverride
      ? "已手動選擇濾紙（可改回建議）。"
      : "已跟濾杯篩選；仍可選「其他」。";
  }

  // ——— Bean UI populate ———
  function fillSelect(sel, items, selected) {
    sel.innerHTML = "";
    items.forEach((item) => {
      const o = document.createElement("option");
      o.value = item;
      o.textContent = item;
      if (selected === item || (Array.isArray(selected) && selected.indexOf(item) >= 0)) {
        o.selected = true;
      }
      sel.appendChild(o);
    });
  }

  function fillProcessSelect() {
    const sel = els.process;
    sel.innerHTML = "";
    BD.PROCESSES.forEach((g) => {
      const og = document.createElement("optgroup");
      og.label = g.group;
      g.items.forEach((item) => {
        const o = document.createElement("option");
        o.value = item;
        o.textContent = item;
        if ((state.bean.processes || [])[0] === item) o.selected = true;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    if (state.bean.processes && state.bean.processes[0]) {
      sel.value = state.bean.processes[0];
    }
  }

  function fillFlavorSelect() {
    const sel = els.flavorSelect;
    sel.innerHTML = "";
    BD.FLAVORS.forEach((g) => {
      const og = document.createElement("optgroup");
      og.label = g.group;
      g.items.forEach((item) => {
        const o = document.createElement("option");
        o.value = item;
        o.textContent = item;
        if ((state.bean.flavors || []).indexOf(item) >= 0) o.selected = true;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    renderFlavorChips();
  }

  function renderFlavorChips() {
    const box = els.flavorChips;
    const selected = state.bean.flavors || [];
    // show selected as removable chips + a few common
    box.innerHTML = selected
      .map(
        (f) =>
          '<button type="button" class="chip active flavor-chip" data-flavor="' +
          f +
          '">' +
          f +
          " ×</button>"
      )
      .join("");
  }

  function renderTendencyChips() {
    const box = els.tendencyChips;
    const selected = new Set(state.bean.tendencies || []);
    box.innerHTML = BD.TENDENCIES.map((t) => {
      const on = selected.has(t);
      return (
        '<button type="button" class="chip' +
        (on ? " active" : "") +
        ' tendency-chip" data-tendency="' +
        t +
        '" aria-pressed="' +
        on +
        '">' +
        t +
        "</button>"
      );
    }).join("");
  }

  function renderQuickPresets() {
    const box = els.beanQuickPresets;
    box.innerHTML = Object.keys(BD.QUICK_PRESETS)
      .map((key) => {
        const p = BD.QUICK_PRESETS[key];
        const on = state.bean.quickPreset === key;
        return (
          '<button type="button" class="chip' +
          (on ? " active" : "") +
          ' preset-chip" data-preset="' +
          key +
          '">' +
          p.label +
          "</button>"
        );
      })
      .join("");
  }

  function applyQuickPreset(key) {
    const p = BD.QUICK_PRESETS[key];
    if (!p) return;
    state.bean = {
      name: state.bean.name || p.label || "",
      origins: p.origins.slice(),
      varieties: p.varieties.slice(),
      processes: p.processes.slice(),
      flavors: p.flavors.slice(),
      density: p.density,
      tendencies: p.tendencies.slice(),
      roastDate: state.bean.roastDate || "",
      notes: state.bean.notes || "",
      savedId: "",
      quickPreset: key,
    };
    state.temp = p.temp;
    const sug = suggestedGrindS3(state.dose, state.iced);
    if (state.grinder === "s3") state.grind = sug;
    else state.grind = s3ToOde(sug);
    syncBeanControls();
    setBeanSaveStatus("已套用範本「" + p.label + "」— 可改名後儲存");
    render();
  }

  function syncBeanControls() {
    if (els.beanName) els.beanName.value = state.bean.name || "";
    if (els.roastDate) els.roastDate.value = state.bean.roastDate || "";
    if (els.beanNotes) els.beanNotes.value = state.bean.notes || "";
    fillSelect(els.origin, BD.ORIGINS, (state.bean.origins || [])[0]);
    fillVarietyOptions((state.bean.varieties || [])[0]);
    fillProcessSelect();
    fillFlavorSelect();
    els.density.value = state.bean.density || "medium";
    renderTendencyChips();
    renderQuickPresets();
    renderMyBeans();
    syncBeanActionButtons();
  }

  function uid() {
    return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadMyBeans() {
    try {
      const raw = localStorage.getItem(BEANS_STORAGE_KEY);
      if (!raw) {
        myBeans = [];
        return;
      }
      const data = JSON.parse(raw);
      myBeans = Array.isArray(data) ? data.filter((b) => b && b.id && b.name) : [];
    } catch (_) {
      myBeans = [];
    }
  }

  function persistMyBeans() {
    try {
      localStorage.setItem(BEANS_STORAGE_KEY, JSON.stringify(myBeans));
    } catch (_) {}
  }

  function setBeanSaveStatus(msg) {
    if (!els.beanSaveStatus) return;
    els.beanSaveStatus.textContent = msg || "";
  }

  function syncBeanActionButtons() {
    const has = !!(state.bean.savedId && myBeans.some((b) => b.id === state.bean.savedId));
    if (els.beanUpdateBtn) els.beanUpdateBtn.disabled = !has;
    if (els.beanDeleteBtn) els.beanDeleteBtn.disabled = !has;
  }

  function collectBeanForm() {
    return {
      name: (els.beanName && els.beanName.value || state.bean.name || "").trim(),
      origins: state.bean.origins ? state.bean.origins.slice() : [],
      varieties: state.bean.varieties ? state.bean.varieties.slice() : [],
      processes: state.bean.processes ? state.bean.processes.slice() : [],
      flavors: state.bean.flavors ? state.bean.flavors.slice() : [],
      density: state.bean.density || "medium",
      tendencies: state.bean.tendencies ? state.bean.tendencies.slice() : [],
      roastDate: (els.roastDate && els.roastDate.value) || state.bean.roastDate || "",
      notes: (els.beanNotes && els.beanNotes.value || state.bean.notes || "").trim(),
    };
  }

  function applyBeanRecord(rec, opts) {
    opts = opts || {};
    state.bean = {
      name: rec.name || "",
      origins: (rec.origins || []).slice(),
      varieties: (rec.varieties || []).slice(),
      processes: (rec.processes || []).slice(),
      flavors: (rec.flavors || []).slice(),
      density: rec.density || "medium",
      tendencies: (rec.tendencies || []).slice(),
      roastDate: rec.roastDate || "",
      notes: rec.notes || "",
      savedId: opts.asSaved ? (rec.id || "") : "",
      quickPreset: "",
    };
    if (opts.applyHeuristics !== false) {
      const h = beanHeuristics();
      state.temp = h.temp;
      const sug = suggestedGrindS3(state.dose, state.iced);
      if (state.grinder === "s3") state.grind = sug;
      else state.grind = s3ToOde(sug);
    }
    syncBeanControls();
    render();
  }

  function renderMyBeans() {
    if (!els.myBeansList) return;
    const empty = !myBeans.length;
    if (els.myBeansEmpty) els.myBeansEmpty.classList.toggle("hidden", !empty);
    if (empty) {
      els.myBeansList.innerHTML = "";
      return;
    }
    els.myBeansList.innerHTML = myBeans
      .slice()
      .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
      .map((b) => {
        const on = state.bean.savedId === b.id;
        const label = b.name || "未命名";
        return (
          '<button type="button" class="chip my-bean-chip' +
          (on ? " active" : "") +
          '" data-bean-id="' +
          b.id +
          '" aria-pressed="' +
          on +
          '" title="' +
          label +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");
  }

  function saveCurrentBeanAsNew() {
    const form = collectBeanForm();
    if (!form.name) {
      setBeanSaveStatus("請先填豆名／筆記名稱");
      if (els.beanName) els.beanName.focus();
      return;
    }
    const rec = {
      id: uid(),
      name: form.name,
      origin: (form.origins || [])[0] || "",
      origins: form.origins,
      variety: (form.varieties || [])[0] || "",
      varieties: form.varieties,
      process: (form.processes || [])[0] || "",
      processes: form.processes,
      flavors: form.flavors,
      density: form.density,
      tendencies: form.tendencies,
      roastDate: form.roastDate || undefined,
      notes: form.notes || undefined,
      savedAt: new Date().toISOString(),
    };
    myBeans.push(rec);
    persistMyBeans();
    state.bean.name = form.name;
    state.bean.roastDate = form.roastDate;
    state.bean.notes = form.notes;
    state.bean.savedId = rec.id;
    state.bean.quickPreset = "";
    renderMyBeans();
    syncBeanActionButtons();
    setBeanSaveStatus("已儲存「" + rec.name + "」");
    save();
  }

  function updateCurrentBean() {
    const id = state.bean.savedId;
    const idx = myBeans.findIndex((b) => b.id === id);
    if (idx < 0) {
      setBeanSaveStatus("未揀到已儲存嘅豆，請先儲存或撳「我嘅豆」");
      return;
    }
    const form = collectBeanForm();
    if (!form.name) {
      setBeanSaveStatus("請先填豆名／筆記名稱");
      if (els.beanName) els.beanName.focus();
      return;
    }
    const prev = myBeans[idx];
    myBeans[idx] = {
      id: prev.id,
      name: form.name,
      origin: (form.origins || [])[0] || "",
      origins: form.origins,
      variety: (form.varieties || [])[0] || "",
      varieties: form.varieties,
      process: (form.processes || [])[0] || "",
      processes: form.processes,
      flavors: form.flavors,
      density: form.density,
      tendencies: form.tendencies,
      roastDate: form.roastDate || undefined,
      notes: form.notes || undefined,
      savedAt: new Date().toISOString(),
    };
    persistMyBeans();
    state.bean.name = form.name;
    state.bean.roastDate = form.roastDate;
    state.bean.notes = form.notes;
    renderMyBeans();
    syncBeanActionButtons();
    setBeanSaveStatus("已更新「" + form.name + "」");
    save();
  }

  function deleteCurrentBean() {
    const id = state.bean.savedId;
    const idx = myBeans.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const name = myBeans[idx].name;
    myBeans.splice(idx, 1);
    persistMyBeans();
    state.bean.savedId = "";
    renderMyBeans();
    syncBeanActionButtons();
    setBeanSaveStatus("已刪除「" + name + "」");
    save();
  }

  function exportMyBeans() {
    const blob = new Blob([JSON.stringify(myBeans, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "brew-simulator-beans.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
    setBeanSaveStatus("已匯出 " + myBeans.length + " 隻豆");
  }

  function importMyBeansFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(data)) throw new Error("not array");
        let added = 0;
        data.forEach((raw) => {
          if (!raw || typeof raw !== "object") return;
          const name = String(raw.name || "").trim();
          if (!name) return;
          const origins = Array.isArray(raw.origins)
            ? raw.origins
            : raw.origin
            ? [raw.origin]
            : [];
          const varieties = Array.isArray(raw.varieties)
            ? raw.varieties
            : raw.variety
            ? [raw.variety]
            : [];
          const processes = Array.isArray(raw.processes)
            ? raw.processes
            : raw.process
            ? [raw.process]
            : [];
          const rec = {
            id: uid(),
            name: name,
            origin: origins[0] || "",
            origins: origins,
            variety: varieties[0] || "",
            varieties: varieties,
            process: processes[0] || "",
            processes: processes,
            flavors: Array.isArray(raw.flavors) ? raw.flavors : [],
            density: raw.density || "medium",
            tendencies: Array.isArray(raw.tendencies) ? raw.tendencies : [],
            roastDate: raw.roastDate || undefined,
            notes: raw.notes || undefined,
            savedAt: raw.savedAt || new Date().toISOString(),
          };
          myBeans.push(rec);
          added += 1;
        });
        persistMyBeans();
        renderMyBeans();
        setBeanSaveStatus("已匯入 " + added + " 隻豆");
      } catch (_) {
        setBeanSaveStatus("匯入失敗：請用匯出嘅 JSON");
      }
    };
    reader.readAsText(file);
  }

  function fillVarietyOptions(selected, filterText) {
    const sel = els.variety;
    const q = (filterText || "").trim().toLowerCase();
    const list = q
      ? BD.VARIETIES.filter((v) => v.toLowerCase().indexOf(q) >= 0)
      : BD.VARIETIES;
    fillSelect(sel, list.length ? list : BD.VARIETIES, selected || (state.bean.varieties || [])[0]);
  }

  function populateRecipes() {
    const sel = els.recipePick;
    // keep first empty option
    while (sel.options.length > 1) sel.remove(1);
    const byCat = {};
    RD.RECIPES.forEach((r) => {
      if (!byCat[r.category]) byCat[r.category] = [];
      byCat[r.category].push(r);
    });
    Object.keys(byCat).forEach((cat) => {
      const og = document.createElement("optgroup");
      og.label = RD.CATEGORY_LABELS[cat] || cat;
      byCat[cat].forEach((r) => {
        const o = document.createElement("option");
        o.value = r.id;
        o.textContent = r.name;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    sel.value = state.recipeId || "";
  }

  function applyRecipe(id) {
    const r = RD.RECIPES.find((x) => x.id === id);
    if (!r) {
      state.recipeId = "";
      els.teachingCard.classList.add("hidden");
      render();
      return;
    }
    state.recipeId = id;
    state.dose = r.dose;
    state.water = r.water;
    state.ratio = r.water / r.dose;
    state.temp = r.temp;
    state.brewer = r.brewer;
    state.filter = r.filter;
    filterOverride = true;
    if (r.pourStyle) state.pourStyle = r.pourStyle;
    if (r.kasuya46Mode) state.kasuya46Mode = r.kasuya46Mode;
    if (r.pourStyle === "kasuya46") {
      state.kasuya46Mode = r.kasuya46Mode || state.kasuya46Mode || "balanced";
      state.bloomWait = getKasuya46Mode().bloomSec;
    } else if (r.bloomWait != null) {
      state.bloomWait = r.bloomWait;
    }
    if (r.brewStyle) state.brewStyle = r.brewStyle;
    if (r.switchMode) state.switchMode = r.switchMode;
    if (r.immersionHold != null) state.immersionHold = r.immersionHold;
    if (r.coldSteepHours != null) state.coldSteepHours = r.coldSteepHours;
    state.iced = !!r.iced || r.brewStyle === "iced";
    // nudge grind from hint coarsely
    const sug = suggestedGrindS3(state.dose, state.iced);
    if (state.grinder === "s3") state.grind = sug;
    else state.grind = s3ToOde(sug);

    showTeaching(r);
    populateFilterSelect(r.filter);
    render();
  }

  function buildKasuya46TeachingSteps(waterHot) {
    const mode = getKasuya46Mode();
    const pours = scaleKasuya46Pours(waterHot, mode);
    let cum = 0;
    return pours.map((add, i) => {
      cum += add;
      const t = mode.times[i];
      const mm = Math.floor(t / 60);
      const ss = String(t % 60).padStart(2, "0");
      return {
        time: mm + ":" + ss,
        add: add,
        total: cum,
        instruction: mode.notes[i],
      };
    });
  }

  function showTeaching(r) {
    if (!r) {
      els.teachingCard.classList.add("hidden");
      if (els.teachingLink) {
        els.teachingLink.classList.add("hidden");
        els.teachingLink.innerHTML = "";
      }
      return;
    }
    els.teachingCard.classList.remove("hidden");
    const mode = r.pourStyle === "kasuya46" ? getKasuya46Mode() : null;
    const dose = Number(state.dose) || r.dose;
    const water = state.lockRatio
      ? round0(dose * state.ratio)
      : Number(state.water) || r.water;
    const nameExtra = mode ? " · " + mode.label : "";
    els.teachingName.textContent = r.name + nameExtra;
    const drip =
      mode
        ? "滴完約 " + fmtTimeSec(mode.dripLo) + "–" + fmtTimeSec(mode.dripHi)
        : r.totalTime || "";
    els.teachingMeta.textContent =
      dose + "g / " + water + "g · " + state.temp + "°C · " +
      (BREWER_META[state.brewer] || BREWER_META[r.brewer] || {}).label + " · " +
      (FILTERS.find((f) => f.id === (state.filter || r.filter)) || {}).label +
      (r.grindHint ? " · 研磨：" + r.grindHint : "") +
      (drip ? " · " + drip : "") +
      (mode ? " · 基準 20g/300ml 線性縮放" : "");

    let steps = r.steps || [];
    if (r.pourStyle === "kasuya46") {
      steps = buildKasuya46TeachingSteps(water);
    }
    els.teachingSteps.innerHTML = steps
      .map(
        (s) =>
          "<li><strong>" +
          s.time +
          "</strong> — " +
          (s.add ? "+" + s.add + "g（累計 " + s.total + "g）· " : "") +
          s.instruction +
          "</li>"
      )
      .join("");

    els.teachingNotes.innerHTML = (r.teaching || [])
      .map((t, i) => "<li>" + (i + 1) + ". " + t + "</li>")
      .join("");

    if (els.teachingLink) {
      if (r.pourStyle === "kasuya46") {
        els.teachingLink.classList.remove("hidden");
        els.teachingLink.innerHTML =
          '參考：<a href="https://www.matrix.com.tw/46-method-advanced-guide-coffee-beans-parameters" target="_blank" rel="noopener">Matrix 粕谷哲 4:6 法進階攻略</a>';
      } else {
        els.teachingLink.classList.add("hidden");
        els.teachingLink.innerHTML = "";
      }
    }
  }

  function refreshTeachingIfNeeded() {
    if (!state.recipeId) return;
    const r = RD.RECIPES.find((x) => x.id === state.recipeId);
    if (!r) return;
    if (r.pourStyle === "kasuya46" || state.pourStyle === "kasuya46") {
      showTeaching(r);
    }
  }

  function updateStyleVisibility() {
    const style = state.brewStyle;
    const showPour = style === "pour-over" || style === "iced";
    const showBloom = style !== "cold";
    const showCold = style === "cold";
    const showSwitch = usesValveControls(state.brewer);
    const showImmersionHold =
      showSwitch && state.switchMode !== "full-flow" ||
      (style === "immersion" && (BREWER_META[state.brewer] || {}).isImmersion);

    els.pourStyleRow.classList.toggle("hidden", !showPour && style !== "immersion");
    if (els.kasuya46ModeRow) {
      const show46 = showPour && state.pourStyle === "kasuya46";
      els.kasuya46ModeRow.classList.toggle("hidden", !show46);
    }
    // 4:6 用模式自帶悶蒸節拍，隱藏通用悶蒸滑桿避免打架
    const hideBloomFor46 = state.pourStyle === "kasuya46";
    els.bloomRow.classList.toggle("hidden", !showBloom || showCold || hideBloomFor46 || (showSwitch && state.switchMode === "immersion-then-open"));
    els.coldSteepRow.classList.toggle("hidden", !showCold);
    els.icedToggleRow.classList.toggle("hidden", style === "cold" || style === "iced");
    els.tempRow.classList.toggle("hidden", showCold);
    els.switchModeRow.classList.toggle("hidden", !showSwitch);
    els.immersionHoldRow.classList.toggle("hidden", !showImmersionHold);

    if (style === "iced") state.iced = true;
    if (style === "cold") state.iced = false;
  }

  // ——— Render ———
  function syncGrindSlider() {
    const g = GRINDER[state.grinder];
    els.grind.min = g.min;
    els.grind.max = g.max;
    els.grind.step = g.step;
    state.grind = clamp(round1(state.grind), g.min, g.max);
    els.grind.value = state.grind;
    els.grindValue.textContent = state.grind.toFixed(1);
  }

  function render(opts) {
    opts = opts || {};
    const dose = Number(state.dose) || BASELINE.dose;
    let waterTotal = state.lockRatio
      ? round0(dose * state.ratio)
      : Number(state.water) || BASELINE.water;
    if (state.lockRatio) state.water = waterTotal;

    let waterHot = waterTotal;
    let iceG = 0;
    const iced = state.iced || state.brewStyle === "iced";
    if (iced) {
      const split = icedSplit(waterTotal);
      waterHot = split.hot;
      iceG = split.ice;
    }

    const suggestedS3 = suggestedGrindS3(dose, iced);
    const grindLabel =
      state.grinder === "s3"
        ? "S3 " + state.grind.toFixed(1) + "（建議 " + suggestedS3.toFixed(1) + "）"
        : "Ode " + state.grind.toFixed(1) + "（建議 S3 " + suggestedS3.toFixed(1) + " ≈ Ode " + s3ToOde(suggestedS3).toFixed(1) + "）";

    const steps = buildSchedule(
      dose,
      waterHot,
      state.pourStyle,
      state.bloomWait,
      state.brewer,
      iced
    );
    const timeRange = estimateTotalTime(dose, steps, iced, state.brewer);

    updateStyleVisibility();

    if (!opts.skipDoseInput) els.dose.value = dose;
    els.water.value = waterTotal;
    els.water.disabled = state.lockRatio;
    els.lockRatio.classList.toggle("active", state.lockRatio);
    els.lockRatio.setAttribute("aria-pressed", state.lockRatio ? "true" : "false");
    els.lockRatio.textContent = state.lockRatio ? "🔒 鎖比例" : "🔓 已解鎖";
    els.ratioDisplay.textContent = fmtRatioClean(waterTotal / dose);
    els.grinder.value = state.grinder;
    syncGrindSlider();
    els.temp.value = state.temp;
    els.tempValue.textContent = state.temp;
    els.brewer.value = state.brewer;
    if (els.filter.querySelector('option[value="' + state.filter + '"]')) {
      els.filter.value = state.filter;
    }
    els.pourStyle.value = state.pourStyle;
    if (els.kasuya46Mode) els.kasuya46Mode.value = state.kasuya46Mode || "balanced";
    if (state.pourStyle === "kasuya46") {
      state.bloomWait = getKasuya46Mode().bloomSec;
    }
    els.bloomWait.value = state.bloomWait;
    els.bloomWaitValue.textContent = state.bloomWait;
    els.brewStyle.value = state.brewStyle;
    els.switchMode.value = state.switchMode;
    els.immersionHold.value = state.immersionHold;
    els.immersionHoldValue.textContent = state.immersionHold;
    els.coldSteepHours.value = state.coldSteepHours;
    els.coldSteepValue.textContent = state.coldSteepHours;
    els.recipePick.value = state.recipeId || "";
    els.iced.setAttribute("aria-checked", iced ? "true" : "false");
    els.iced.textContent = iced ? "開" : "關";
    els.density.value = state.bean.density || "medium";

    els.outRatio.textContent = fmtRatioClean(waterTotal / dose);
    if (timeRange.cold) {
      els.outTime.textContent = state.coldSteepHours + "–" + (state.coldSteepHours + 2) + " 小時";
    } else {
      els.outTime.textContent = fmtTime(timeRange.lo) + "–" + fmtTime(timeRange.hi);
    }
    els.outGrind.textContent = grindLabel;

    if (iced) {
      els.icedStat.classList.remove("hidden");
      els.outIced.textContent = waterHot + "g / " + iceG + "g";
    } else {
      els.icedStat.classList.add("hidden");
    }

    els.tipText.textContent = buildTip(suggestedS3);

    const totalG = steps.length ? steps[steps.length - 1].cumulativeG : waterHot;
    els.schedule.innerHTML = steps
      .map((st, i) => {
        return (
          "<li>" +
          '<span class="pour-step">' + (i + 1) + "</span>" +
          '<div class="pour-info">' +
          '<span class="pour-label">' + st.label + "</span>" +
          '<span class="pour-detail">' +
          (st.pourG === 0 && st.atSec > 0 ? fmtTime(st.atSec) : fmtTime(st.atSec)) +
          (st.note ? " · " + st.note : "") +
          "</span></div>" +
          '<div class="pour-grams">' +
          (st.pourG > 0 ? "+" + st.pourG + "g" : "—") +
          "<small>累計 " + st.cumulativeG + "g</small></div>" +
          "</li>"
        );
      })
      .join("");

    if (els.pourBars) {
      els.pourBars.innerHTML = steps
        .map((st, i) => {
          const pct = totalG > 0 ? Math.min(100, Math.round((st.cumulativeG / totalG) * 100)) : 0;
          return (
            '<div class="pour-bar-row">' +
            '<span class="pour-bar-n">' + (i + 1) + "</span>" +
            '<div class="pour-bar-track"><div class="pour-bar-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="pour-bar-pct">' + pct + "%</span></div>"
          );
        })
        .join("");
    }

    // Timer keeps its own snapshot while running; only refresh availability / highlights
    syncTimerAvailability();
    if (timer.status !== "idle") {
      const elapsedSec = Math.min(timer.totalSec || 0, timerElapsedMs() / 1000);
      applyScheduleHighlights(findStepIndex(elapsedSec, timer.steps), elapsedSec);
    }

    refreshTeachingIfNeeded();

    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // migrate v1 lightly
        const v1 = localStorage.getItem("brew-simulator-v1");
        if (v1) {
          const old = JSON.parse(v1);
          state = JSON.parse(JSON.stringify(BASELINE));
          ["dose", "water", "ratio", "grinder", "grind", "temp", "pourStyle", "bloomWait", "iced", "lockRatio"].forEach((k) => {
            if (old[k] != null) state[k] = old[k];
          });
          if (old.brewer === "kalita") state.brewer = "kalita-155";
          else if (old.brewer === "ufo") state.brewer = "ufo-v3";
          else if (old.brewer) state.brewer = old.brewer;
          if (old.bean && BD.QUICK_PRESETS[old.bean]) {
            applyQuickPreset(old.bean);
          }
        }
        return;
      }
      const data = JSON.parse(raw);
      state = { ...JSON.parse(JSON.stringify(BASELINE)), ...data };
      if (!state.bean || !state.bean.origins) {
        state.bean = JSON.parse(JSON.stringify(BASELINE.bean));
      } else {
        state.bean.name = state.bean.name || "";
        state.bean.roastDate = state.bean.roastDate || "";
        state.bean.notes = state.bean.notes || "";
        state.bean.savedId = state.bean.savedId || "";
      }
    } catch (_) {}
  }


  // ——— Brew timer ———
  const timer = {
    status: "idle", // idle | running | paused | done
    steps: [],
    totalSec: 0,
    startedAt: 0,
    pausedAccum: 0,
    pauseStartedAt: 0,
    raf: 0,
    lastStepIdx: -1,
    soundEnabled: false,
  };

  function getCurrentStepsAndTotal() {
    const dose = Number(state.dose) || BASELINE.dose;
    let waterTotal = state.lockRatio
      ? round0(dose * state.ratio)
      : Number(state.water) || BASELINE.water;
    let waterHot = waterTotal;
    const iced = state.iced || state.brewStyle === "iced";
    if (iced) waterHot = icedSplit(waterTotal).hot;
    const steps = buildSchedule(
      dose, waterHot, state.pourStyle, state.bloomWait, state.brewer, iced
    );
    const timeRange = estimateTotalTime(dose, steps, iced, state.brewer);
    let totalSec = timeRange.cold
      ? 0
      : Math.round((timeRange.lo + timeRange.hi) / 2);
    if (!timeRange.cold && steps.length) {
      const lastAt = steps[steps.length - 1].atSec || 0;
      totalSec = Math.max(totalSec, lastAt + 15);
    }
    return { steps: steps.slice(), totalSec: totalSec, cold: !!timeRange.cold };
  }

  function timerElapsedMs() {
    if (timer.status === "idle") return 0;
    if (timer.status === "paused") {
      return timer.pausedAccum;
    }
    if (timer.status === "done") {
      return timer.totalSec * 1000;
    }
    return timer.pausedAccum + (performance.now() - timer.startedAt);
  }

  function findStepIndex(elapsedSec, steps) {
    if (!steps.length) return -1;
    let idx = 0;
    for (let i = 0; i < steps.length; i++) {
      if (elapsedSec >= steps[i].atSec) idx = i;
    }
    return idx;
  }

  function stepEndSec(steps, idx, totalSec) {
    if (idx < 0 || idx >= steps.length) return totalSec;
    if (idx + 1 < steps.length) return steps[idx + 1].atSec;
    return totalSec;
  }

  function buildStepLabel(steps, idx, elapsedSec, totalSec) {
    if (timer.status === "done") return "完成 · 可以享用";
    if (idx < 0 || !steps.length) return "準備開始";
    const st = steps[idx];
    const end = stepEndSec(steps, idx, totalSec);
    const remain = Math.max(0, Math.ceil(end - elapsedSec));
    const isBloom =
      /悶蒸|第一段|關閥悶蒸|混合|注滿|關閥注水/.test(st.label) ||
      (idx === 0 && st.pourG > 0);
    if (timer.status === "paused") {
      return "已暫停 · " + st.label;
    }
    if (isBloom && idx === 0 && steps.length > 1) {
      return st.label + " 還有 " + remain + "s";
    }
    if (st.pourG > 0) {
      return st.label + " · 目標累計 " + st.cumulativeG + "g";
    }
    if (remain > 0 && idx < steps.length - 1) {
      return st.label + " 還有 " + remain + "s";
    }
    return st.label + (st.note ? " · " + st.note : "");
  }

  function optionalBeep() {
    if (!timer.soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.13);
      setTimeout(() => ctx.close(), 200);
    } catch (_) {}
  }

  function renderTimerSegments(steps, elapsedSec, totalSec, activeIdx) {
    if (!els.timerSegments) return;
    if (!steps.length) {
      els.timerSegments.innerHTML = "";
      return;
    }
    const parts = steps.map((st, i) => {
      const start = st.atSec;
      const end = stepEndSec(steps, i, totalSec);
      const dur = Math.max(1, end - start);
      let fill = 0;
      if (elapsedSec >= end) fill = 100;
      else if (elapsedSec > start) fill = ((elapsedSec - start) / dur) * 100;
      const cls =
        "timer-seg" +
        (i === activeIdx && timer.status !== "done" ? " is-active" : "") +
        (elapsedSec >= end || (timer.status === "done" && i <= activeIdx) ? " is-done" : "");
      return (
        '<div class="' + cls + '" role="listitem" style="flex:' + dur + ' 1 0">' +
        '<div class="timer-seg-track"><div class="timer-seg-fill" style="width:' +
        Math.min(100, fill).toFixed(1) +
        '%"></div></div>' +
        '<span class="timer-seg-name">' + st.label + "</span></div>"
      );
    });
    els.timerSegments.innerHTML = parts.join("");
  }

  function applyScheduleHighlights(activeIdx, elapsedSec) {
    if (!els.schedule) return;
    const items = els.schedule.querySelectorAll("li");
    items.forEach((li, i) => {
      const st = timer.steps[i];
      const started = st ? elapsedSec >= st.atSec : false;
      const end = stepEndSec(timer.steps, i, timer.totalSec);
      const done = st ? elapsedSec >= end : false;
      li.classList.toggle("is-active", timer.status !== "idle" && i === activeIdx && timer.status !== "done");
      li.classList.toggle("is-done", timer.status !== "idle" && (done || timer.status === "done"));
      if (timer.status === "idle") {
        li.classList.remove("is-active", "is-done");
      }
    });
  }

  function updateTimerUI() {
    const elapsedMs = timerElapsedMs();
    const elapsedSec = Math.min(timer.totalSec || 0, elapsedMs / 1000);
    const clock = fmtTime(Math.floor(elapsedSec));
    const pct = timer.totalSec > 0
      ? Math.min(100, Math.round((elapsedSec / timer.totalSec) * 100))
      : 0;
    const idx = findStepIndex(elapsedSec, timer.steps);
    const label = buildStepLabel(timer.steps, idx, elapsedSec, timer.totalSec);

    if (els.timerClock) els.timerClock.textContent = clock;
    if (els.timerStickyClock) els.timerStickyClock.textContent = clock;
    if (els.timerStepLabel) els.timerStepLabel.textContent = label;
    if (els.timerStickyLabel) els.timerStickyLabel.textContent = label;
    if (els.timerOverallFill) els.timerOverallFill.style.width = pct + "%";
    if (els.timerOverallPct) els.timerOverallPct.textContent = pct + "%";

    let statusText = "待機";
    if (timer.status === "running") statusText = "進行中";
    else if (timer.status === "paused") statusText = "已暫停";
    else if (timer.status === "done") statusText = "完成";
    if (els.timerStatus) els.timerStatus.textContent = statusText;

    renderTimerSegments(timer.steps, elapsedSec, timer.totalSec, idx);
    applyScheduleHighlights(idx, elapsedSec);

    // sticky button label
    if (els.timerStickyBtn) {
      if (timer.status === "idle") els.timerStickyBtn.textContent = "開始";
      else if (timer.status === "running") els.timerStickyBtn.textContent = "暫停";
      else if (timer.status === "paused") els.timerStickyBtn.textContent = "繼續";
      else els.timerStickyBtn.textContent = "重設";
    }

    // control visibility
    const running = timer.status === "running";
    const paused = timer.status === "paused";
    const done = timer.status === "done";
    const active = timer.status !== "idle";
    if (els.timerPanel) els.timerPanel.classList.toggle("hidden", !active && timer.status === "idle");
    // keep panel visible once started until reset — also show when idle? no, only after start
    if (els.timerPauseBtn) els.timerPauseBtn.classList.toggle("hidden", !running);
    if (els.timerResumeBtn) els.timerResumeBtn.classList.toggle("hidden", !paused);
    if (els.timerStartBtn) {
      els.timerStartBtn.classList.toggle("is-running", active && !done);
      if (done) els.timerStartBtn.textContent = "再來一次";
      else if (active) els.timerStartBtn.textContent = "沖煮中…";
      else els.timerStartBtn.textContent = "開始沖煮";
      els.timerStartBtn.disabled = running || paused;
    }

    if (idx !== timer.lastStepIdx && timer.status === "running") {
      if (timer.lastStepIdx >= 0) optionalBeep();
      timer.lastStepIdx = idx;
    }
  }

  function timerTick() {
    if (timer.status !== "running") return;
    const elapsedMs = timerElapsedMs();
    if (elapsedMs >= timer.totalSec * 1000) {
      timerFinish();
      return;
    }
    updateTimerUI();
    timer.raf = requestAnimationFrame(timerTick);
  }

  function timerFinish() {
    timer.status = "done";
    if (timer.raf) cancelAnimationFrame(timer.raf);
    timer.raf = 0;
    timer.lastStepIdx = timer.steps.length - 1;
    updateTimerUI();
    if (els.timerStepLabel) els.timerStepLabel.textContent = "完成 · 可以享用";
    if (els.timerStickyLabel) els.timerStickyLabel.textContent = "完成";
    if (els.timerStartBtn) {
      els.timerStartBtn.disabled = false;
      els.timerStartBtn.textContent = "再來一次";
      els.timerStartBtn.classList.remove("is-running");
    }
  }

  function timerStart() {
    const snap = getCurrentStepsAndTotal();
    if (snap.cold || snap.totalSec <= 0 || !snap.steps.length) {
      syncTimerAvailability();
      return;
    }
    if (timer.status === "done" || timer.status === "idle") {
      timer.steps = snap.steps;
      timer.totalSec = snap.totalSec;
      timer.pausedAccum = 0;
      timer.lastStepIdx = -1;
    }
    timer.status = "running";
    timer.startedAt = performance.now();
    if (els.timerPanel) els.timerPanel.classList.remove("hidden");
    showTimerSticky(true);
    updateTimerUI();
    if (timer.raf) cancelAnimationFrame(timer.raf);
    timer.raf = requestAnimationFrame(timerTick);
  }

  function timerPause() {
    if (timer.status !== "running") return;
    timer.pausedAccum += performance.now() - timer.startedAt;
    timer.status = "paused";
    if (timer.raf) cancelAnimationFrame(timer.raf);
    timer.raf = 0;
    updateTimerUI();
  }

  function timerResume() {
    if (timer.status !== "paused") return;
    timer.status = "running";
    timer.startedAt = performance.now();
    updateTimerUI();
    timer.raf = requestAnimationFrame(timerTick);
  }

  function timerReset() {
    if (timer.raf) cancelAnimationFrame(timer.raf);
    timer.raf = 0;
    timer.status = "idle";
    timer.steps = [];
    timer.totalSec = 0;
    timer.pausedAccum = 0;
    timer.startedAt = 0;
    timer.lastStepIdx = -1;
    if (els.timerPanel) els.timerPanel.classList.add("hidden");
    if (els.timerClock) els.timerClock.textContent = "0:00";
    if (els.timerOverallFill) els.timerOverallFill.style.width = "0%";
    if (els.timerOverallPct) els.timerOverallPct.textContent = "0%";
    if (els.timerStepLabel) els.timerStepLabel.textContent = "按「開始沖煮」跟住時間表";
    if (els.timerStatus) els.timerStatus.textContent = "待機";
    if (els.timerSegments) els.timerSegments.innerHTML = "";
    if (els.timerStartBtn) {
      els.timerStartBtn.disabled = false;
      els.timerStartBtn.textContent = "開始沖煮";
      els.timerStartBtn.classList.remove("is-running");
    }
    applyScheduleHighlights(-1, 0);
    showTimerSticky(true);
    syncTimerAvailability();
    updateStickyIdle();
  }

  function updateStickyIdle() {
    if (!els.timerStickyClock) return;
    if (timer.status === "idle") {
      els.timerStickyClock.textContent = "0:00";
      els.timerStickyLabel.textContent = "準備開始";
      els.timerStickyBtn.textContent = "開始";
    }
  }

  function showTimerSticky(force) {
    if (!els.timerSticky) return;
    const cold = state.brewStyle === "cold";
    const show = !cold && (force || true);
    els.timerSticky.hidden = !show || cold;
    document.body.classList.toggle("has-timer-sticky", show && !cold);
  }

  function syncTimerAvailability() {
    const cold = state.brewStyle === "cold";
    if (els.timerColdHint) els.timerColdHint.classList.toggle("hidden", !cold);
    if (els.timerStartBtn) {
      if (cold) {
        els.timerStartBtn.disabled = true;
        els.timerStartBtn.textContent = "冷萃無需計時";
      } else if (timer.status === "idle") {
        els.timerStartBtn.disabled = false;
        els.timerStartBtn.textContent = "開始沖煮";
      }
    }
    showTimerSticky(true);
    if (cold && timer.status !== "idle") timerReset();
  }

  function wireTimerControls() {
    if (!els.timerStartBtn) return;
    els.timerStartBtn.addEventListener("click", () => {
      if (timer.status === "done") timerReset();
      if (timer.status === "idle") timerStart();
    });
    els.timerPauseBtn.addEventListener("click", timerPause);
    els.timerResumeBtn.addEventListener("click", timerResume);
    els.timerResetBtn.addEventListener("click", timerReset);
    els.timerStickyBtn.addEventListener("click", () => {
      if (timer.status === "idle") timerStart();
      else if (timer.status === "running") timerPause();
      else if (timer.status === "paused") timerResume();
      else if (timer.status === "done") timerReset();
    });
  }

  // ——— Events ———
  function onDoseChange() {
    const raw = String(els.dose.value).trim();
    if (raw === "" || raw === "." || raw === "-") return; // 打緊字唔好夾死
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const dose = clamp(n, 1, 80);
    state.dose = dose;
    if (state.lockRatio) state.water = round0(dose * state.ratio);
    else state.ratio = state.water / dose;
    // 唔好喺 input 途中改返 input 值，等 change/blur 先對齊
    render({ skipDoseInput: true });
  }

  function onDoseCommit() {
    const raw = String(els.dose.value).trim();
    const n = Number(raw);
    const dose = clamp(Number.isFinite(n) && raw !== "" ? n : state.dose || BASELINE.dose, 1, 80);
    state.dose = dose;
    if (state.lockRatio) state.water = round0(dose * state.ratio);
    else state.ratio = state.water / dose;
    render();
  }
  function onWaterChange() {
    if (state.lockRatio) return;
    const water = clamp(Number(els.water.value) || BASELINE.water, 15, 1000);
    state.water = water;
    state.ratio = water / (Number(state.dose) || BASELINE.dose);
    render();
  }

  els.dose.addEventListener("input", onDoseChange);
  els.dose.addEventListener("change", onDoseCommit);
  els.dose.addEventListener("blur", onDoseCommit);
  els.water.addEventListener("input", onWaterChange);
  els.water.addEventListener("change", onWaterChange);

  els.lockRatio.addEventListener("click", () => {
    state.lockRatio = !state.lockRatio;
    if (state.lockRatio) {
      state.ratio = state.water / state.dose;
      state.water = round0(state.dose * state.ratio);
    }
    render();
  });

  els.grinder.addEventListener("change", () => {
    const next = els.grinder.value;
    if (state.grinder === "s3" && next === "ode") state.grind = s3ToOde(state.grind);
    else if (state.grinder === "ode" && next === "s3") state.grind = odeToS3(state.grind);
    state.grinder = next;
    render();
  });

  els.grind.addEventListener("input", () => {
    state.grind = round1(Number(els.grind.value));
    els.grindValue.textContent = state.grind.toFixed(1);
    render();
  });

  els.temp.addEventListener("input", () => {
    state.temp = Number(els.temp.value);
    els.tempValue.textContent = state.temp;
    render();
  });

  els.brewer.addEventListener("change", () => {
    state.brewer = els.brewer.value;
    filterOverride = false;
    if (isUfo(state.brewer)) {
      state.bloomWait = Math.max(state.bloomWait, 60);
      if (state.pourStyle === "3pour") state.pourStyle = "ufo-official";
    }
    if (isSwitch(state.brewer) && state.brewStyle === "pour-over") {
      // keep style; show switch controls
    }
    if ((BREWER_META[state.brewer] || {}).isImmersion) {
      state.brewStyle = "immersion";
    }
    populateFilterSelect();
    render();
  });

  els.filter.addEventListener("change", () => {
    state.filter = els.filter.value;
    filterOverride = true;
    render();
  });

  els.pourStyle.addEventListener("change", () => {
    state.pourStyle = els.pourStyle.value;
    if (state.pourStyle === "kasuya46") {
      state.bloomWait = getKasuya46Mode().bloomSec;
      // 跟住教學卡：若未揀配方就套用粕谷哲 4:6
      if (!state.recipeId || state.recipeId === "kasuya-46") {
        const r = RD.RECIPES.find((x) => x.id === "kasuya-46");
        if (r) {
          state.recipeId = "kasuya-46";
          if (els.recipePick) els.recipePick.value = "kasuya-46";
          showTeaching(r);
        }
      }
    }
    render();
  });

  if (els.kasuya46Mode) {
    els.kasuya46Mode.addEventListener("change", () => {
      state.kasuya46Mode = els.kasuya46Mode.value;
      state.pourStyle = "kasuya46";
      state.bloomWait = getKasuya46Mode().bloomSec;
      if (!state.recipeId) {
        state.recipeId = "kasuya-46";
        if (els.recipePick) els.recipePick.value = "kasuya-46";
      }
      const r = RD.RECIPES.find((x) => x.id === "kasuya-46");
      if (r) showTeaching(r);
      render();
    });
  }

  els.bloomWait.addEventListener("input", () => {
    state.bloomWait = Number(els.bloomWait.value);
    els.bloomWaitValue.textContent = state.bloomWait;
    render();
  });

  els.iced.addEventListener("click", () => {
    state.iced = !state.iced;
    if (state.iced) state.brewStyle = "iced";
    else if (state.brewStyle === "iced") state.brewStyle = "pour-over";
    render();
  });

  els.brewStyle.addEventListener("change", () => {
    state.brewStyle = els.brewStyle.value;
    if (state.brewStyle === "iced") state.iced = true;
    if (state.brewStyle === "cold") {
      state.iced = false;
      // suggest coarser
      const sug = suggestedGrindS3(state.dose, false);
      if (state.grinder === "s3") state.grind = sug;
      else state.grind = s3ToOde(sug);
    }
    render();
  });

  els.switchMode.addEventListener("change", () => {
    state.switchMode = els.switchMode.value;
    render();
  });

  els.immersionHold.addEventListener("input", () => {
    state.immersionHold = Number(els.immersionHold.value);
    els.immersionHoldValue.textContent = state.immersionHold;
    render();
  });

  els.coldSteepHours.addEventListener("input", () => {
    state.coldSteepHours = Number(els.coldSteepHours.value);
    els.coldSteepValue.textContent = state.coldSteepHours;
    render();
  });

  els.recipePick.addEventListener("change", () => {
    const id = els.recipePick.value;
    if (!id) {
      state.recipeId = "";
      els.teachingCard.classList.add("hidden");
      render();
      return;
    }
    applyRecipe(id);
  });

  els.origin.addEventListener("change", () => {
    state.bean.origins = [els.origin.value];
    state.bean.quickPreset = "";
    // soft-suggest density / tendencies
    state.bean.density = BD.suggestDensity(state.bean.origins, state.bean.processes);
    state.bean.tendencies = BD.suggestTendencies(
      state.bean.origins, state.bean.varieties, state.bean.processes, state.bean.flavors
    );
    const h = beanHeuristics();
    state.temp = h.temp;
    els.density.value = state.bean.density;
    renderTendencyChips();
    renderQuickPresets();
    render();
  });

  els.varietySearch.addEventListener("input", () => {
    fillVarietyOptions((state.bean.varieties || [])[0], els.varietySearch.value);
  });

  els.variety.addEventListener("change", () => {
    state.bean.varieties = [els.variety.value];
    state.bean.quickPreset = "";
    state.bean.tendencies = BD.suggestTendencies(
      state.bean.origins, state.bean.varieties, state.bean.processes, state.bean.flavors
    );
    const h = beanHeuristics();
    state.temp = h.temp;
    renderTendencyChips();
    renderQuickPresets();
    render();
  });

  els.process.addEventListener("change", () => {
    state.bean.processes = [els.process.value];
    state.bean.quickPreset = "";
    state.bean.density = BD.suggestDensity(state.bean.origins, state.bean.processes);
    state.bean.tendencies = BD.suggestTendencies(
      state.bean.origins, state.bean.varieties, state.bean.processes, state.bean.flavors
    );
    const h = beanHeuristics();
    state.temp = h.temp;
    els.density.value = state.bean.density;
    renderTendencyChips();
    renderQuickPresets();
    render();
  });

  els.density.addEventListener("change", () => {
    state.bean.density = els.density.value;
    state.bean.quickPreset = "";
    const h = beanHeuristics();
    state.temp = h.temp;
    const sug = suggestedGrindS3(state.dose, state.iced);
    if (state.grinder === "s3") state.grind = sug;
    else state.grind = s3ToOde(sug);
    renderQuickPresets();
    render();
  });

  els.flavorSelect.addEventListener("change", () => {
    const selected = Array.from(els.flavorSelect.selectedOptions).map((o) => o.value);
    state.bean.flavors = selected;
    state.bean.quickPreset = "";
    renderFlavorChips();
    renderQuickPresets();
    render();
  });

  els.flavorChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".flavor-chip");
    if (!btn) return;
    const f = btn.getAttribute("data-flavor");
    state.bean.flavors = (state.bean.flavors || []).filter((x) => x !== f);
    // sync multi select
    Array.from(els.flavorSelect.options).forEach((o) => {
      o.selected = state.bean.flavors.indexOf(o.value) >= 0;
    });
    renderFlavorChips();
    render();
  });

  els.tendencyChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".tendency-chip");
    if (!btn) return;
    const t = btn.getAttribute("data-tendency");
    const set = new Set(state.bean.tendencies || []);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    state.bean.tendencies = Array.from(set);
    state.bean.quickPreset = "";
    const h = beanHeuristics();
    state.temp = h.temp;
    renderTendencyChips();
    renderQuickPresets();
    render();
  });

  els.beanQuickPresets.addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-chip");
    if (!btn) return;
    applyQuickPreset(btn.getAttribute("data-preset"));
  });

  if (els.beanName) {
    els.beanName.addEventListener("input", () => {
      state.bean.name = els.beanName.value;
      save();
    });
  }
  if (els.roastDate) {
    els.roastDate.addEventListener("change", () => {
      state.bean.roastDate = els.roastDate.value;
      save();
    });
  }
  if (els.beanNotes) {
    els.beanNotes.addEventListener("input", () => {
      state.bean.notes = els.beanNotes.value;
      save();
    });
  }
  if (els.myBeansList) {
    els.myBeansList.addEventListener("click", (e) => {
      const btn = e.target.closest(".my-bean-chip");
      if (!btn) return;
      const id = btn.getAttribute("data-bean-id");
      const rec = myBeans.find((b) => b.id === id);
      if (!rec) return;
      applyBeanRecord(rec, { asSaved: true, applyHeuristics: true });
      setBeanSaveStatus("已載入「" + rec.name + "」");
    });
  }
  if (els.beanSaveBtn) {
    els.beanSaveBtn.addEventListener("click", () => saveCurrentBeanAsNew());
  }
  if (els.beanUpdateBtn) {
    els.beanUpdateBtn.addEventListener("click", () => updateCurrentBean());
  }
  if (els.beanDeleteBtn) {
    els.beanDeleteBtn.addEventListener("click", () => deleteCurrentBean());
  }
  if (els.beanExportBtn) {
    els.beanExportBtn.addEventListener("click", () => exportMyBeans());
  }
  if (els.beanImportBtn && els.beanImportFile) {
    els.beanImportBtn.addEventListener("click", () => els.beanImportFile.click());
    els.beanImportFile.addEventListener("change", () => {
      const f = els.beanImportFile.files && els.beanImportFile.files[0];
      importMyBeansFromFile(f);
      els.beanImportFile.value = "";
    });
  }

  els.resetBtn.addEventListener("click", () => {
    state = JSON.parse(JSON.stringify(BASELINE));
    filterOverride = false;
    els.teachingCard.classList.add("hidden");
    syncBeanControls();
    populateFilterSelect();
    render();
  });

  // Collapsible sections
  document.querySelectorAll(".collapse-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".collapsible");
      const open = !card.classList.contains("open");
      card.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Init
  wireTimerControls();
  load();
  loadMyBeans();
  // migrate legacy single Kasuya 4:6 (旧 4equal) → new mode-aware style
  if (!state.kasuya46Mode) state.kasuya46Mode = "balanced";
  if (state.recipeId === "kasuya-46" && state.pourStyle !== "kasuya46") {
    state.pourStyle = "kasuya46";
  }
  if (state.pourStyle === "kasuya46") {
    state.bloomWait = getKasuya46Mode().bloomSec;
  }
  if (state.lockRatio) {
    state.ratio = state.ratio || BASELINE.ratio;
    state.water = round0(state.dose * state.ratio);
  } else {
    state.ratio = state.water / state.dose;
  }
  populateRecipes();
  syncBeanControls();
  populateFilterSelect(state.filter);
  if (state.recipeId) {
    const r = RD.RECIPES.find((x) => x.id === state.recipeId);
    if (r) showTeaching(r);
  }
  render();
})();
