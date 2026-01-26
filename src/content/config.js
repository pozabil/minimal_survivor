export const ENEMY_MAX_R = 60;
export const COLOSSUS_HP_STEP = 0.20;
export const COLOSSUS_SHRINK_STEP = 0.10;
export const COLOSSUS_SPAWN_STAGES = 4;
export const BURST_TELEGRAPH = 0.25;
export const HEAL_OVER_TIME = 0.25;
export const CAMERA_ZOOM_OUT = 0.05;
export const TURRET_SPAWN_RADIUS = 280;
export const TURRET_MIN_DIST = 120;
export const ORBITAL_BASE_DISTANCE = 48;
export const ORBITAL_BASE_SIZE = 7.5;
export const ORBITAL_SIZE_EXP = 0.85;
export const ORBITAL_KNOCKBACK_CHANCE = 0.12;
export const ORBITAL_KNOCKBACK_FORCE = 120;
export const AURA_WAVE_COOLDOWN_BASE = 2.6;
export const AURA_WAVE_COOLDOWN_STEP = 0.1;
export const AURA_WAVE_BASE_FORCE = 60;
export const AURA_WAVE_FORCE_STEP = 10;
export const AURA_WAVE_BOSS_MULT = 0.0;
export const AURA_WAVE_ELITE_MULT = 0.25;
export const AURA_WAVE_HIT_COOLDOWN = 0.05;
export const AURA_WAVE_POS_MULT = 0.05;
export const AURA_WAVE_VEL_MULT = 4;
export const AURA_WAVE_TRAVEL_TIME = 0.42;
export const AURA_WAVE_THICKNESS = 18;
export const AURA_TICKS_PER_SEC = 5;
export const AURA_TICK_INTERVAL = 1 / AURA_TICKS_PER_SEC;
export const UNIQUE_CHEST_EVERY = 4;
export const DASH_DISTANCE = 140;
export const DASH_DURATION = 0.2;
export const DASH_COOLDOWN = 2;
export const DASH_INVULN = 0.35;
export const DASH_TRAIL_LIFE = 0.24;
export const DASH_TRAIL_INTERVAL = 0.01;
export const DASH_TRAIL_MAX = 36;
export const SAME_CIRCLE_INTERVAL = 6;
export const SAME_CIRCLE_LIFE = 2;
export const SAME_CIRCLE_RADIUS = 120;
export const SAME_CIRCLE_DAMAGE_MULT = 2.5;
export const MAX_SHIRT_SLOW_DURATION = 2.4;
export const MAX_SHIRT_COOLDOWN = 30;
export const MAX_SHIRT_SLOW_SCALE = 0.5;
export const MAX_SHIRT_KILL_CD_REDUCE = 0.2;
export const PATRIARCH_DOLL_COOLDOWN = 3;
export const PATRIARCH_DOLL_DAMAGE_MULT = 3;
export const PATRIARCH_DOLL_TARGETS_MIN = 8;
export const PATRIARCH_DOLL_TARGETS_MAX = 16;
export const LIGHTNING_STRIKE_LIFE = 0.22;
export const LIGHTNING_STRIKE_SEGMENTS_MIN = 4;
export const LIGHTNING_STRIKE_SEGMENTS_MAX = 6;
export const LIGHTNING_STRIKE_JITTER = 18;
export const LIGHTNING_STRIKE_HEIGHT_MIN = 180;
export const LIGHTNING_STRIKE_HEIGHT_MAX = 320;
export const DOG_RADIUS = 8.5;
export const DOG_SPEED = 290;
export const DOG_TURN_RATE = 4.5;
export const DOG_HIT_COOLDOWN = 0.18;
export const DOG_CRIT_CHANCE = 0.22;
export const DOG_BALTIKA_AVOID_R = 96;
export const DOG_BROWN_COLORS = ["rgba(130,85,55,0.95)", "rgba(150,95,60,0.95)", "rgba(110,70,45,0.95)"];
export const DOG_GRAY_COLOR = "rgba(150,150,155,0.95)";
export const DOG_GRAY_CHANCE = 0.12;
export const XP_BONUS_NORMAL = 0.0005;
export const XP_BONUS_ELITE = 0.002;
export const XP_BONUS_BOSS = 0.01;
export const TURRET_AGGRO_BASE = 220;
export const TURRET_RANGE = 520;
export const TURRET_FIRE_RATE = 1.8;
export const TURRET_DAMAGE = 10;
export const TURRET_BULLET_SPEED = 420;
export const TURRET_BULLET_SIZE = 4;
export const PIERCE_DAMAGE_FALLOFF = 0.8;
export const PIERCE_DAMAGE_MIN_RATIO = 0.2;
export const TURRET_SIZE_MULT = 1.20;
export const TURRET_SIZE_LV_BONUS = 0.04;
export const INVULN_LV_STEP = 4;
export const INVULN_STEP = 0.01;
export const INVULN_BULLET_BASE = 0.35;
export const INVULN_BULLET_MIN = 0.05;
export const INVULN_CONTACT_BASE = 0.4;
export const INVULN_CONTACT_MIN = 0.1;
export const TANK_INVULN_BONUS_CAP = 0.15;
export const TOTEM_SPAWN_EVERY = 75;
export const TOTEM_SPAWN_MIN_INTERVAL = 50;
export const TOTEM_SPAWN_LV_STEP = 10;
export const TOTEM_SPAWN_STEP = 5;
export const TOTEM_SPAWN_FIRST = 45;
export const TOTEM_LIFE_BASE = 25;
export const TOTEM_LIFE_STEP = 1;
export const TOTEM_LIFE_LV_STEP = 10;
export const TOTEM_LIFE_CAP = 40;
export const TOTEM_GRACE = 5;
export const TOTEM_SPAWN_MIN = 640;
export const TOTEM_SPAWN_MAX = 960;
export const TOTEM_RADIUS_MIN = 420;
export const TOTEM_RADIUS_MAX = 600;
export const TOTEM_EFFECT_GAIN_BASE = 1.0;
export const TOTEM_EFFECT_GAIN_STEP = 1.0;
export const TOTEM_EFFECT_GAIN_LV_STEP = 10;
export const TOTEM_EFFECT_GAIN_CAP = 10;
export const TOTEM_EFFECT_DECAY = 0.8;
export const TOTEM_DPS_BASE = 1;
export const TOTEM_DPS_RAMP_BASE = 2;
export const TOTEM_DPS_RAMP_GROWTH = 1.08;
export const TOTEM_DPS_RAMP_LV_STEP = 4;
export const TOTEM_DPS_RAMP_CAP = 5;
export const TOTEM_EFFECT_MAX = 90;
export const LOW_HP_SLOW_THRESHOLD = 0.08;
export const LOW_HP_SLOW_RESET = 0.12;
export const LOW_HP_SLOW_DURATION = 4.0;
export const LOW_HP_SLOW_SCALE = 0.5;
export const LOW_HP_SLOW_COOLDOWN = 16.0;

