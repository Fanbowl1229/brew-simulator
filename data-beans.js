/**
 * 豆資訊資料 — 產地、品種、處理法、風味、密度、味道特性、快捷預設
 * Quality Life Coffee 風格分類（精簡版）
 */
window.BREW_BEAN_DATA = (function () {
  "use strict";

  const ORIGINS = [
    "衣索比亞", "肯亞", "盧旺達", "蒲隆地", "坦桑尼亞", "烏干達", "也門",
    "巴拿馬", "哥斯達黎加", "危地馬拉", "宏都拉斯", "薩爾瓦多", "尼加拉瓜", "墨西哥", "牙買加",
    "哥倫比亞", "巴西", "秘魯", "玻利維亞", "厄瓜多爾",
    "印尼", "印度", "越南", "泰國", "中國（雲南）", "台灣", "緬甸", "寮國", "東帝汶",
    "巴布亞新畿內亞", "夏威夷", "清萊", "其他",
  ];

  const VARIETIES = [
    "瑰夏（藝伎）", "SL28", "SL34", "波旁", "黃波旁", "粉紅波旁",
    "卡杜拉", "卡杜艾", "帕卡馬拉", "鐵比卡", "象豆",
    "Sidra", "Wush Wush", "Chiroso", "74110", "74112", "74158",
    "Kurume", "Wolisho", "Rume Sudan", "Centroamericano", "Castillo",
    "Parainema", "Batian", "羅布斯塔", "Eugenioides", "其他",
  ];

  const PROCESSES = [
    { group: "傳統", items: ["水洗", "日曬", "蜜處理", "去皮日曬", "濕剝法"] },
    { group: "改良", items: ["肯亞式雙重水洗"] },
    { group: "實驗", items: [
      "厭氧發酵", "雙厭氧", "二氧化碳浸漬（CM）", "酵母發酵",
      "乳酸發酵", "熱冷衝擊", "麴菌發酵", "酒桶熟成", "共同發酵（加味）",
    ]},
    { group: "低因", items: ["瑞士水低因"] },
  ];

  const FLAVORS = [
    { group: "花香", items: ["茉莉花", "玫瑰", "橙花", "蘭花", "桂花", "蜜糖花香"] },
    { group: "柑橘", items: ["檸檬", "萊姆", "西柚", "佛手柑", "橙", "橘皮"] },
    { group: "莓果", items: ["藍莓", "士多啤梨", "黑加侖子", "覆盆子", "紅莓", "桑葚"] },
    { group: "核果", items: ["桃", "杏", "李", "櫻桃", "油桃"] },
    { group: "熱帶水果", items: ["芒果", "菠蘿", "百香果", "荔枝", "木瓜", "香蕉"] },
    { group: "甜感", items: ["蜂蜜", "焦糖", "黑糖", "楓糖", "紅糖", "太妃糖"] },
    { group: "朱古力／可可", items: ["黑朱古力", "牛奶朱古力", "可可粉", "可可脂"] },
    { group: "堅果", items: ["杏仁", "榛子", "核桃", "花生", "腰果"] },
    { group: "香料", items: ["肉桂", "丁香", "荳蔻", "薑", "黑胡椒"] },
    { group: "茶感", items: ["紅茶", "綠茶", "烏龍", "茉莉花茶"] },
    { group: "發酵／酒香", items: ["紅酒", "白酒", "威士忌", "發酵果香", "乳酸感"] },
  ];

  /** 密度／硬度 */
  const DENSITIES = [
    { id: "soft", label: "軟豆" },
    { id: "medium", label: "中等" },
    { id: "hard", label: "硬豆" },
  ];

  /** 味道特性（可多選） */
  const TENDENCIES = [
    "明亮酸質", "厚口感", "高甜感", "花香主導", "發酵感強",
    "茶感", "朱古力基調", "柑橘主導", "莓果主導", "乾淨清爽",
    "酒體飽滿", "香料感", "堅果基調",
  ];

  const QUICK_PRESETS = {
    kenya: {
      label: "肯尼亞水洗",
      origins: ["肯亞"],
      varieties: ["SL28", "SL34"],
      processes: ["肯亞式雙重水洗", "水洗"],
      flavors: ["黑加侖子", "西柚", "紅茶"],
      density: "hard",
      tendencies: ["明亮酸質", "柑橘主導", "乾淨清爽"],
      temp: 93,
      grindOffset: 0,
      agitation: "normal",
      tip: "明亮酸質、密度高，93°C 多段注水最穩陣。",
    },
    "alishan-geisha": {
      label: "阿里山瑰夏日曬",
      origins: ["台灣"],
      varieties: ["瑰夏（藝伎）"],
      processes: ["日曬"],
      flavors: ["茉莉花", "桃", "蜂蜜", "橙花"],
      density: "medium",
      tendencies: ["花香主導", "高甜感", "茶感"],
      temp: 92,
      grindOffset: -0.1,
      agitation: "gentle",
      tip: "追求清晰度，91–94°C、溫和注水，唔好過度攪動。",
    },
    "chiangrai-ana": {
      label: "清萊雙厭氧蜜處理",
      origins: ["清萊", "泰國"],
      varieties: ["其他"],
      processes: ["雙厭氧", "蜜處理"],
      flavors: ["發酵果香", "芒果", "紅酒", "焦糖"],
      density: "medium",
      tendencies: ["發酵感強", "高甜感", "酒體飽滿"],
      temp: 89,
      grindOffset: 0.2,
      agitation: "gentle",
      tip: "厭氧風味濃，88–91°C、溫和攪動，避免萃取過猛。",
    },
    "purple-perfume": {
      label: "Purple Perfume",
      origins: ["其他"],
      varieties: ["其他"],
      processes: ["共同發酵（加味）", "厭氧發酵"],
      flavors: ["士多啤梨", "玫瑰", "發酵果香", "茉莉花"],
      density: "soft",
      tendencies: ["花香主導", "發酵感強", "高甜感"],
      temp: 88,
      grindOffset: 0.3,
      agitation: "gentle",
      tip: "極淺烘焙＋浸漬風味，低溫（88–90°C）溫和沖，保留香氣。",
    },
  };

  /**
   * 由結構化欄位推導啟發式（處理法／品種／密度／味道特性）
   */
  function heuristicsFromBean(bean) {
    const processes = bean.processes || [];
    const varieties = bean.varieties || [];
    const tendencies = bean.tendencies || [];
    const density = bean.density || "medium";
    let temp = 92;
    let grindOffset = 0;
    let agitation = "normal";
    const tips = [];

    const isWashed = processes.some((p) => /水洗|肯亞式/.test(p));
    const isNatural = processes.some((p) => /日曬|去皮日曬/.test(p));
    const isHoney = processes.some((p) => /蜜處理/.test(p));
    const isAna = processes.some((p) =>
      /厭氧|雙厭氧|二氧化碳|酵母|乳酸|麴菌|共同發酵|酒桶/.test(p)
    );
    const isGeisha = varieties.some((v) => /瑰夏|藝伎|Geisha|Gesha/i.test(v));

    if (isAna) {
      temp = 89;
      grindOffset += 0.2;
      agitation = "gentle";
      tips.push("厭氧／實驗處理：建議 88–91°C、溫和攪動。");
    } else if (isWashed) {
      temp = 93;
      tips.push("水洗豆密度高，可用略高溫（92–94°C）突顯酸質。");
    } else if (isNatural) {
      temp = 91;
      grindOffset += 0.1;
      agitation = "gentle";
      tips.push("日曬甜感多，略降溫、溫和注水較易平衡。");
    } else if (isHoney) {
      temp = 91;
      grindOffset += 0.1;
      tips.push("蜜處理介乎水洗同日曬，91°C 左右就啱。");
    }

    if (isGeisha) {
      temp = Math.min(temp, 92);
      grindOffset -= 0.1;
      agitation = "gentle";
      tips.push("瑰夏建議溫和注水，保留花香同清晰度。");
    }

    if (processes.includes("瑞士水低因")) {
      temp = Math.min(temp, 91);
      tips.push("低因豆萃取較慢，可略延長悶蒸或微細研磨。");
    }

    // 密度／硬度
    if (density === "hard") {
      grindOffset -= 0.15; // 硬豆 → 略細
      temp = Math.min(96, temp + 1);
      tips.push("硬豆／高密度：研磨可略細，水溫可略高，幫助萃取。");
    } else if (density === "soft") {
      grindOffset += 0.15; // 軟豆 → 略粗／溫和
      temp = Math.max(80, temp - 1);
      agitation = "gentle";
      tips.push("軟豆：研磨略粗、溫度略低、溫和注水，避免過萃。");
    }

    // 味道特性
    if (tendencies.includes("明亮酸質")) {
      temp = Math.min(96, Math.max(temp, 92));
      tips.push("想突顯明亮酸質：略高溫、清爽注水。");
    }
    if (tendencies.includes("發酵感強")) {
      temp = Math.min(temp, 90);
      agitation = "gentle";
      grindOffset += 0.1;
    }
    if (tendencies.includes("花香主導") || tendencies.includes("茶感")) {
      agitation = "gentle";
      tips.push("花香／茶感主導：溫和攪動，保留香氣層次。");
    }
    if (tendencies.includes("厚口感") || tendencies.includes("朱古力基調")) {
      grindOffset += 0.05;
      tips.push("厚口感／朱古力基調：可略粗研磨、稍長接觸時間。");
    }
    if (tendencies.includes("高甜感")) {
      tips.push("高甜感：留意中段注水，避免尾段過萃搶甜。");
    }

    return {
      temp,
      grindOffset,
      agitation,
      tip: tips.join(" ") || "跟住豆性微調水溫同攪動就得。",
    };
  }

  /** 由產地／處理法粗略推密度（可被用戶覆蓋） */
  function suggestDensity(origins, processes) {
    const o = (origins || []).join(" ");
    const p = (processes || []).join(" ");
    if (/肯亞|衣索比亞|哥倫比亞|危地馬拉|哥斯達黎加|巴拿馬/.test(o)) return "hard";
    if (/巴西|印尼|夏威夷|低因|共同發酵/.test(o + p)) return "soft";
    if (/厭氧|雙厭氧/.test(p)) return "medium";
    return "medium";
  }

  /** 由產地＋處理法＋品種推味道特性（可被覆蓋） */
  function suggestTendencies(origins, varieties, processes, flavors) {
    const set = new Set();
    const o = (origins || []).join(" ");
    const v = (varieties || []).join(" ");
    const p = (processes || []).join(" ");
    const f = (flavors || []).join(" ");

    if (/肯亞|水洗|肯亞式/.test(o + p)) {
      set.add("明亮酸質");
      set.add("乾淨清爽");
    }
    if (/瑰夏|藝伎/.test(v)) {
      set.add("花香主導");
      set.add("茶感");
    }
    if (/厭氧|雙厭氧|共同發酵|酵母|乳酸/.test(p)) {
      set.add("發酵感強");
      set.add("高甜感");
    }
    if (/日曬|蜜處理/.test(p)) set.add("高甜感");
    if (/巴西|朱古力|可可|堅果/.test(o + f)) {
      set.add("朱古力基調");
      set.add("堅果基調");
    }
    if (/花|茉莉|玫瑰|橙花/.test(f)) set.add("花香主導");
    if (/柑橘|檸檬|西柚|佛手柑/.test(f)) set.add("柑橘主導");
    if (/莓|藍莓|士多啤梨|黑加侖/.test(f)) set.add("莓果主導");
    if (/紅茶|綠茶|烏龍|茶/.test(f)) set.add("茶感");

    return Array.from(set).slice(0, 5);
  }

  return {
    ORIGINS,
    VARIETIES,
    PROCESSES,
    FLAVORS,
    DENSITIES,
    TENDENCIES,
    QUICK_PRESETS,
    heuristicsFromBean,
    suggestDensity,
    suggestTendencies,
  };
})();
