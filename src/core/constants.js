export const TAU = Math.PI * 2;

export const GRID_SIZE = 140;

export const JOY_SIZE = 160;
export const JOY_HALF = JOY_SIZE / 2;
export const JOY_MARGIN = 10;

export const STORAGE_NS = {
  options: "options.",
  records: "records.",
};

export const OPTION_KEYS = {
  showDamageNumbers: "showDamageNumbers",
  showProfiler: "showProfiler",
};
export const RECORD_KEYS = { level: "maxlevel", time: "maxtime", kills: "maxkills", dps: "maxdps" };

export const HUD_UPDATE_TIME_MS = 1000 / 15;
export const HUD_UPDATE_TIME = HUD_UPDATE_TIME_MS / 1000;