export const BASE_HP = 50;

export const ELITE_MODS = [
  { id:"swift",   hp:1.35, spd:1.38, dmg:1.15, color:"rgba(120,255,220,0.9)" },
  { id:"bruiser", hp:2.05, spd:0.90, dmg:1.25, color:"rgba(255,140,140,0.95)" },
  { id:"rage",    hp:1.45, spd:1.12, dmg:1.52, color:"rgba(210,160,255,0.95)" },
];
export const ELITE_RADIUS_MULT = 1.16;
export const ELITE_XP_REWARD_MULT = 1.6;
export const ELITE_XP_BASE_MULT = 1.2;

export const BOSS_KINDS = [
  { id:"beholder", name:"Beholder",   unlock:0 },
  { id:"charger",  name:"Charger",    unlock:1 },
  { id:"sniper",   name:"Sniper",     unlock:2 },
  { id:"spiral",   name:"Spiral Eye", unlock:3 },
  { id:"summoner", name:"Summoner",   unlock:4 },

  { id:"mortar",   name:"Mortar",     unlock:5 },
  { id:"warden",   name:"Warden",     unlock:6 },
  { id:"vortex",   name:"Vortex",     unlock:7 },
  { id:"colossus", name:"Colossus",   unlock:8 },
];
export const BOSS_NAME = Object.fromEntries(BOSS_KINDS.map((b)=>[b.id, b.name]));
