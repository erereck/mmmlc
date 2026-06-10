(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SLIDE_W = 960;
  const SLIDE_H = 540;
  const CREATOR_VERSION = "0.6.0";
  const STORAGE_KEY = "mmm-level-creator-v2";
  const LEGACY_STORAGE_KEY = "mmm-level-creator-v1";

  const fallbackMeta = { label: "Objeto", name: "Objeto", fill: "#000000", stroke: "#ffffff", w: 80, h: 12 };
  const removedDecorationTypes = new Set(["decor", "grass", "hub-door"]);
  const advancedVariantTypes = new Set(["moving-ghost", "p2-platform", "gravity-all", "door-button-inv", "door-platform-inv"]);
  const movementCapableTypes = new Set([
    "p1-platform", "p2-platform", "toggle-platform", "ice", "water", "death", "coin", "portal",
    "spring", "spring-h", "jump", "speed", "gravity", "gravity-all", "big-player", "mini-player",
    "door-button", "door-button-inv", "door-platform", "door-platform-inv"
  ]);

  const typeMeta = {
    platform: { label: "Plataforma", name: "$", fill: "#000000", stroke: "#ffffff", w: 96, h: 16 },
    "moving-platform": { label: "Movel", name: "$'", fill: "#000000", stroke: "#41a2ff", w: 100, h: 14 },
    "moving-ghost": { label: "Movel ghost", name: "$''", fill: "#000000", stroke: "#41a2ff", w: 100, h: 14 },
    "p1-platform": { label: "Barreira P1", name: "#1", fill: "#000000", stroke: "#41a2ff", w: 96, h: 14 },
    "p2-platform": { label: "Barreira P2", name: "#2", fill: "#000000", stroke: "#ffdf40", w: 96, h: 14 },
    "toggle-platform": { label: "Temporaria", name: "#-", fill: "#000000", stroke: "#a47cff", w: 96, h: 14, text: "1.5" },
    ice: { label: "Gelo", name: "#=", fill: "#000000", stroke: "#83d5ff", w: 90, h: 12 },
    water: { label: "Agua", name: "#:", fill: "#297bff", stroke: "#74c6ff", w: 180, h: 70 },
    death: { label: "Morte", name: "#@", fill: "#000000", stroke: "#ff0000", w: 80, h: 18 },
    coin: { label: "Moeda", name: "#%", fill: "#000000", stroke: "#feec00", w: 20.5, h: 20.5 },
    portal: { label: "Portal", name: "#Portal", fill: "#000000", stroke: "#00c8ff", w: 29.76, h: 29.76 },
    spring: { label: "Mola", name: "#&", fill: "#000000", stroke: "#feec00", w: 37.26, h: 6.56 },
    "spring-h": { label: "Mola horiz.", name: "#?", fill: "#000000", stroke: "#feec00", w: 6.56, h: 37.26 },
    spawn: { label: "Spawn", name: "Spawn", fill: "#000000", stroke: "#20b15a", w: 8.39, h: 8.39 },
    jump: { label: "Pulo+", name: "#^", fill: "#000000", stroke: "#feec00", w: 24, h: 24, text: "P" },
    speed: { label: "Vel+", name: "#^", fill: "#000000", stroke: "#297bff", w: 24, h: 24, text: "V" },
    gravity: { label: "Gravidade", name: "#!", fill: "#000000", stroke: "transparent", w: 29.046, h: 29.046 },
    "gravity-all": { label: "Grav. todos", name: "#!", fill: "#000000", stroke: "transparent", w: 29.046, h: 29.046, text: "all" },
    "big-player": { label: "Grande", name: "#~", fill: "#000000", stroke: "#ff9f1c", w: 24, h: 24, text: "C" },
    "mini-player": { label: "Pequeno", name: "#~", fill: "#000000", stroke: "#8eff8e", w: 24, h: 24, text: "D" },
    "door-button": { label: "Botao porta", name: "#*", fill: "#000000", stroke: "#ff65d8", w: 26, h: 8, text: "1" },
    "door-button-inv": { label: "Botao inv.", name: "#_", fill: "#000000", stroke: "#ff65d8", w: 26, h: 8, text: "1" },
    "door-platform": { label: "Porta", name: "-Porta1", fill: "#000000", stroke: "#ff65d8", w: 80, h: 12, text: "1" },
    "door-platform-inv": { label: "Porta inv.", name: "_Porta1", fill: "#000000", stroke: "#ff65d8", w: 80, h: 12, text: "1" }
  };

  const state = {
    tabs: [],
    activeTabId: "work",
    tool: "select",
    selectedId: null,
    selectedIds: [],
    view: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H },
    grid: true,
    snap: true,
    gridSize: 8,
    drag: null,
    spaceDown: false,
    clipboard: null,
    tabsCollapsed: false,
    rightHidden: false,
    lastPointer: { x: SLIDE_W / 2, y: SLIDE_H / 2 },
    history: [],
    future: [],
    removedExampleIds: [],
    lastExport: null
  };

  const els = {
    stage: document.getElementById("stage"),
    stageWrap: document.getElementById("stageWrap"),
    objectLayer: document.getElementById("objectLayer"),
    overlayLayer: document.getElementById("overlayLayer"),
    gridLayer: document.getElementById("gridLayer"),
    tabList: document.getElementById("tabList"),
    toolGrid: document.getElementById("toolGrid"),
    stats: document.getElementById("stats"),
    warnings: document.getElementById("warnings"),
    cursorReadout: document.getElementById("cursorReadout"),
    zoomReadout: document.getElementById("zoomReadout"),
    inspector: document.getElementById("inspector"),
    emptyInspector: document.getElementById("emptyInspector"),
    layerList: document.getElementById("layerList"),
    gridToggle: document.getElementById("gridToggle"),
    snapToggle: document.getElementById("snapToggle"),
    gridSize: document.getElementById("gridSize"),
    gridSizeText: document.getElementById("gridSizeText"),
    propType: document.getElementById("propType"),
    propName: document.getElementById("propName"),
    propX: document.getElementById("propX"),
    propY: document.getElementById("propY"),
    propW: document.getElementById("propW"),
    propH: document.getElementById("propH"),
    propText: document.getElementById("propText"),
    propTextLabel: document.getElementById("propTextLabel"),
    movingFields: document.getElementById("movingFields"),
    moveEnabled: document.getElementById("moveEnabled"),
    moveAxis: document.getElementById("moveAxis"),
    moveAxisLabel: document.getElementById("moveAxisLabel"),
    moveMin: document.getElementById("moveMin"),
    moveMax: document.getElementById("moveMax"),
    moveSpeed: document.getElementById("moveSpeed"),
    toggleFields: document.getElementById("toggleFields"),
    toggleInverted: document.getElementById("toggleInverted"),
    propFill: document.getElementById("propFill"),
    propStroke: document.getElementById("propStroke"),
    propLocked: document.getElementById("propLocked"),
    propHidden: document.getElementById("propHidden"),
    propNameLabel: document.getElementById("propNameLabel"),
    computedNote: document.getElementById("computedNote"),
    contextMenu: document.getElementById("contextMenu"),
    exportPanel: document.getElementById("exportPanel"),
    exportText: document.getElementById("exportText"),
    closeExportBtn: document.getElementById("closeExportBtn"),
    copyExportBtn: document.getElementById("copyExportBtn"),
    downloadExportBtn: document.getElementById("downloadExportBtn"),
    exportBtn: document.getElementById("exportBtn"),
    exportAllBtn: document.getElementById("exportAllBtn"),
    saveBtn: document.getElementById("saveBtn"),
    toast: document.getElementById("toast"),
    quickEdit: document.getElementById("quickEdit"),
    variantBtn: document.getElementById("variantBtn"),
    pairBtn: document.getElementById("pairBtn"),
    normalizeBtn: document.getElementById("normalizeBtn"),
    toggleRightBtn: document.getElementById("toggleRightBtn"),
    toggleTabsBtn: document.getElementById("toggleTabsBtn"),
    addTabBtn: document.getElementById("addTabBtn"),
    removeTabBtn: document.getElementById("removeTabBtn")
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function activeTab() {
    return state.tabs.find((tab) => tab.id === state.activeTabId);
  }

  function objects() {
    return activeTab().objects;
  }

  function selectedObject() {
    return objects().find((obj) => obj.id === state.selectedId) || null;
  }

  function selectedObjects() {
    const selected = new Set(state.selectedIds);
    return objects().filter((obj) => selected.has(obj.id));
  }

  function hasSelection(id) {
    return state.selectedIds.includes(id);
  }

  function syncSelection() {
    const valid = new Set(objects().map((obj) => obj.id));
    state.selectedIds = state.selectedIds.filter((id) => valid.has(id));
    if (!valid.has(state.selectedId)) state.selectedId = state.selectedIds[state.selectedIds.length - 1] || null;
    if (state.selectedId && !state.selectedIds.includes(state.selectedId)) state.selectedIds.push(state.selectedId);
  }

  function setSelection(ids, primaryId = null) {
    const valid = new Set(objects().map((obj) => obj.id));
    state.selectedIds = [...new Set(ids.filter((id) => valid.has(id)))];
    state.selectedId = primaryId && valid.has(primaryId) ? primaryId : state.selectedIds[state.selectedIds.length - 1] || null;
    if (state.selectedId && !state.selectedIds.includes(state.selectedId)) state.selectedIds.push(state.selectedId);
  }

  function clearSelection() {
    state.selectedId = null;
    state.selectedIds = [];
  }

  function toggleSelection(id) {
    if (hasSelection(id)) {
      setSelection(state.selectedIds.filter((item) => item !== id));
    } else {
      setSelection([...state.selectedIds, id], id);
    }
  }

  function svgEl(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    }
    for (const child of children) node.appendChild(child);
    return node;
  }

  function setAttrs(node, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    }
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function snapValue(value) {
    if (!state.snap) return value;
    return Math.round(value / state.gridSize) * state.gridSize;
  }

  function ensurePositiveRect(obj) {
    if (obj.w < 0) {
      obj.x += obj.w;
      obj.w = Math.abs(obj.w);
    }
    if (obj.h < 0) {
      obj.y += obj.h;
      obj.h = Math.abs(obj.h);
    }
    obj.w = Math.max(1, obj.w);
    obj.h = Math.max(1, obj.h);
  }

  function typeLabel(type) {
    return typeMeta[type]?.label || fallbackMeta.label;
  }

  function inspectorTypeEntries(currentType) {
    return Object.entries(typeMeta).filter(([type]) => !advancedVariantTypes.has(type) || type === currentType);
  }

  function colorSafe(color, fallback = "#000000") {
    if (!color || color === "transparent") return fallback;
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    return fallback;
  }

  function isMovingType(type) {
    return type === "moving-platform" || type === "moving-ghost";
  }

  function canMoveType(type) {
    return isMovingType(type) || movementCapableTypes.has(type);
  }

  function hasMovement(obj) {
    return !!obj && (isMovingType(obj.type) || (!!obj.movingEnabled && canMoveType(obj.type)));
  }

  function movementAxis(obj) {
    if (!obj || isMovingType(obj.type)) return "x";
    return String(obj.movingAxis || "").toLowerCase() === "y" ? "y" : "x";
  }

  function movementCoord(obj, axis = movementAxis(obj)) {
    return axis === "y" ? Number(obj?.y || 0) : Number(obj?.x || 0);
  }

  function movementSize(obj, axis = movementAxis(obj)) {
    return axis === "y" ? Number(obj?.h || 0) : Number(obj?.w || 0);
  }

  function setMovementCoord(obj, value, axis = movementAxis(obj)) {
    if (axis === "y") obj.y = round(value);
    else obj.x = round(value);
  }

  function movingSuffix(type) {
    return type === "moving-ghost" ? "''" : "'";
  }

  function stripMovementSuffix(name) {
    const raw = String(name || "");
    const index = raw.indexOf("'");
    return index > 0 ? raw.slice(0, index) : raw;
  }

  function parseMovingText(text, x = 0, y = 0, fallbackAxis = "x") {
    let raw = String(text || "").trim();
    let axis = fallbackAxis === "y" ? "y" : "x";
    const prefix = raw.slice(0, 2).toUpperCase();
    if (prefix === "Y:") {
      axis = "y";
      raw = raw.slice(2);
    } else if (prefix === "X:") {
      axis = "x";
      raw = raw.slice(2);
    }
    const parts = raw.split(".");
    const min = Number(parts[0]);
    const max = Number(parts[1]);
    const speed = Number(parts[2]);
    const start = Number.isFinite(min) ? min : round(axis === "y" ? y : x);
    return {
      axis,
      min: start,
      max: Number.isFinite(max) ? max : round(start + 160),
      speed: Number.isFinite(speed) ? speed : 80
    };
  }

  function parseMovingSuffix(name, x = 0, y = 0) {
    const raw = String(name || "");
    const index = raw.indexOf("'");
    if (index < 0 || index >= raw.length - 1) return null;
    return parseMovingText(raw.slice(index + 1), x, y);
  }

  function movementSpec(obj) {
    const data = movingData(obj) || parseMovingText("", obj?.x || 0, obj?.y || 0, movementAxis(obj));
    const prefix = data.axis === "y" ? "Y:" : "";
    return `${prefix}${round(data.min)}.${round(data.max)}.${round(data.speed)}`;
  }

  function setMovingText(obj) {
    const data = movingData(obj) || parseMovingText("", obj?.x || 0, obj?.y || 0, movementAxis(obj));
    obj.movingMin = round(Number.isFinite(Number(obj.movingMin)) ? Number(obj.movingMin) : data.min);
    obj.movingMax = round(Number.isFinite(Number(obj.movingMax)) ? Number(obj.movingMax) : data.max);
    obj.movingSpeed = round(Number.isFinite(Number(obj.movingSpeed)) ? Number(obj.movingSpeed) : data.speed);
    obj.movingAxis = isMovingType(obj.type) ? "x" : (data.axis === "y" ? "y" : "x");
    if (isMovingType(obj.type)) {
      obj.text = `${obj.movingMin}.${obj.movingMax}.${obj.movingSpeed}`;
    } else if (obj.movingEnabled) {
      const base = stripMovementSuffix(obj.name) || typeMeta[obj.type]?.name || fallbackMeta.name;
      obj.name = `${base}'${movementSpec(obj)}`;
    }
  }

  function movingData(obj) {
    if (!hasMovement(obj)) return null;
    const fallbackAxis = movementAxis(obj);
    const parsed = isMovingType(obj.type)
      ? parseMovingText(obj.text, obj.x, obj.y, "x")
      : (parseMovingSuffix(obj.name, obj.x, obj.y) || parseMovingText("", obj.x, obj.y, fallbackAxis));
    const axis = isMovingType(obj.type) ? "x" : (obj.movingAxis === "y" || parsed.axis === "y" ? "y" : "x");
    return {
      axis,
      min: Number.isFinite(Number(obj.movingMin)) ? Number(obj.movingMin) : parsed.min,
      max: Number.isFinite(Number(obj.movingMax)) ? Number(obj.movingMax) : parsed.max,
      speed: Number.isFinite(Number(obj.movingSpeed)) ? Number(obj.movingSpeed) : parsed.speed
    };
  }

  function syncMovementInternals(obj) {
    if (!canMoveType(obj.type)) {
      obj.movingEnabled = false;
      return;
    }

    const parsed = movingData(obj) || parseMovingSuffix(obj.name, obj.x, obj.y) || parseMovingText(isMovingType(obj.type) ? obj.text : "", obj.x, obj.y, movementAxis(obj));
    obj.movingAxis = isMovingType(obj.type) ? "x" : (obj.movingAxis === "y" || parsed.axis === "y" ? "y" : "x");
    const startCoord = movementCoord(obj, obj.movingAxis);
    obj.movingMin = round(Number.isFinite(Number(parsed.min)) ? Number(parsed.min) : startCoord);
    obj.movingMax = round(Number.isFinite(Number(parsed.max)) && Number(parsed.max) > obj.movingMin ? Number(parsed.max) : obj.movingMin + 160);
    obj.movingSpeed = round(Number.isFinite(Number(parsed.speed)) && Number(parsed.speed) !== 0 ? Number(parsed.speed) : 80);

    if (isMovingType(obj.type)) {
      obj.x = obj.movingMin;
      const suffix = movingSuffix(obj.type);
      const base = stripMovementSuffix(obj.name || "$") || "$";
      obj.name = `${base}${suffix}`;
      setMovingText(obj);
      return;
    }

    obj.name = stripMovementSuffix(obj.name) || typeMeta[obj.type]?.name || fallbackMeta.name;
    if (obj.movingEnabled) {
      setMovementCoord(obj, obj.movingMin, obj.movingAxis);
      setMovingText(obj);
    }
  }

  function isDoorButtonType(type) {
    return type === "door-button" || type === "door-button-inv";
  }

  function isDoorPlatformType(type) {
    return type === "door-platform" || type === "door-platform-inv";
  }

  function isDoorType(type) {
    return isDoorButtonType(type) || isDoorPlatformType(type);
  }

  function doorMode(type) {
    return type === "door-button-inv" || type === "door-platform-inv" ? "inv" : "normal";
  }

  function parseDoorId(obj) {
    if (obj?.doorId) {
      const fromDoorId = String(obj.doorId).match(/\d+/);
      if (fromDoorId) return fromDoorId[0];
    }
    const fromName = String(obj?.name || "").match(/(?:^|[_-])Porta(\d+)/i);
    if (isDoorPlatformType(obj?.type) && fromName) return fromName[1];
    const raw = String(obj?.text || "");
    const fromText = raw.match(/\d+/);
    if (fromText) return fromText[0];
    if (fromName) return fromName[1];
    return "1";
  }

  function doorIdSet(typeFilter) {
    const ids = new Set();
    for (const obj of objects()) {
      if (!typeFilter || typeFilter(obj.type)) ids.add(parseDoorId(obj));
    }
    return ids;
  }

  function nextDoorIdFor(type) {
    const mode = doorMode(type);
    const opposite = isDoorButtonType(type) ? isDoorPlatformType : isDoorButtonType;
    const sameModeOpposites = objects().filter((obj) => opposite(obj.type) && doorMode(obj.type) === mode);
    const sameModeCurrent = objects().filter((obj) => obj.type === type);
    const usedHere = new Set(sameModeCurrent.map(parseDoorId));
    const match = sameModeOpposites.find((obj) => !usedHere.has(parseDoorId(obj)));
    if (match) return parseDoorId(match);

    const ids = [...doorIdSet(isDoorType)].map(Number).filter(Number.isFinite);
    const maxId = ids.length ? Math.max(...ids) : 0;
    return String(maxId + 1);
  }

  function nextDoorIdFromUsed(usedIds) {
    let id = 1;
    while (usedIds.has(String(id))) id += 1;
    usedIds.add(String(id));
    return String(id);
  }

  function cloneObjectsForInsert(sourceObjects, offsetX, offsetY) {
    const usedDoorIds = doorIdSet(isDoorType);
    const doorMap = new Map();
    return sourceObjects.map((obj) => {
      const copy = clone(obj);
      copy.id = newObjectId();
      copy.x = round(copy.x + offsetX);
      copy.y = round(copy.y + offsetY);
      if (isDoorType(copy.type)) {
        const key = `${doorMode(copy.type)}:${parseDoorId(copy)}`;
        if (!doorMap.has(key)) doorMap.set(key, nextDoorIdFromUsed(usedDoorIds));
        copy.text = doorMap.get(key);
        copy.doorId = copy.text;
      }
      copy.name = autoName(copy.type);
      syncObjectInternals(copy);
      return copy;
    });
  }

  function syncObjectInternals(obj, preserveText = true) {
    if (!obj) return obj;
    if (isMovingType(obj.type)) {
      syncMovementInternals(obj);
    } else if (obj.type === "gravity-all" || (obj.type === "gravity" && String(obj.text || "").toLowerCase() === "all")) {
      obj.type = "gravity-all";
      obj.name = "#!";
      obj.text = "all";
      obj.stroke = "transparent";
    } else if (obj.type === "gravity") {
      obj.name = "#!";
      obj.text = "";
      obj.stroke = "transparent";
    } else if (obj.type === "p1-platform" || obj.type === "p2-platform") {
      obj.name = obj.type === "p1-platform" ? "#1" : "#2";
      obj.text = "";
    } else if (obj.type === "toggle-platform") {
      obj.name = "#-";
      setTogglePlatformText(obj);
    } else if (obj.type === "jump" || obj.type === "speed") {
      obj.name = "#^";
      obj.text = obj.type === "jump" ? "P" : "V";
    } else if (obj.type === "big-player" || obj.type === "mini-player") {
      obj.name = "#~";
      obj.text = obj.type === "big-player" ? "C" : "D";
    } else if (isDoorType(obj.type)) {
      const id = preserveText ? parseDoorId(obj) : (obj.text || obj.doorId || nextDoorIdFor(obj.type));
      obj.doorId = String(id || "1");
      obj.text = obj.doorId;
      if (obj.type === "door-button") obj.name = "#*";
      else if (obj.type === "door-button-inv") obj.name = "#_";
      else if (obj.type === "door-platform") obj.name = `-Porta${obj.doorId}`;
      else if (obj.type === "door-platform-inv") obj.name = `_Porta${obj.doorId}`;
    } else if (obj.type === "spring") {
      obj.name = "#&";
    } else if (obj.type === "spring-h") {
      obj.name = "#?";
    }
    if (!isMovingType(obj.type)) syncMovementInternals(obj);
    return obj;
  }

  function nextCountFor(type) {
    const tab = activeTab();
    if (!tab) return 0;
    return tab.objects.filter((obj) => obj.type === type).length;
  }

  function autoName(type) {
    const meta = typeMeta[type] || fallbackMeta;
    if (type === "platform") return `$${nextCountFor("platform")}`;
    if (type === "moving-platform") return `$${nextCountFor("moving-platform")}'`;
    if (type === "moving-ghost") return `$${nextCountFor("moving-ghost")}''`;
    if (type === "p1-platform") return "#1";
    if (type === "p2-platform") return "#2";
    if (type === "toggle-platform") return "#-";
    if (type === "coin") return `#%${nextCountFor("coin")}`;
    if (type === "door-platform") return `-Porta${nextDoorIdFor(type)}`;
    if (type === "door-platform-inv") return `_Porta${nextDoorIdFor(type)}`;
    return meta.name;
  }

  function defaultTextFor(type, x = 0) {
    if (type === "portal") return "";
    if (type === "spring" || type === "spring-h") return "";
    if (type === "toggle-platform") return "1.5";
    if (isMovingType(type)) return `${round(x)}.${round(x + 160)}.80`;
    if (isDoorType(type)) return nextDoorIdFor(type);
    return typeMeta[type]?.text || "";
  }

  function toggleIntervalValue(obj) {
    const raw = String(obj?.text || "").replace(",", ".");
    const value = Math.abs(Number(raw));
    return Number.isFinite(value) && value > 0 ? value : 1.5;
  }

  function toggleStartsInvisible(obj) {
    if (!obj) return false;
    if (obj.toggleStartHidden === true) return true;
    const value = Number(String(obj.text || "").replace(",", "."));
    return Number.isFinite(value) && value < 0;
  }

  function setTogglePlatformText(obj, interval = toggleIntervalValue(obj), startsInvisible = toggleStartsInvisible(obj)) {
    const value = Number(interval);
    const safe = Number.isFinite(value) && value > 0 ? round(value) : 1.5;
    obj.toggleStartHidden = !!startsInvisible;
    obj.text = `${obj.toggleStartHidden ? "-" : ""}${safe}`;
  }

  function makeObject(type, x, y, custom = {}) {
    const meta = typeMeta[type] || fallbackMeta;
    const obj = {
      id: `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: custom.name || autoName(type),
      type,
      x: round(x),
      y: round(y),
      w: meta.w,
      h: meta.h,
      text: custom.text !== undefined ? custom.text : defaultTextFor(type, x),
      hidden: false,
      geometry: type === "spawn" || type === "coin" ? "ellipse" : "rect",
      fill: meta.fill,
      stroke: meta.stroke,
      strokeWidth: 1,
      locked: false,
      ...custom
    };
    syncObjectInternals(obj);
    ensurePositiveRect(obj);
    return obj;
  }

  function defaultLevel() {
    return [
      makeObject("platform", 80, 476, { id: "work-ground", name: "$0", w: 800, h: 18 }),
      makeObject("spawn", 126, 430, { id: "work-spawn", name: "Spawn" }),
      makeObject("portal", 824, 432, { id: "work-portal", name: "#Portal", text: "proxima" })
    ];
  }

  function loadTabs() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      saved = null;
    }

    state.removedExampleIds = Array.isArray(saved?.removedExampleIds) ? saved.removedExampleIds : [];
    const removedExamples = new Set(state.removedExampleIds);
    const examples = (window.MMM_EXAMPLES || [])
      .slice(0, 13)
      .filter((item) => !removedExamples.has(item.id) && !removedExamples.has(item.title))
      .map((item) => ({
        id: item.id,
        title: item.title,
        slide: item.slide,
        example: true,
        objects: sanitizeObjects(item.objects).map((obj) => ({ ...obj, locked: false }))
      }));

    let loadedTabs = null;
    let activeId = null;

    if (saved?.tabs?.length) {
      const customTabs = saved.tabs
        .filter((tab) => tab && !["Legacy14", "Legacy15"].includes(tab.title))
        .filter((tab) => !tab.example)
        .map((tab, index) => ({
          id: tab.id || `fase-${index + 1}`,
          title: tab.title || `Fase ${index + 1}`,
          slide: tab.slide || "",
          example: false,
          objects: sanitizeObjects(tab.objects)
        }));
      loadedTabs = [...customTabs, ...examples];
      activeId = saved.activeTabId;
    }

    if (!loadedTabs) {
      let workObjects = defaultLevel();
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
        if (legacy?.objects?.length) workObjects = sanitizeObjects(legacy.objects);
      } catch {
        workObjects = defaultLevel();
      }
      loadedTabs = [{ id: "work", title: "Sua fase", example: false, objects: workObjects }, ...examples];
    }

    state.tabs = loadedTabs.length ? loadedTabs : [{ id: "work", title: "Sua fase", example: false, objects: defaultLevel() }, ...examples];
    if (state.tabs.some((tab) => tab.id === activeId)) {
      state.activeTabId = activeId;
    } else {
      const savedActive = loadedTabs?.find((tab) => tab.title === savedTitleFromId(activeId));
      state.activeTabId = savedActive?.id || state.tabs[0].id;
    }
  }

  function savedTitleFromId(id) {
    if (!id) return "";
    const legacyMatch = String(id).match(/Legacy(\d+)/i);
    return legacyMatch ? `Legacy${legacyMatch[1].padStart(2, "0")}` : "";
  }

  function sanitizeObjects(source) {
    return (source || [])
      .filter((obj) => obj && !removedDecorationTypes.has(obj.type))
      .map((obj) => {
        const type = obj.type === "gravity" && String(obj.text || "").toLowerCase() === "all" ? "gravity-all" : (obj.type || "platform");
        const meta = typeMeta[type] || fallbackMeta;
        const rawName = obj.name || meta.name;
        const x = Number.isFinite(Number(obj.x)) ? Number(obj.x) : 0;
        const y = Number.isFinite(Number(obj.y)) ? Number(obj.y) : 0;
        const nameMovement = !isMovingType(type) ? parseMovingSuffix(rawName, x, y) : null;
        const gameplayMoving = obj.gameplay?.moving || null;
        const movingAxis = isMovingType(type)
          ? "x"
          : (String(obj.movingAxis || gameplayMoving?.axis || nameMovement?.axis || "").toLowerCase() === "y" ? "y" : "x");
        return {
          id: obj.id || `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          name: rawName,
          type,
          x,
          y,
          w: Math.max(1, Number.isFinite(Number(obj.w)) ? Number(obj.w) : meta.w),
          h: Math.max(1, Number.isFinite(Number(obj.h)) ? Number(obj.h) : meta.h),
          text: obj.text ?? "",
          toggleStartHidden: obj.toggleStartHidden ?? obj.gameplay?.toggleStartsInvisible ?? obj.gameplay?.startsInvisible ?? false,
          hidden: !!obj.hidden,
          geometry: obj.geometry || (type === "spawn" || type === "coin" ? "ellipse" : "rect"),
          fill: obj.fill || meta.fill,
          stroke: obj.stroke || meta.stroke,
          strokeWidth: obj.strokeWidth || 1,
          locked: !!obj.locked,
          movingEnabled: canMoveType(type) && (isMovingType(type) || !!obj.movingEnabled || !!nameMovement || !!gameplayMoving),
          movingAxis,
          movingMin: obj.movingMin ?? (movingAxis === "y" ? gameplayMoving?.minTop : gameplayMoving?.minLeft) ?? nameMovement?.min,
          movingMax: obj.movingMax ?? (movingAxis === "y" ? gameplayMoving?.maxTop : gameplayMoving?.maxLeft) ?? nameMovement?.max,
          movingSpeed: obj.movingSpeed ?? gameplayMoving?.speed ?? nameMovement?.speed
        };
      })
      .map((obj) => syncObjectInternals(obj));
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeTabId: state.activeTabId,
      removedExampleIds: state.removedExampleIds,
      tabs: state.tabs.filter((tab) => !tab.example).map((tab) => ({
        id: tab.id,
        title: tab.title,
        slide: tab.slide || "",
        example: !!tab.example,
        objects: sanitizeObjects(tab.objects)
      }))
    }));
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.add("hidden"), 1800);
  }

  function rgbFromHex(hex) {
    if (!hex || hex === "transparent") return null;
    const value = colorSafe(hex, "#000000").slice(1);
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function gameplayData(obj, list) {
    const data = {};
    if (obj.type === "death") data.killsPlayer = true;
    if (obj.type === "coin") data.collectible = "coin";
    if (obj.type === "portal") data.portalDestination = obj.text || "";
    if (obj.type === "spring" || obj.type === "spring-h") {
      data.springForce = String(obj.text || "").trim() === "" ? 450 : Number(String(obj.text).replace(",", "."));
      data.springAxis = obj.type === "spring-h" ? "x" : "y";
    }
    if (obj.type === "toggle-platform") {
      data.toggleInterval = toggleIntervalValue(obj);
      data.toggleStartsInvisible = toggleStartsInvisible(obj);
    }
    if (obj.type === "ice") data.surface = "ice";
    if (obj.type === "water") data.medium = "water";
    if (obj.type === "p1-platform") data.playerCollision = "p1";
    if (obj.type === "p2-platform") data.playerCollision = "p2";
    if (obj.type === "jump") data.power = "jump";
    if (obj.type === "speed") data.power = "speed";
    if (obj.type === "big-player") data.power = "big";
    if (obj.type === "mini-player") data.power = "mini";
    if (obj.type === "gravity") data.gravity = "single";
    if (obj.type === "gravity-all") data.gravity = "all";
    if (hasMovement(obj)) {
      const moving = movingData(obj);
      data.moving = {
        axis: moving.axis,
        speed: moving.speed,
        ghost: obj.type === "moving-ghost",
        engineText: movementSpec(obj),
        nameSuffix: !isMovingType(obj.type)
      };
      if (moving.axis === "y") {
        data.moving.minTop = moving.min;
        data.moving.maxTop = moving.max;
      } else {
        data.moving.minLeft = moving.min;
        data.moving.maxLeft = moving.max;
      }
    }
    if (isDoorType(obj.type)) {
      data.door = {
        id: parseDoorId(obj),
        mode: doorMode(obj.type),
        role: isDoorButtonType(obj.type) ? "button" : "platform",
        partnerIds: doorPartnersIn(list, obj).map((partner) => partner.id)
      };
    }
    return data;
  }

  function exportObject(obj, index, list) {
    const clean = syncObjectInternals(clone(obj));
    ensurePositiveRect(clean);
    const exportName = exportShapeName(clean, index);
    const fillRgb = rgbFromHex(clean.fill);
    const lineRgb = rgbFromHex(clean.stroke);
    return {
      id: clean.id,
      order: index,
      type: clean.type,
      label: typeLabel(clean.type),
      name: exportName,
      text: clean.text || "",
      hidden: !!clean.hidden,
      locked: !!clean.locked,
      geometry: clean.geometry || "rect",
      left: round(clean.x),
      top: round(clean.y),
      width: round(clean.w),
      height: round(clean.h),
      fill: clean.fill || "#000000",
      line: clean.stroke || "transparent",
      strokeWidth: clean.strokeWidth || 1,
      ppt: {
        Name: exportName,
        Left: round(clean.x),
        Top: round(clean.y),
        Width: round(clean.w),
        Height: round(clean.h),
        Text: clean.text || "",
        Visible: !clean.hidden,
        FillRGB: fillRgb,
        LineRGB: lineRgb,
        Geometry: clean.geometry || "rect"
      },
      gameplay: gameplayData(clean, list)
    };
  }

  function exportShapeName(obj, index) {
    if (obj.type === "platform") return `$${index}`;
    return obj.name;
  }

  function exportLevel(tab = activeTab()) {
    const list = sanitizeObjects(tab.objects);
    return {
      schema: "mmm-level-v1",
      creator: {
        app: "MMM Level Creator",
        version: CREATOR_VERSION
      },
      slide: {
        width: SLIDE_W,
        height: SLIDE_H,
        unit: "PowerPointPoint"
      },
      exportedAt: new Date().toISOString(),
      level: {
        id: tab.id,
        title: tab.title,
        sourceSlide: tab.slide || null,
        example: !!tab.example
      },
      warnings: collectWarnings(list),
      stats: list.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {}),
      objects: list.map((obj, index) => exportObject(obj, index, list))
    };
  }

  function exportProject() {
    return {
      schema: "mmm-level-project-v1",
      creator: {
        app: "MMM Level Creator",
        version: CREATOR_VERSION
      },
      slide: {
        width: SLIDE_W,
        height: SLIDE_H,
        unit: "PowerPointPoint"
      },
      exportedAt: new Date().toISOString(),
      activeLevelId: state.activeTabId,
      levels: state.tabs.map((tab) => exportLevel(tab))
    };
  }

  function safeFileName(name) {
    return String(name || "fase")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "fase";
  }

  function showExport(payload, fileName) {
    state.lastExport = { payload, fileName };
    els.exportText.value = JSON.stringify(payload, null, 2);
    els.exportPanel.classList.remove("hidden");
  }

  function exportActiveLevel() {
    const tab = activeTab();
    const payload = exportLevel(tab);
    showExport(payload, `${safeFileName(tab.title)}.json`);
    showToast("JSON da fase pronto");
  }

  function exportAllLevels() {
    const payload = exportProject();
    showExport(payload, "mmm-levels.json");
    showToast("JSON do projeto pronto");
  }

  function downloadLastExport() {
    if (!state.lastExport) return;
    const blob = new Blob([JSON.stringify(state.lastExport.payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = state.lastExport.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyExportText() {
    if (!els.exportText.value) return;
    try {
      await navigator.clipboard.writeText(els.exportText.value);
    } catch {
      els.exportText.focus();
      els.exportText.select();
      document.execCommand("copy");
    }
    showToast("JSON copiado");
  }

  function snapshot() {
    return clone(objects());
  }

  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 80) state.history.shift();
    state.future = [];
  }

  function restoreObjects(nextObjects) {
    activeTab().objects = clone(nextObjects);
    syncSelection();
    render();
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    restoreObjects(state.history.pop());
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    restoreObjects(state.future.pop());
  }

  function setTool(tool) {
    state.tool = tool;
    document.querySelectorAll(".tool").forEach((btn) => btn.classList.toggle("active", btn.dataset.tool === tool));
    els.stage.classList.toggle("panning", tool === "pan");
  }

  function setActiveTab(id) {
    state.activeTabId = id;
    clearSelection();
    state.history = [];
    state.future = [];
    fitView(false);
    render();
  }

  function useExampleAsBase() {
    const tab = activeTab();
    const copy = clone(tab.objects).map((obj) => ({ ...obj, id: newObjectId() }));
    const title = tab.example ? `${tab.title} base` : `${tab.title} copia`;
    createTab(title, copy);
    saveLocal();
  }

  function newObjectId() {
    return `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function uniqueTabId() {
    return `fase-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  }

  function nextPhaseTitle() {
    let n = state.tabs.filter((tab) => !tab.example || /^Fase \d+$/i.test(tab.title)).length + 1;
    const titles = new Set(state.tabs.map((tab) => tab.title));
    while (titles.has(`Fase ${n}`)) n += 1;
    return `Fase ${n}`;
  }

  function createTab(title = nextPhaseTitle(), sourceObjects = defaultLevel()) {
    const tab = {
      id: uniqueTabId(),
      title,
      example: false,
      objects: sanitizeObjects(sourceObjects).map((obj) => ({ ...obj, id: newObjectId(), locked: false }))
    };
    state.tabs.unshift(tab);
    setActiveTab(tab.id);
    saveLocal();
  }

  function deleteActiveTab() {
    const current = activeTab();
    if (current?.example && !state.removedExampleIds.includes(current.id)) {
      state.removedExampleIds.push(current.id);
    }
    if (state.tabs.length <= 1) {
      state.tabs = [{ id: uniqueTabId(), title: "Fase 1", example: false, objects: defaultLevel() }];
      state.activeTabId = state.tabs[0].id;
      clearSelection();
      saveLocal();
      render();
      return;
    }
    const idx = state.tabs.findIndex((tab) => tab.id === state.activeTabId);
    if (idx < 0) return;
    state.tabs.splice(idx, 1);
    const next = state.tabs[Math.max(0, idx - 1)] || state.tabs[0];
    state.activeTabId = next.id;
    clearSelection();
    state.history = [];
    state.future = [];
    saveLocal();
    fitView(false);
    render();
  }

  function newLevel() {
    createTab(nextPhaseTitle(), defaultLevel());
  }

  function fitView(shouldRender = true) {
    state.view = { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H };
    if (shouldRender) renderView();
  }

  function renderView() {
    const { x, y, w, h } = state.view;
    els.stage.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    els.zoomReadout.textContent = `${Math.round((SLIDE_W / w) * 100)}%`;
    const pattern = document.getElementById("gridPattern");
    pattern.setAttribute("width", state.gridSize);
    pattern.setAttribute("height", state.gridSize);
    pattern.firstElementChild.setAttribute("d", `M ${state.gridSize} 0 L 0 0 0 ${state.gridSize}`);
  }

  function renderTabs() {
    els.tabList.innerHTML = "";
    for (const tab of state.tabs) {
      const btn = document.createElement("button");
      btn.className = `tab-item${tab.id === state.activeTabId ? " active" : ""}`;
      btn.title = `${tab.title}${tab.example ? ` - slide ${tab.slide}` : ""}`;
      btn.innerHTML = `<span>${tab.title}</span><small>${tab.example ? `slide ${tab.slide}` : `${tab.objects.length} obj`}</small>`;
      btn.addEventListener("click", () => setActiveTab(tab.id));
      els.tabList.appendChild(btn);
    }
  }

  function doorPartnerType(type) {
    if (type === "door-button") return "door-platform";
    if (type === "door-button-inv") return "door-platform-inv";
    if (type === "door-platform") return "door-button";
    if (type === "door-platform-inv") return "door-button-inv";
    return "";
  }

  function variantType(type) {
    const variants = {
      "moving-platform": "moving-ghost",
      "moving-ghost": "moving-platform",
      "p1-platform": "p2-platform",
      "p2-platform": "p1-platform",
      gravity: "gravity-all",
      "gravity-all": "gravity",
      "door-button": "door-button-inv",
      "door-button-inv": "door-button",
      "door-platform": "door-platform-inv",
      "door-platform-inv": "door-platform",
      "big-player": "mini-player",
      "mini-player": "big-player",
      jump: "speed",
      speed: "jump",
      spring: "spring-h",
      "spring-h": "spring"
    };
    return variants[type] || "";
  }

  function canCycleVariant(obj) {
    return !!variantType(obj?.type);
  }

  function variantButtonText(obj) {
    if (!obj || !canCycleVariant(obj)) return "Sem variação";
    const nextType = variantType(obj.type);
    if (obj.type === "moving-platform") return "Virar ghost";
    if (obj.type === "moving-ghost") return "Virar colidível";
    if (obj.type === "gravity") return "Afetar todos";
    if (obj.type === "gravity-all") return "Afetar um player";
    if (obj.type === "p1-platform") return "Trocar para P2";
    if (obj.type === "p2-platform") return "Trocar para P1";
    if (obj.type === "spring") return "Virar horizontal";
    if (obj.type === "spring-h") return "Virar vertical";
    if (isDoorType(obj.type)) return doorMode(obj.type) === "normal" ? "Inverter porta" : "Porta normal";
    return `Virar ${typeLabel(nextType)}`;
  }

  function applyTypeVisualDefaults(obj) {
    const meta = typeMeta[obj.type] || fallbackMeta;
    obj.fill = meta.fill;
    obj.stroke = meta.stroke;
    if (obj.type === "moving-ghost") obj.stroke = "#41a2ff";
    if (obj.type === "door-platform-inv" || obj.type === "door-button-inv") obj.stroke = "#ff65d8";
    if (obj.type === "gravity" || obj.type === "gravity-all") obj.stroke = "transparent";
  }

  function cycleObjectVariant(obj) {
    const nextType = variantType(obj.type);
    if (!nextType) return false;
    const oldDoorId = isDoorType(obj.type) ? parseDoorId(obj) : "";
    obj.type = nextType;
    applyTypeVisualDefaults(obj);
    if (oldDoorId) {
      obj.text = oldDoorId;
      obj.doorId = oldDoorId;
    }
    syncObjectInternals(obj, true);
    return true;
  }

  function cycleSelectedVariant() {
    const obj = selectedObject();
    if (!obj || !canCycleVariant(obj)) return;
    pushHistory();
    const doorId = isDoorType(obj.type) ? parseDoorId(obj) : "";
    const oldMode = isDoorType(obj.type) ? doorMode(obj.type) : "";
    cycleObjectVariant(obj);
    if (doorId) {
      for (const other of objects()) {
        if (other.id !== obj.id && isDoorType(other.type) && parseDoorId(other) === doorId && doorMode(other.type) === oldMode) {
          cycleObjectVariant(other);
        }
      }
    }
    saveLocal();
    render();
    showToast(`${displayName(obj)} atualizado`);
  }

  function normalizeSelectedObject() {
    const obj = selectedObject();
    if (!obj) return;
    pushHistory();
    if (hasMovement(obj)) {
      const data = movingData(obj);
      obj.movingMin = Number.isFinite(data.min) ? data.min : obj.x;
      obj.movingMax = Number.isFinite(data.max) && data.max > obj.movingMin ? data.max : obj.movingMin + 160;
      obj.movingSpeed = Number.isFinite(data.speed) && data.speed !== 0 ? data.speed : 80;
      obj.movingAxis = data.axis;
      setMovementCoord(obj, obj.movingMin, data.axis);
    }
    syncObjectInternals(obj);
    ensurePositiveRect(obj);
    saveLocal();
    render();
    showToast("Objeto organizado");
  }

  function objectCenter(obj) {
    return { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
  }

  function objectRect(obj) {
    return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
  }

  function normalizeRect(a, b) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return { x, y, w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
  }

  function rectsIntersect(a, b) {
    return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
  }

  function selectionBounds(list = selectedObjects()) {
    if (!list.length) return null;
    const minX = Math.min(...list.map((obj) => obj.x));
    const minY = Math.min(...list.map((obj) => obj.y));
    const maxX = Math.max(...list.map((obj) => obj.x + obj.w));
    const maxY = Math.max(...list.map((obj) => obj.y + obj.h));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function doorPartners(obj) {
    return doorPartnersIn(objects(), obj);
  }

  function doorPartnersIn(list, obj) {
    if (!isDoorType(obj.type)) return [];
    const targetType = doorPartnerType(obj.type);
    const id = parseDoorId(obj);
    return list.filter((other) => other.id !== obj.id && other.type === targetType && parseDoorId(other) === id);
  }

  function doorIssues(list = objects()) {
    const issues = [];
    for (const obj of list) {
      if (isDoorType(obj.type) && doorPartnersIn(list, obj).length === 0) {
        issues.push(`${displayName(obj)} sem par`);
      }
    }
    return issues;
  }

  function collectWarnings(list = objects()) {
    const warnings = [];
    if (!list.some((obj) => obj.type === "spawn")) warnings.push("Sem Spawn");
    if (!list.some((obj) => obj.type === "portal")) warnings.push("Sem Portal");
    const outsideMargin = 40;
    const out = list.filter((obj) =>
      obj.x + obj.w < -outsideMargin ||
      obj.y + obj.h < -outsideMargin ||
      obj.x > SLIDE_W + outsideMargin ||
      obj.y > SLIDE_H + outsideMargin
    ).length;
    if (out) warnings.push(`${out} fora do slide`);
    for (const obj of list) {
      if (hasMovement(obj)) {
        const data = movingData(obj);
        if (!Number.isFinite(data.min) || !Number.isFinite(data.max) || data.max <= data.min) warnings.push(`${displayName(obj)} com trajeto invalido`);
        if (!Number.isFinite(data.speed) || data.speed === 0) warnings.push(`${displayName(obj)} com velocidade invalida`);
      }
      if (obj.type === "toggle-platform") {
        const interval = toggleIntervalValue(obj);
        if (!Number.isFinite(interval) || interval <= 0) warnings.push(`${displayName(obj)} sem intervalo valido`);
      }
      if ((obj.type === "spring" || obj.type === "spring-h") && String(obj.text || "").trim() !== "") {
        const force = Number(String(obj.text).replace(",", "."));
        if (!Number.isFinite(force) || force === 0) warnings.push(`${displayName(obj)} com forca invalida`);
      }
    }
    warnings.push(...doorIssues(list));
    return warnings;
  }

  function renderStats() {
    const counts = {};
    for (const obj of objects()) {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    }
    els.stats.innerHTML = Object.entries(counts)
      .sort((a, b) => typeLabel(a[0]).localeCompare(typeLabel(b[0]), "pt-BR"))
      .map(([key, value]) => `<div class="stat"><span>${typeLabel(key)}</span><b>${value}</b></div>`)
      .join("");

    const warnings = collectWarnings();
    els.warnings.innerHTML = warnings.map((msg) => `<div class="warning">${msg}</div>`).join("");
  }

  function renderLayers() {
    els.layerList.innerHTML = "";
    [...objects()].reverse().forEach((obj) => {
      const item = document.createElement("div");
      item.className = `layer-item${hasSelection(obj.id) ? " active" : ""}`;
      item.innerHTML = `
        <span class="layer-dot" style="border-color:${obj.stroke};background:${obj.fill === "transparent" ? "#111" : obj.fill}"></span>
        <span class="layer-name">${displayName(obj)}</span>
        ${obj.hidden ? `<span class="layer-flag">oculto</span>` : ""}
        <span class="layer-type">${typeLabel(obj.type)}</span>
      `;
      item.addEventListener("click", (e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSelection(obj.id);
        else setSelection([obj.id], obj.id);
        setTool("select");
        render();
      });
      els.layerList.appendChild(item);
    });
  }

  function renderInspector() {
    syncSelection();
    const obj = selectedObject();
    const multiCount = state.selectedIds.length;
    els.emptyInspector.classList.toggle("hidden", !!obj);
    els.inspector.classList.toggle("hidden", !obj);
    els.quickEdit.classList.toggle("hidden", !obj);
    if (!obj) return;

    els.propType.innerHTML = inspectorTypeEntries(obj.type)
      .map(([type, meta]) => `<option value="${type}">${meta.label}</option>`)
      .join("");
    els.propType.value = obj.type;
    els.propName.value = obj.name || "";
    els.propX.value = round(obj.x);
    els.propY.value = round(obj.y);
    els.propW.value = round(obj.w);
    els.propH.value = round(obj.h);
    els.propText.value = obj.type === "toggle-platform" ? toggleIntervalValue(obj) : (obj.text || "");
    els.propFill.value = colorSafe(obj.fill);
    els.propStroke.value = colorSafe(obj.stroke, "#ffffff");
    els.propLocked.checked = !!obj.locked;
    els.propHidden.checked = !!obj.hidden;
    const textField = els.propText.closest("label");
    const nameField = els.propName.closest("label");
    const autoName = typeMeta[obj.type] !== undefined;
    nameField.classList.toggle("compact-hidden", autoName);
    els.propName.disabled = autoName;
    const canMove = canMoveType(obj.type);
    const movingOn = hasMovement(obj);
    els.movingFields.classList.toggle("hidden", !canMove);
    els.toggleFields.classList.toggle("hidden", obj.type !== "toggle-platform");
    if (els.toggleInverted) els.toggleInverted.checked = toggleStartsInvisible(obj);
    textField.classList.toggle("compact-hidden", isMovingType(obj.type) || obj.type === "gravity-all");
    if (els.moveEnabled) {
      els.moveEnabled.checked = movingOn;
      els.moveEnabled.disabled = isMovingType(obj.type);
    }
    if (els.moveAxis) {
      els.moveAxis.value = movementAxis(obj);
      els.moveAxis.disabled = !movingOn || isMovingType(obj.type);
    }
    if (els.moveAxisLabel) els.moveAxisLabel.classList.toggle("compact-hidden", isMovingType(obj.type));
    [els.moveMin, els.moveMax, els.moveSpeed].forEach((input) => {
      input.disabled = canMove && !movingOn;
    });
    els.quickEdit.classList.remove("hidden");
    els.variantBtn.disabled = !canCycleVariant(obj);
    els.variantBtn.textContent = variantButtonText(obj);
    els.pairBtn.disabled = !isDoorType(obj.type);
    els.normalizeBtn.disabled = false;
    els.computedNote.textContent = "";

    if (canMove) {
      const data = movingData(obj) || parseMovingText("", obj.x, obj.y, movementAxis(obj));
      els.moveMin.value = round(data.min);
      els.moveMax.value = round(data.max);
      els.moveSpeed.value = round(data.speed);
    }

    if (isMovingType(obj.type)) {
      els.propTextLabel.textContent = "Texto interno";
      els.computedNote.textContent = `Auto: nome ${obj.name}, texto ${obj.text}. O motor inicia a plataforma no Inicio e move ate o Fim.`;
    } else if (isDoorType(obj.type)) {
      els.propText.value = parseDoorId(obj);
      els.propTextLabel.textContent = "ID da porta";
      const partner = doorPartners(obj);
      const internal = isDoorPlatformType(obj.type) ? `${obj.name}` : `${obj.name} com texto ${parseDoorId(obj)}`;
      els.computedNote.textContent = partner.length
        ? `Auto: ${internal}. Ligado com ${partner.map(displayName).join(", ")}.`
        : `Auto: ${internal}. Crie um par com o mesmo ID.`;
    } else if (obj.type === "gravity-all") {
      els.propTextLabel.textContent = "Modo";
      els.computedNote.textContent = "Auto: nome #!, texto all. Afeta todos os jogadores no coop.";
    } else if (obj.type === "gravity") {
      els.propTextLabel.textContent = "Texto";
      els.computedNote.textContent = "Auto: nome #!, texto vazio. Afeta somente quem pegou.";
    } else if (obj.type === "spring" || obj.type === "spring-h") {
      els.propTextLabel.textContent = "Forca (vazio = 450)";
    } else if (obj.type === "portal") {
      els.propTextLabel.textContent = "Destino";
    } else if (obj.type === "toggle-platform") {
      els.propTextLabel.textContent = "Intervalo";
      els.computedNote.textContent = toggleStartsInvisible(obj)
        ? "Auto: texto interno negativo. Comeca sem colisao e aparece no primeiro ciclo."
        : "Auto: comeca visivel e alterna pelo intervalo.";
    } else if (obj.type === "door-button" || obj.type === "door-button-inv") {
      els.propTextLabel.textContent = "ID da porta";
    } else {
      els.propTextLabel.textContent = "Texto";
    }

    if (canMove && movingOn && !isMovingType(obj.type)) {
      const note = `Movel: nome ${obj.name}. O texto do objeto continua ${obj.text || "vazio"}.`;
      els.computedNote.textContent = els.computedNote.textContent ? `${els.computedNote.textContent} ${note}` : note;
    }

    if (multiCount > 1) {
      const note = `${multiCount} objetos selecionados. Mover, duplicar, excluir e setas afetam todos.`;
      els.computedNote.textContent = els.computedNote.textContent ? `${note} ${els.computedNote.textContent}` : note;
    }
  }

  function renderObject(obj) {
    const g = svgEl("g", {
      class: `object ${hasSelection(obj.id) ? "selected" : ""} ${obj.locked ? "locked" : ""} ${obj.hidden ? "hidden-initial" : ""}`,
      "data-id": obj.id
    });

    if (hasMovement(obj) && !isMovingType(obj.type)) drawMovementPath(g, obj);

    if (obj.type === "coin") drawCoin(g, obj);
    else if (obj.type === "portal") drawPortal(g, obj);
    else if (obj.type === "spring" || obj.type === "spring-h") drawSpring(g, obj);
    else if (obj.type === "spawn") drawSpawn(g, obj);
    else if (obj.type === "death") drawDeath(g, obj);
    else if (obj.type === "water") drawWater(g, obj);
    else if (obj.type === "moving-platform" || obj.type === "moving-ghost") drawMovingPlatform(g, obj);
    else if (["p1-platform", "p2-platform", "toggle-platform", "ice"].includes(obj.type)) drawSpecialPlatform(g, obj);
    else if (["jump", "speed", "gravity", "gravity-all", "big-player", "mini-player", "door-button", "door-button-inv"].includes(obj.type)) drawBadgeObject(g, obj);
    else if (obj.type === "door-platform" || obj.type === "door-platform-inv") drawDoorPlatform(g, obj);
    else drawRectObject(g, obj);

    if (obj.type !== "platform" && obj.w > 14 && obj.h > 10) {
      g.appendChild(svgEl("text", {
        class: "shape-label",
        x: obj.x + obj.w / 2,
        y: obj.y + obj.h + 10,
        "text-anchor": "middle"
      }, [document.createTextNode(displayName(obj))]));
    }

    g.addEventListener("pointerdown", onObjectPointerDown);
    g.addEventListener("contextmenu", (e) => {
      e.stopPropagation();
      showContextMenu(e, obj);
    });
    return g;
  }

  function commonRectAttrs(obj, extra = {}) {
    return {
      class: "shape-main",
      x: obj.x,
      y: obj.y,
      width: obj.w,
      height: obj.h,
      fill: obj.fill || "#000",
      stroke: obj.stroke || "#fff",
      "stroke-width": obj.strokeWidth || 1,
      "vector-effect": "non-scaling-stroke",
      ...extra
    };
  }

  function drawRectObject(g, obj) {
    const rx = obj.type === "platform" ? 0 : 1;
    g.appendChild(svgEl("rect", commonRectAttrs(obj, { rx })));
  }

  function drawMovingPlatform(g, obj) {
    const data = drawMovementPath(g, obj);
    if (!data) return;
    const y = obj.y + obj.h / 2;
    const attrs = commonRectAttrs(obj, {
      stroke: "#41a2ff",
      "stroke-dasharray": obj.type === "moving-ghost" ? "5 4" : undefined
    });
    g.appendChild(svgEl("rect", attrs));
    if (obj.type === "moving-platform") {
      g.appendChild(svgEl("circle", { cx: obj.x + 5, cy: y, r: 1.6, fill: "#41a2ff" }));
      g.appendChild(svgEl("circle", { cx: obj.x + obj.w - 5, cy: y, r: 1.6, fill: "#41a2ff" }));
    }
  }

  function drawMovementPath(g, obj) {
    const data = movingData(obj);
    if (!data) return null;
    const axis = data.axis;
    const x = obj.x + obj.w / 2;
    const y = obj.y + obj.h / 2;
    const x1 = axis === "y" ? x : data.min;
    const y1 = axis === "y" ? data.min : y;
    const x2 = axis === "y" ? x : data.max + obj.w;
    const y2 = axis === "y" ? data.max + obj.h : y;
    g.appendChild(svgEl("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: "rgba(65,162,255,.45)",
      "stroke-width": 1,
      "stroke-dasharray": "5 5",
      "vector-effect": "non-scaling-stroke"
    }));
    g.appendChild(svgEl("circle", { cx: x1, cy: y1, r: 2.4, fill: "#41a2ff" }));
    g.appendChild(svgEl("circle", { cx: x2, cy: y2, r: 2.4, fill: "#41a2ff" }));
    return data;
  }

  function drawSpecialPlatform(g, obj) {
    const base = commonRectAttrs(obj, { fill: "#000000" });
    if (obj.type === "p1-platform") {
      g.appendChild(svgEl("rect", { ...base, stroke: "#41a2ff" }));
      for (let x = obj.x + 8; x < obj.x + obj.w; x += 14) {
        g.appendChild(svgEl("line", { x1: x, y1: obj.y + 2, x2: x - 6, y2: obj.y + obj.h - 2, stroke: "#41a2ff", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
      }
    } else if (obj.type === "p2-platform") {
      g.appendChild(svgEl("rect", { ...base, stroke: "#ffdf40" }));
      for (let x = obj.x + 5; x < obj.x + obj.w; x += 14) {
        g.appendChild(svgEl("line", { x1: x, y1: obj.y + obj.h - 2, x2: x + 6, y2: obj.y + 2, stroke: "#ffdf40", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
      }
    } else if (obj.type === "toggle-platform") {
      g.appendChild(svgEl("rect", { ...base, stroke: "#a47cff", "stroke-dasharray": "7 4" }));
      g.appendChild(svgEl("circle", { cx: obj.x + obj.w / 2, cy: obj.y + obj.h / 2, r: Math.min(4, obj.h / 2 - 1), fill: "#a47cff" }));
    } else if (obj.type === "ice") {
      g.appendChild(svgEl("rect", { ...base, stroke: "#83d5ff", fill: "rgba(131,213,255,.08)" }));
      g.appendChild(svgEl("path", { d: `M ${obj.x + 5} ${obj.y + obj.h - 3} L ${obj.x + obj.w * .35} ${obj.y + 3} L ${obj.x + obj.w * .55} ${obj.y + obj.h - 3} L ${obj.x + obj.w - 5} ${obj.y + 3}`, fill: "none", stroke: "rgba(131,213,255,.8)", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    }
  }

  function drawDoorPlatform(g, obj) {
    const attrs = commonRectAttrs(obj, {
      fill: obj.type === "door-platform-inv" ? "rgba(255,101,216,.14)" : "#000000",
      stroke: "#ff65d8"
    });
    if (obj.type === "door-platform-inv") attrs["stroke-dasharray"] = "4 3";
    g.appendChild(svgEl("rect", attrs));
  }

  function displayName(obj) {
    if (obj.type === "spring" && !obj.text) return "#&";
    if (obj.type === "spring-h" && !obj.text) return "#?";
    if (obj.type === "door-button") return `Botao ${parseDoorId(obj)}`;
    if (obj.type === "door-button-inv") return `Botao inv ${parseDoorId(obj)}`;
    if (obj.type === "door-platform") return `Porta ${parseDoorId(obj)}`;
    if (obj.type === "door-platform-inv") return `Porta inv ${parseDoorId(obj)}`;
    if (["jump", "speed", "big-player", "mini-player", "door-button", "door-button-inv"].includes(obj.type) && obj.text) return `${obj.name} ${obj.text}`;
    return obj.name || typeLabel(obj.type);
  }

  function drawBadgeObject(g, obj) {
    if (obj.type === "gravity" || obj.type === "gravity-all") {
      drawGravityObject(g, obj);
      return;
    }
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const isRound = obj.type === "door-button" || obj.type === "door-button-inv";
    if (isRound) {
      g.appendChild(svgEl("ellipse", {
        class: "shape-main",
        cx,
        cy,
        rx: obj.w / 2,
        ry: obj.h / 2,
        fill: "#000000",
        stroke: "#ff65d8",
        "stroke-width": 1.5,
        "vector-effect": "non-scaling-stroke"
      }));
    } else {
      g.appendChild(svgEl("rect", commonRectAttrs(obj, { rx: 2 })));
    }

    const text = obj.type === "big-player" ? "+" : obj.type === "mini-player" ? "-" : (obj.text || "");
    if (text) {
      g.appendChild(svgEl("text", {
        x: cx,
        y: cy + 3,
        "text-anchor": "middle",
        "font-size": Math.min(12, obj.h * .7),
        "font-family": "monospace",
        "font-weight": 800,
        fill: obj.stroke || "#ffffff"
      }, [document.createTextNode(text)]));
    }
  }

  function drawGravityObject(g, obj) {
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    g.appendChild(svgEl("rect", {
      class: "shape-main",
      x: obj.x,
      y: obj.y,
      width: obj.w,
      height: obj.h,
      fill: "#000000",
      stroke: "transparent"
    }));
    if (obj.type === "gravity-all") {
      g.appendChild(svgEl("ellipse", {
        cx,
        cy,
        rx: obj.w * .45,
        ry: obj.h * .45,
        fill: "none",
        stroke: "rgba(255,255,255,.35)",
        "stroke-width": 1,
        "vector-effect": "non-scaling-stroke"
      }));
    }
    g.appendChild(svgEl("line", {
      x1: obj.x + obj.w * .2,
      y1: cy,
      x2: obj.x + obj.w * .8,
      y2: cy,
      stroke: "#ffffff",
      "stroke-width": 1.2,
      "vector-effect": "non-scaling-stroke"
    }));
    g.appendChild(svgEl("path", {
      d: `M ${cx} ${obj.y + obj.h * .18} L ${cx} ${obj.y + obj.h * .82}
          M ${cx - obj.w * .16} ${obj.y + obj.h * .32} L ${cx} ${obj.y + obj.h * .18} L ${cx + obj.w * .16} ${obj.y + obj.h * .32}
          M ${cx - obj.w * .16} ${obj.y + obj.h * .68} L ${cx} ${obj.y + obj.h * .82} L ${cx + obj.w * .16} ${obj.y + obj.h * .68}`,
      fill: "none",
      stroke: "#ffffff",
      "stroke-width": 1.2,
      "vector-effect": "non-scaling-stroke"
    }));
  }

  function drawDeath(g, obj) {
    g.appendChild(svgEl("rect", commonRectAttrs(obj, { fill: "url(#deathPattern)", stroke: "#ff0000" })));
  }

  function drawWater(g, obj) {
    g.appendChild(svgEl("rect", commonRectAttrs(obj, { fill: "rgba(41,123,255,.42)", stroke: "#74c6ff" })));
    g.appendChild(svgEl("path", {
      d: `M ${obj.x} ${obj.y + 8} C ${obj.x + obj.w * .25} ${obj.y - 2}, ${obj.x + obj.w * .35} ${obj.y + 18}, ${obj.x + obj.w * .55} ${obj.y + 8} S ${obj.x + obj.w * .85} ${obj.y - 2}, ${obj.x + obj.w} ${obj.y + 8}`,
      fill: "none",
      stroke: "rgba(255,255,255,.65)",
      "stroke-width": 1,
      "vector-effect": "non-scaling-stroke"
    }));
  }

  function drawCoin(g, obj) {
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    g.appendChild(svgEl("ellipse", {
      class: "shape-main",
      cx,
      cy,
      rx: obj.w / 2,
      ry: obj.h / 2,
      fill: "#000000",
      stroke: "#feec00",
      "stroke-width": 1.4,
      "vector-effect": "non-scaling-stroke"
    }));
    g.appendChild(svgEl("ellipse", {
      cx,
      cy,
      rx: Math.max(1, obj.w * .22),
      ry: Math.max(1, obj.h * .22),
      fill: "#feec00",
      opacity: ".85"
    }));
  }

  function drawPortal(g, obj) {
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const points = [
      [cx, obj.y],
      [obj.x + obj.w, cy],
      [cx, obj.y + obj.h],
      [obj.x, cy]
    ].map((p) => p.join(",")).join(" ");
    g.appendChild(svgEl("polygon", {
      class: "shape-main",
      points,
      fill: "#000000",
      stroke: "#00c8ff",
      "stroke-width": 1.6,
      "vector-effect": "non-scaling-stroke"
    }));
    g.appendChild(svgEl("polygon", {
      points,
      fill: "none",
      stroke: "rgba(0,200,255,.35)",
      "stroke-width": 6,
      "vector-effect": "non-scaling-stroke"
    }));
  }

  function drawSpring(g, obj) {
    g.appendChild(svgEl("rect", commonRectAttrs(obj, { fill: "#000000", stroke: "#feec00" })));
    if (obj.type === "spring-h") {
      const x = obj.x + obj.w / 2;
      const top = obj.y + 4;
      const bottom = obj.y + obj.h - 4;
      const mid = (top + bottom) / 2;
      g.appendChild(svgEl("polyline", {
        points: `${x},${top} ${obj.x + obj.w - 1},${top + 8} ${obj.x + 1},${mid} ${obj.x + obj.w - 1},${bottom - 8} ${x},${bottom}`,
        fill: "none",
        stroke: "#feec00",
        "stroke-width": 1.2,
        "vector-effect": "non-scaling-stroke"
      }));
      return;
    }
    const y = obj.y + obj.h / 2;
    const left = obj.x + 4;
    const right = obj.x + obj.w - 4;
    const mid = (left + right) / 2;
    g.appendChild(svgEl("polyline", {
      points: `${left},${y} ${left + 8},${obj.y + 1} ${mid},${obj.y + obj.h - 1} ${right - 8},${obj.y + 1} ${right},${y}`,
      fill: "none",
      stroke: "#feec00",
      "stroke-width": 1.2,
      "vector-effect": "non-scaling-stroke"
    }));
  }

  function drawSpawn(g, obj) {
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    g.appendChild(svgEl("ellipse", {
      class: "shape-main",
      cx,
      cy,
      rx: obj.w / 2,
      ry: obj.h / 2,
      fill: "#000000",
      stroke: "#20b15a",
      "stroke-width": 1.5,
      "vector-effect": "non-scaling-stroke"
    }));
    g.appendChild(svgEl("line", { x1: cx, y1: cy - 7, x2: cx, y2: cy + 7, stroke: "#20b15a", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    g.appendChild(svgEl("line", { x1: cx - 7, y1: cy, x2: cx + 7, y2: cy, stroke: "#20b15a", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
  }

  function renderOverlay() {
    els.overlayLayer.innerHTML = "";
    if (state.drag?.mode === "marquee") renderMarquee();
    const selected = selectedObjects();
    const obj = selectedObject();
    if (!obj) return;
    if (selected.length > 1) {
      renderMultiSelection(selected);
      return;
    }
    renderDoorConnector(obj);
    renderMovingConnector(obj);
    const pad = 0;
    els.overlayLayer.appendChild(svgEl("rect", {
      class: "overlay-rect",
      x: obj.x - pad,
      y: obj.y - pad,
      width: obj.w + pad * 2,
      height: obj.h + pad * 2
    }));

    const size = Math.max(5, state.view.w / 140);
    const handles = {
      nw: [obj.x, obj.y],
      ne: [obj.x + obj.w, obj.y],
      sw: [obj.x, obj.y + obj.h],
      se: [obj.x + obj.w, obj.y + obj.h]
    };
    for (const [name, point] of Object.entries(handles)) {
      const h = svgEl("rect", {
        class: `handle ${name}`,
        "data-handle": name,
        x: point[0] - size / 2,
        y: point[1] - size / 2,
        width: size,
        height: size
      });
      h.addEventListener("pointerdown", onHandlePointerDown);
      els.overlayLayer.appendChild(h);
    }
  }

  function renderMultiSelection(selected) {
    for (const item of selected) {
      els.overlayLayer.appendChild(svgEl("rect", {
        class: "selection-member-rect",
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h
      }));
    }
    const bounds = selectionBounds(selected);
    if (!bounds) return;
    els.overlayLayer.appendChild(svgEl("rect", {
      class: "selection-bounds",
      x: bounds.x,
      y: bounds.y,
      width: bounds.w,
      height: bounds.h
    }));
  }

  function renderMarquee() {
    const rect = normalizeRect(state.drag.start, state.drag.current || state.drag.start);
    if (rect.w < 2 && rect.h < 2) return;
    els.overlayLayer.appendChild(svgEl("rect", {
      class: "marquee-rect",
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h
    }));
  }

  function renderMovingConnector(obj) {
    if (!hasMovement(obj)) return;
    const data = movingData(obj);
    const axis = data.axis;
    const centerX = obj.x + obj.w / 2;
    const centerY = obj.y + obj.h / 2;
    const startX = axis === "y" ? centerX : data.min;
    const startY = axis === "y" ? data.min : centerY;
    const endX = axis === "y" ? centerX : data.max + obj.w;
    const endY = axis === "y" ? data.max + obj.h : centerY;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    els.overlayLayer.appendChild(svgEl("line", {
      class: "move-path",
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY
    }));
    [
      ["move-path-min", startX, startY],
      ["move-path-all", midX, midY],
      ["move-path-max", endX, endY]
    ].forEach(([mode, x, hy]) => {
      const handle = svgEl("circle", {
        class: `path-handle ${mode}`,
        "data-mode": mode,
        cx: x,
        cy: hy,
        r: mode === "move-path-all" ? 5 : 4
      });
      handle.addEventListener("pointerdown", onPathHandlePointerDown);
      els.overlayLayer.appendChild(handle);
    });
  }

  function renderDoorConnector(obj) {
    if (!isDoorType(obj.type)) return;
    const start = objectCenter(obj);
    const partners = doorPartners(obj);
    if (partners.length) {
      for (const partner of partners) {
        const end = objectCenter(partner);
        const midX = (start.x + end.x) / 2;
        els.overlayLayer.appendChild(svgEl("path", {
          class: "door-link",
          d: `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`
        }));
      }
    } else {
      els.overlayLayer.appendChild(svgEl("circle", {
        class: "door-link missing",
        cx: start.x,
        cy: start.y,
        r: Math.max(16, Math.min(obj.w, obj.h) + 12)
      }));
      els.overlayLayer.appendChild(svgEl("text", {
        class: "door-warning",
        x: obj.x + obj.w + 8,
        y: obj.y - 6
      }, [document.createTextNode("!")]));
    }
  }

  function renderObjects() {
    els.objectLayer.innerHTML = "";
    for (const obj of objects()) {
      els.objectLayer.appendChild(renderObject(obj));
    }
  }

  function render() {
    renderView();
    renderTabs();
    renderObjects();
    renderOverlay();
    renderInspector();
    renderLayers();
    renderStats();
    els.gridLayer.style.display = state.grid ? "" : "none";
    els.gridToggle.checked = state.grid;
    els.snapToggle.checked = state.snap;
    els.gridSize.value = state.gridSize;
    els.gridSizeText.textContent = state.gridSize;
    document.querySelector(".app-shell").classList.toggle("tabs-collapsed", state.tabsCollapsed);
    document.querySelector(".app-shell").classList.toggle("right-hidden", state.rightHidden);
    els.toggleTabsBtn.textContent = state.tabsCollapsed ? "Mostrar" : "Ocultar";
    els.toggleRightBtn.textContent = state.rightHidden ? "Mostrar insp." : "Inspetor";
    document.getElementById("useExampleBtn").disabled = false;
    document.getElementById("useExampleBtn").textContent = activeTab().example ? "Usar como base" : "Duplicar fase";
    els.removeTabBtn.disabled = state.tabs.length <= 1;
  }

  function pointFromEvent(e) {
    const pt = els.stage.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const world = pt.matrixTransform(els.stage.getScreenCTM().inverse());
    const point = { x: world.x, y: world.y };
    state.lastPointer = point;
    return point;
  }

  function onObjectPointerDown(e) {
    if (state.tool !== "select") return;
    if (e.button !== 0) return;
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const obj = objects().find((item) => item.id === id);
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!obj || obj.locked) {
      if (additive) toggleSelection(id);
      else setSelection([id], id);
      render();
      return;
    }
    if (additive) {
      toggleSelection(id);
      if (!hasSelection(id)) {
        render();
        return;
      }
    } else if (!hasSelection(id)) {
      setSelection([id], id);
    } else {
      state.selectedId = id;
    }
    pushHistory();
    const p = pointFromEvent(e);
    const movable = selectedObjects().filter((item) => !item.locked);
    state.drag = {
      mode: "move",
      id,
      ids: movable.map((item) => item.id),
      start: p,
      original: clone(obj),
      originals: movable.reduce((acc, item) => {
        acc[item.id] = clone(item);
        return acc;
      }, {})
    };
    els.stage.setPointerCapture(e.pointerId);
    render();
  }

  function onHandlePointerDown(e) {
    const obj = selectedObject();
    if (!obj || obj.locked) return;
    e.stopPropagation();
    pushHistory();
    state.drag = {
      mode: "resize",
      id: obj.id,
      handle: e.currentTarget.dataset.handle,
      start: pointFromEvent(e),
      original: clone(obj)
    };
    els.stage.setPointerCapture(e.pointerId);
  }

  function onPathHandlePointerDown(e) {
    const obj = selectedObject();
    if (!obj || obj.locked || !hasMovement(obj)) return;
    e.stopPropagation();
    pushHistory();
    state.drag = {
      mode: e.currentTarget.dataset.mode,
      id: obj.id,
      start: pointFromEvent(e),
      original: clone(obj)
    };
    els.stage.setPointerCapture(e.pointerId);
  }

  function beginPan(e) {
    state.drag = {
      mode: "pan",
      startClient: { x: e.clientX, y: e.clientY },
      view: { ...state.view }
    };
    els.stage.setPointerCapture(e.pointerId);
    els.stage.classList.add("panning");
  }

  function beginCreate(e) {
    const p = pointFromEvent(e);
    const type = state.tool;
    const meta = typeMeta[type] || fallbackMeta;
    const fixed = ["coin", "portal", "spring", "spring-h", "spawn", "jump", "speed", "gravity", "gravity-all", "big-player", "mini-player", "door-button", "door-button-inv"].includes(type);
    pushHistory();
    let obj;
    if (fixed) {
      obj = makeObject(type, snapValue(p.x - meta.w / 2), snapValue(p.y - meta.h / 2));
      objects().push(obj);
      setSelection([obj.id], obj.id);
      state.drag = { mode: "move", id: obj.id, start: p, original: clone(obj) };
    } else {
      obj = makeObject(type, snapValue(p.x), snapValue(p.y), { w: 1, h: 1 });
      objects().push(obj);
      setSelection([obj.id], obj.id);
      state.drag = { mode: "draw", id: obj.id, start: { x: obj.x, y: obj.y } };
    }
    els.stage.setPointerCapture(e.pointerId);
    render();
  }

  function onStagePointerDown(e) {
    hideContextMenu();
    if (e.button === 2) return;
    if (e.button === 1 || state.tool === "pan" || state.spaceDown) {
      beginPan(e);
      return;
    }
    if (state.tool === "select") {
      const p = pointFromEvent(e);
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      if (!additive) clearSelection();
      state.drag = { mode: "marquee", start: p, current: p, additive, moved: false };
      els.stage.setPointerCapture(e.pointerId);
      render();
      return;
    }
    beginCreate(e);
  }

  function onStagePointerMove(e) {
    const p = pointFromEvent(e);
    els.cursorReadout.textContent = `x ${round(p.x)}, y ${round(p.y)}`;
    if (!state.drag) return;

    if (state.drag.mode === "pan") {
      const scaleX = state.view.w / els.stage.clientWidth;
      const scaleY = state.view.h / els.stage.clientHeight;
      state.view.x = state.drag.view.x - (e.clientX - state.drag.startClient.x) * scaleX;
      state.view.y = state.drag.view.y - (e.clientY - state.drag.startClient.y) * scaleY;
      renderView();
      return;
    }

    if (state.drag.mode === "marquee") {
      state.drag.current = p;
      state.drag.moved = Math.abs(p.x - state.drag.start.x) > 2 || Math.abs(p.y - state.drag.start.y) > 2;
      render();
      return;
    }

    if (state.drag.mode === "move") {
      moveDraggedSelection(p);
      render();
      return;
    }

    const obj = objects().find((item) => item.id === state.drag.id);
    if (!obj) return;

    if (state.drag.mode === "draw") {
      obj.x = state.drag.start.x;
      obj.y = state.drag.start.y;
      obj.w = snapValue(p.x) - state.drag.start.x;
      obj.h = snapValue(p.y) - state.drag.start.y;
      ensurePositiveRect(obj);
    } else if (state.drag.mode === "resize") {
      resizeObject(obj, p);
    } else if (state.drag.mode === "move-path-min" || state.drag.mode === "move-path-max" || state.drag.mode === "move-path-all") {
      resizeMovingPath(obj, p);
    }
    render();
  }

  function moveDraggedSelection(p) {
    const ids = state.drag.ids?.length ? state.drag.ids : [state.drag.id];
    for (const id of ids) {
      const obj = objects().find((item) => item.id === id);
      const original = state.drag.originals?.[id] || state.drag.original;
      if (!obj || !original || obj.locked) continue;
      obj.x = snapValue(original.x + (p.x - state.drag.start.x));
      obj.y = snapValue(original.y + (p.y - state.drag.start.y));
      if (hasMovement(obj)) {
        const axis = movementAxis(obj);
        const delta = axis === "y" ? obj.y - original.y : obj.x - original.x;
        obj.movingMin = round(Number(original.movingMin) + delta);
        obj.movingMax = round(Number(original.movingMax) + delta);
        setMovingText(obj);
      }
    }
  }

  function selectObjectsInMarquee() {
    if (!state.drag?.moved) return;
    const rect = normalizeRect(state.drag.start, state.drag.current || state.drag.start);
    const hits = objects().filter((obj) => !obj.locked && rectsIntersect(rect, objectRect(obj))).map((obj) => obj.id);
    if (state.drag.additive) setSelection([...state.selectedIds, ...hits], hits[hits.length - 1] || state.selectedId);
    else setSelection(hits, hits[hits.length - 1] || null);
  }

  function resizeMovingPath(obj, p) {
    const original = state.drag.original;
    const axis = movementAxis(obj);
    const pointerCoord = axis === "y" ? snapValue(p.y) : snapValue(p.x);
    const dragStartCoord = axis === "y" ? snapValue(state.drag.start.y) : snapValue(state.drag.start.x);
    const delta = pointerCoord - dragStartCoord;
    const startMin = Number(original.movingMin);
    const startMax = Number(original.movingMax);
    if (state.drag.mode === "move-path-min") {
      obj.movingMin = Math.min(pointerCoord, startMax - 1);
      setMovementCoord(obj, obj.movingMin, axis);
    } else if (state.drag.mode === "move-path-max") {
      obj.movingMax = Math.max(pointerCoord - movementSize(obj, axis), startMin + 1);
    } else {
      obj.movingMin = startMin + delta;
      obj.movingMax = startMax + delta;
      obj.x = original.x + (axis === "x" ? delta : 0);
      obj.y = original.y + (axis === "y" ? delta : 0);
    }
    if (axis === "x") obj.y = original.y;
    else obj.x = original.x;
    setMovingText(obj);
  }

  function resizeObject(obj, p) {
    const start = state.drag.original;
    const handle = state.drag.handle;
    const sx = snapValue(p.x);
    const sy = snapValue(p.y);
    if (handle.includes("w")) {
      obj.x = Math.min(sx, start.x + start.w - 1);
      obj.w = start.x + start.w - obj.x;
    }
    if (handle.includes("e")) {
      obj.w = Math.max(1, sx - start.x);
    }
    if (handle.includes("n")) {
      obj.y = Math.min(sy, start.y + start.h - 1);
      obj.h = start.y + start.h - obj.y;
    }
    if (handle.includes("s")) {
      obj.h = Math.max(1, sy - start.y);
    }
  }

  function onStagePointerUp(e) {
    const finishedDrag = state.drag ? { ...state.drag } : null;
    if (state.drag?.mode === "marquee") {
      selectObjectsInMarquee();
    }
    if (state.drag?.mode === "draw") {
      const obj = objects().find((item) => item.id === state.drag.id);
      if (obj) {
        if (obj.w < 4) obj.w = typeMeta[obj.type]?.w || 24;
        if (obj.h < 4) obj.h = typeMeta[obj.type]?.h || 24;
      }
    }
    if (finishedDrag?.id) {
      const obj = objects().find((item) => item.id === finishedDrag.id);
      if (obj && hasMovement(obj)) {
        const axis = movementAxis(obj);
        if (finishedDrag.mode === "draw") {
          const start = movementCoord(obj, axis);
          obj.movingMin = round(start);
          obj.movingMax = round(start + 160);
          obj.movingSpeed = Number.isFinite(Number(obj.movingSpeed)) ? obj.movingSpeed : 80;
        } else if (finishedDrag.mode === "resize" && movementCoord(finishedDrag.original, axis) !== movementCoord(obj, axis)) {
          const start = movementCoord(obj, axis);
          obj.movingMin = round(start);
          if (Number(obj.movingMax) <= Number(obj.movingMin)) obj.movingMax = round(start + 160);
        }
        syncObjectInternals(obj);
      }
    }
    if (finishedDrag?.mode === "move" && finishedDrag.ids?.length) {
      for (const id of finishedDrag.ids) {
        const obj = objects().find((item) => item.id === id);
        if (obj) syncObjectInternals(obj);
      }
    }
    state.drag = null;
    els.stage.classList.remove("panning");
    try {
      els.stage.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture can already be gone after a context menu or focus loss.
    }
    saveLocal();
    render();
  }

  function zoomAt(e) {
    e.preventDefault();
    const p = pointFromEvent(e);
    const old = { ...state.view };
    const factor = e.deltaY > 0 ? 1.12 : 0.88;
    const newW = clamp(old.w * factor, 120, 1440);
    const newH = newW * (SLIDE_H / SLIDE_W);
    const relX = (p.x - old.x) / old.w;
    const relY = (p.y - old.y) / old.h;
    state.view.w = newW;
    state.view.h = newH;
    state.view.x = p.x - relX * newW;
    state.view.y = p.y - relY * newH;
    renderView();
  }

  function duplicateSelected() {
    const selection = selectedObjects();
    if (!selection.length) return;
    pushHistory();
    const copies = cloneObjectsForInsert(selection, state.gridSize, state.gridSize);
    objects().push(...copies);
    setSelection(copies.map((copy) => copy.id), copies[copies.length - 1]?.id || null);
    saveLocal();
    render();
  }

  function copySelected() {
    const selection = selectedObjects();
    if (!selection.length) return;
    state.clipboard = clone(selection);
    showToast(selection.length > 1 ? `${selection.length} objetos copiados` : "Objeto copiado");
  }

  function pasteClipboard() {
    if (!state.clipboard) return;
    pushHistory();
    const source = Array.isArray(state.clipboard) ? state.clipboard : [state.clipboard];
    const bounds = selectionBounds(source);
    const offsetX = bounds ? snapValue(state.lastPointer.x - bounds.x - bounds.w / 2) : 0;
    const offsetY = bounds ? snapValue(state.lastPointer.y - bounds.y - bounds.h / 2) : 0;
    const copies = cloneObjectsForInsert(source, offsetX, offsetY);
    objects().push(...copies);
    setSelection(copies.map((copy) => copy.id), copies[copies.length - 1]?.id || null);
    saveLocal();
    render();
  }

  function deleteSelected() {
    if (!state.selectedIds.length) return;
    pushHistory();
    const selected = new Set(state.selectedIds);
    activeTab().objects = objects().filter((obj) => !selected.has(obj.id));
    clearSelection();
    saveLocal();
    render();
  }

  function bringSelectedFront() {
    const list = objects();
    const selected = new Set(state.selectedIds);
    if (!selected.size) return;
    pushHistory();
    const stay = list.filter((item) => !selected.has(item.id));
    const move = list.filter((item) => selected.has(item.id));
    activeTab().objects = [...stay, ...move];
    saveLocal();
    render();
  }

  function sendSelectedBack() {
    const list = objects();
    const selected = new Set(state.selectedIds);
    if (!selected.size) return;
    pushHistory();
    const move = list.filter((item) => selected.has(item.id));
    const stay = list.filter((item) => !selected.has(item.id));
    activeTab().objects = [...move, ...stay];
    saveLocal();
    render();
  }

  function toggleSelectedLock() {
    const selection = selectedObjects();
    if (!selection.length) return;
    pushHistory();
    const locked = !selectedObject()?.locked;
    selection.forEach((obj) => {
      obj.locked = locked;
    });
    saveLocal();
    render();
  }

  function createDoorPair() {
    const obj = selectedObject();
    if (!obj || !isDoorType(obj.type)) return;
    const partnerType = doorPartnerType(obj.type);
    const id = parseDoorId(obj);
    const x = isDoorButtonType(obj.type) ? obj.x + 72 : obj.x - 48;
    const y = isDoorButtonType(obj.type) ? obj.y - 34 : obj.y + obj.h + 24;
    pushHistory();
    const partner = makeObject(partnerType, clamp(x, 0, SLIDE_W - 90), clamp(y, 0, SLIDE_H - 30), { text: id, doorId: id });
    objects().push(partner);
    setSelection([partner.id], partner.id);
    saveLocal();
    render();
  }

  function nudgeSelected(dx, dy) {
    const selection = selectedObjects().filter((obj) => !obj.locked);
    if (!selection.length) return;
    pushHistory();
    selection.forEach((obj) => {
      obj.x = round(obj.x + dx);
      obj.y = round(obj.y + dy);
      if (hasMovement(obj)) {
        const delta = movementAxis(obj) === "y" ? dy : dx;
        obj.movingMin = round(Number(obj.movingMin) + delta);
        obj.movingMax = round(Number(obj.movingMax) + delta);
      }
      syncObjectInternals(obj);
    });
    saveLocal();
    render();
  }

  function showContextMenu(e, obj) {
    e.preventDefault();
    if (obj?.id && !hasSelection(obj.id)) setSelection([obj.id], obj.id);
    else if (obj?.id) state.selectedId = obj.id;
    setTool("select");
    render();
    const menu = els.contextMenu;
    menu.classList.remove("hidden");
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 210)}px`;
    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 250)}px`;
    menu.querySelector('[data-action="paste"]').disabled = !state.clipboard;
    menu.querySelector('[data-action="variant"]').disabled = state.selectedIds.length !== 1 || !canCycleVariant(selectedObject());
    menu.querySelector('[data-action="pair-door"]').disabled = state.selectedIds.length !== 1 || !isDoorType(selectedObject()?.type);
  }

  function hideContextMenu() {
    els.contextMenu.classList.add("hidden");
  }

  function handleContextAction(action) {
    hideContextMenu();
    if (action === "copy") copySelected();
    else if (action === "paste") pasteClipboard();
    else if (action === "duplicate") duplicateSelected();
    else if (action === "variant") cycleSelectedVariant();
    else if (action === "lock") toggleSelectedLock();
    else if (action === "bring-front") bringSelectedFront();
    else if (action === "send-back") sendSelectedBack();
    else if (action === "pair-door") createDoorPair();
    else if (action === "delete") deleteSelected();
  }

  function setSelectedProps(patch) {
    const obj = selectedObject();
    if (!obj) return;
    Object.assign(obj, patch);
    if (isDoorType(obj.type) && Object.prototype.hasOwnProperty.call(patch, "text")) obj.doorId = patch.text;
    syncObjectInternals(obj);
    ensurePositiveRect(obj);
    saveLocal();
    render();
  }

  function setSelectedMovingProp(key, value) {
    const obj = selectedObject();
    if (!obj || !canMoveType(obj.type)) return;
    if (!isMovingType(obj.type)) obj.movingEnabled = true;
    obj[key] = Number(value);
    if (!Number.isFinite(obj[key])) obj[key] = key === "movingSpeed" ? 80 : movementCoord(obj);
    if (key === "movingMin") setMovementCoord(obj, obj[key]);
    if (Number(obj.movingMax) < Number(obj.movingMin)) {
      const oldMin = Number(obj.movingMin);
      obj.movingMin = Number(obj.movingMax);
      obj.movingMax = oldMin;
      setMovementCoord(obj, obj.movingMin);
    }
    syncObjectInternals(obj);
    saveLocal();
    render();
  }

  function setSelectedMovementAxis(axis) {
    const obj = selectedObject();
    if (!obj || !canMoveType(obj.type) || isMovingType(obj.type)) return;
    pushHistory();
    obj.movingEnabled = true;
    obj.movingAxis = axis === "y" ? "y" : "x";
    const start = movementCoord(obj, obj.movingAxis);
    obj.movingMin = round(start);
    obj.movingMax = round(start + 160);
    obj.movingSpeed = Number.isFinite(Number(obj.movingSpeed)) && Number(obj.movingSpeed) !== 0 ? Number(obj.movingSpeed) : 80;
    syncObjectInternals(obj);
    saveLocal();
    render();
  }

  function setSelectedToggleInverted(startsInvisible) {
    const obj = selectedObject();
    if (!obj || obj.type !== "toggle-platform") return;
    pushHistory();
    setTogglePlatformText(obj, toggleIntervalValue(obj), startsInvisible);
    syncObjectInternals(obj);
    saveLocal();
    render();
  }

  function bindInspector() {
    els.propType.addEventListener("change", () => {
      const obj = selectedObject();
      if (!obj) return;
      pushHistory();
      const type = els.propType.value;
      const meta = typeMeta[type] || fallbackMeta;
      const wasMoving = hasMovement(obj);
      obj.type = type;
      obj.name = autoName(type);
      obj.fill = meta.fill;
      obj.stroke = meta.stroke;
      obj.text = defaultTextFor(type, obj.x);
      if (!isMovingType(type)) obj.movingEnabled = canMoveType(type) && wasMoving;
      syncObjectInternals(obj, false);
      saveLocal();
      render();
    });

    const bind = (input, key, parse = (v) => v) => {
      input.addEventListener("change", () => {
        pushHistory();
        setSelectedProps({ [key]: parse(input.value) });
      });
      input.addEventListener("input", () => {
        const obj = selectedObject();
        if (!obj) return;
        obj[key] = parse(input.value);
        if (isDoorType(obj.type) && key === "text") obj.doorId = obj.text;
        syncObjectInternals(obj);
        ensurePositiveRect(obj);
        renderObjects();
        renderOverlay();
        renderLayers();
        renderStats();
      });
    };

    bind(els.propName, "name");
    bind(els.propX, "x", Number);
    bind(els.propY, "y", Number);
    bind(els.propW, "w", Number);
    bind(els.propH, "h", Number);
    bind(els.propText, "text");
    bind(els.propFill, "fill");
    bind(els.propStroke, "stroke");
    const bindMoving = (input, key) => {
      input.addEventListener("change", () => {
        pushHistory();
        setSelectedMovingProp(key, input.value);
      });
      input.addEventListener("input", () => {
        const obj = selectedObject();
        if (!obj || !canMoveType(obj.type) || !hasMovement(obj)) return;
        obj[key] = Number(input.value);
        if (key === "movingMin" && Number.isFinite(obj[key])) setMovementCoord(obj, obj[key]);
        syncObjectInternals(obj);
        renderObjects();
        renderOverlay();
        renderInspector();
        renderLayers();
      });
    };
    if (els.moveEnabled) {
      els.moveEnabled.addEventListener("change", () => {
        const obj = selectedObject();
        if (!obj || isMovingType(obj.type) || !canMoveType(obj.type)) return;
        pushHistory();
        obj.movingEnabled = els.moveEnabled.checked;
        if (obj.movingEnabled) {
          const data = movingData(obj) || parseMovingSuffix(obj.name, obj.x, obj.y) || parseMovingText("", obj.x, obj.y, movementAxis(obj));
          obj.movingAxis = data.axis || movementAxis(obj);
          obj.movingMin = data.min;
          obj.movingMax = data.max <= data.min ? data.min + 160 : data.max;
          obj.movingSpeed = data.speed === 0 ? 80 : data.speed;
        }
        syncObjectInternals(obj);
        saveLocal();
        render();
      });
    }
    bindMoving(els.moveMin, "movingMin");
    bindMoving(els.moveMax, "movingMax");
    bindMoving(els.moveSpeed, "movingSpeed");
    if (els.moveAxis) {
      els.moveAxis.addEventListener("change", () => setSelectedMovementAxis(els.moveAxis.value));
    }
    if (els.toggleInverted) {
      els.toggleInverted.addEventListener("change", () => setSelectedToggleInverted(els.toggleInverted.checked));
    }
    els.propLocked.addEventListener("change", () => {
      pushHistory();
      setSelectedProps({ locked: els.propLocked.checked });
    });
    els.propHidden.addEventListener("change", () => {
      pushHistory();
      setSelectedProps({ hidden: els.propHidden.checked });
    });
  }

  function bindUi() {
    els.toolGrid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tool]");
      if (btn) setTool(btn.dataset.tool);
    });
    document.getElementById("fitBtn").addEventListener("click", () => fitView());
    els.saveBtn.addEventListener("click", () => {
      saveLocal();
      showToast("Salvo localmente");
    });
    els.exportBtn.addEventListener("click", exportActiveLevel);
    els.exportAllBtn.addEventListener("click", exportAllLevels);
    els.closeExportBtn.addEventListener("click", () => els.exportPanel.classList.add("hidden"));
    els.copyExportBtn.addEventListener("click", copyExportText);
    els.downloadExportBtn.addEventListener("click", downloadLastExport);
    els.variantBtn.addEventListener("click", cycleSelectedVariant);
    els.pairBtn.addEventListener("click", createDoorPair);
    els.normalizeBtn.addEventListener("click", normalizeSelectedObject);
    document.getElementById("newLevelBtn").addEventListener("click", newLevel);
    document.getElementById("useExampleBtn").addEventListener("click", useExampleAsBase);
    els.addTabBtn.addEventListener("click", newLevel);
    els.removeTabBtn.addEventListener("click", deleteActiveTab);
    els.toggleTabsBtn.addEventListener("click", () => {
      state.tabsCollapsed = !state.tabsCollapsed;
      render();
    });
    els.toggleRightBtn.addEventListener("click", () => {
      state.rightHidden = !state.rightHidden;
      render();
    });
    document.getElementById("undoBtn").addEventListener("click", undo);
    document.getElementById("redoBtn").addEventListener("click", redo);
    document.getElementById("duplicateBtn").addEventListener("click", duplicateSelected);
    document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

    els.gridToggle.addEventListener("change", () => {
      state.grid = els.gridToggle.checked;
      render();
    });
    els.snapToggle.addEventListener("change", () => {
      state.snap = els.snapToggle.checked;
      render();
    });
    els.gridSize.addEventListener("input", () => {
      state.gridSize = Number(els.gridSize.value);
      render();
    });

    els.stage.addEventListener("pointerdown", onStagePointerDown);
    els.stage.addEventListener("pointermove", onStagePointerMove);
    els.stage.addEventListener("pointerup", onStagePointerUp);
    els.stage.addEventListener("pointercancel", onStagePointerUp);
    els.stage.addEventListener("wheel", zoomAt, { passive: false });
    els.stage.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      hideContextMenu();
    });

    els.contextMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn || btn.disabled) return;
      handleContextAction(btn.dataset.action);
    });
    window.addEventListener("pointerdown", (e) => {
      if (!e.target.closest("#contextMenu")) hideContextMenu();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") state.spaceDown = true;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(objects().filter((obj) => !obj.locked).map((obj) => obj.id));
        render();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        render();
      } else if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        cycleSelectedVariant();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") nudgeSelected(-step, 0);
        if (e.key === "ArrowRight") nudgeSelected(step, 0);
        if (e.key === "ArrowUp") nudgeSelected(0, -step);
        if (e.key === "ArrowDown") nudgeSelected(0, step);
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") state.spaceDown = false;
    });
  }

  function init() {
    loadTabs();
    bindUi();
    bindInspector();
    setTool("select");
    render();
  }

  init();
})();
