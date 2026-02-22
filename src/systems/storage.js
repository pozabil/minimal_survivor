import { OPTION_KEYS, PROGRESSION_KEYS, RECORD_KEYS, STORAGE_NS } from "../core/constants.js";

function readBoolKey(ns, key, fallback){
  try {
    const raw = localStorage.getItem(ns + key);
    if (raw === null) return fallback;
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return Boolean(Number(raw));
  } catch {
    return fallback;
  }
}

function writeBoolKey(ns, key, value){
  try { localStorage.setItem(ns + key, value ? "1" : "0"); } catch {}
}

function readJsonKey(ns, key, fallback){
  try {
    const raw = localStorage.getItem(ns + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonKey(ns, key, value){
  try {
    localStorage.setItem(ns + key, JSON.stringify(value));
  } catch {}
}

function readNumber(ns, key, fallback = 0){
  try {
    const nsKey = ns + key;
    let raw = localStorage.getItem(nsKey);
    if (raw === null) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(ns, key, value){
  try {
    localStorage.setItem(ns + key, String(value));
  } catch {}
}

// OPTIONS
export function loadOptions(){
  return {
    showDamageNumbers: readBoolKey(STORAGE_NS.options, OPTION_KEYS.showDamageNumbers, true),
    showProfiler: readBoolKey(STORAGE_NS.options, OPTION_KEYS.showProfiler, true),
  };
}

export function saveOptions(next){
  writeBoolKey(STORAGE_NS.options, OPTION_KEYS.showDamageNumbers, !!next.showDamageNumbers);
  writeBoolKey(STORAGE_NS.options, OPTION_KEYS.showProfiler, !!next.showProfiler);
}
// OPTIONS

// RECORDS
export function loadRecords(){
  return {
    level: readNumber(STORAGE_NS.records, RECORD_KEYS.level),
    time: readNumber(STORAGE_NS.records, RECORD_KEYS.time),
    kills: readNumber(STORAGE_NS.records, RECORD_KEYS.kills),
    dps: readNumber(STORAGE_NS.records, RECORD_KEYS.dps),
  };
}

function saveRecords(records){
  writeNumber(STORAGE_NS.records, RECORD_KEYS.level, records.level);
  writeNumber(STORAGE_NS.records, RECORD_KEYS.time, records.time);
  writeNumber(STORAGE_NS.records, RECORD_KEYS.kills, records.kills);
  writeNumber(STORAGE_NS.records, RECORD_KEYS.dps, records.dps);
}

export function updateRecordsOnDeath({ state, player }){
  const records = loadRecords();
  const next = { ...records };
  const time = Math.floor(state.t);
  if (player.lvl > next.level) next.level = player.lvl;
  if (time > next.time) next.time = time;
  if (state.kills > next.kills) next.kills = state.kills;
  if (state.maxDps > next.dps) next.dps = state.maxDps;
  saveRecords(next);
  return next;
}
// RECORDS

// PROGRESSION
function sanitizeCompletedLevels(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => typeof item === "string");
}

export function loadProgression() {
  const completedLevelsRaw = readJsonKey(STORAGE_NS.progression, PROGRESSION_KEYS.completedLevels, [] );
  return { completedLevels: sanitizeCompletedLevels(completedLevelsRaw) };
}

function saveProgression(next) {
  writeJsonKey(STORAGE_NS.progression, PROGRESSION_KEYS.completedLevels, sanitizeCompletedLevels(next.completedLevels));
}

export function markLevelCompleted(levelId) {
  if (!levelId) return loadProgression();
  const progress = loadProgression();
  if (progress.completedLevels.includes(levelId)) return progress;
  const next = {
    ...progress,
    completedLevels: [...progress.completedLevels, levelId],
  };
  saveProgression(next);
  return next;
}
// PROGRESSION
