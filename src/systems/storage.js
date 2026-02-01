import { OPTION_KEYS, RECORD_KEYS, STORAGE_NS } from "../core/constants.js";

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

function readRecord(key){
  try {
    const nsKey = STORAGE_NS.records + key;
    let raw = localStorage.getItem(nsKey);
    if (raw === null) raw = localStorage.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeRecord(key, value){
  try {
    localStorage.setItem(STORAGE_NS.records + key, String(value));
  } catch {}
}

export function loadRecords(){
  return {
    level: readRecord(RECORD_KEYS.level),
    time: readRecord(RECORD_KEYS.time),
    kills: readRecord(RECORD_KEYS.kills),
    dps: readRecord(RECORD_KEYS.dps),
  };
}

function saveRecords(records){
  writeRecord(RECORD_KEYS.level, records.level);
  writeRecord(RECORD_KEYS.time, records.time);
  writeRecord(RECORD_KEYS.kills, records.kills);
  writeRecord(RECORD_KEYS.dps, records.dps);
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
