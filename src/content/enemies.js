export const ENEMY_BASE = {
  grunt:    { r:14, hp:45,  spd:120, dmg:10, xp:10 },
  runner:   { r:12, hp:32,  spd:195, dmg:12, xp:11 },
  tank:     { r:18, hp:120, spd:80,  dmg:16, xp:18 },
  shooter:  { r:13, hp:55,  spd:105, dmg:9,  xp:14, shotRate:0.9, shotSpeed:260, shotDmg:10 },
  bomber:   { r:14, hp:58,  spd:135, dmg:0,  xp:16, explodeR:70, explodeDmg:28 },

  brute:    { r:20, hp:180, spd:72,  dmg:22, xp:26 }, // медленный "мясной" удар
  spitter:  { r:13, hp:62,  spd:98,  dmg:8,  xp:16, shotRate:1.05, shotSpeed:250, shotDmg:9 }, // тройной залп
  dasher:   { r:13, hp:44,  spd:150, dmg:14, xp:14 }, // рывки к игроку
  shield:   { r:16, hp:95,  spd:110, dmg:13, xp:18 }, // снижает урон от пуль
  triad:    { r:15, hp:70,  spd:112, dmg:14, xp:20, triRad:24, triSpin:4.6, triShotRate:0.85, triShotSpeed:280, triShotDmg:9 }, // вращающийся треугольник + залп
  blaster:  { r:14, hp:78,  spd:106, dmg:12, xp:22, shotRate:1.0, shotSpeed:300, shotDmg:12, shotSize:5, shotLife:3.0, explodeR:44, explodePush:18, burstGap:0.12, burstCooldown:2.4, bulletColor:"rgba(255,235,120,0.98)", bulletGlow:"rgba(255,230,140,0.95)" }, // желтые взрывные снаряды очередями
  burst:    { r:14, hp:60,  spd:112, dmg:11, xp:17, burstN:6, burstSpeed:270, burstDmg:9 }, // при смерти выпускает пули
  splitter: { r:15, hp:78,  spd:118, dmg:12, xp:18 }, // при смерти делится на миньонов
  minion:   { r:10, hp:26,  spd:170, dmg:9,  xp:6  }, // спавнится от splitter

  boss:     { r:30, hp:1800,spd:85,  dmg:26, xp:180, shotRate:0.45, shotSpeed:320, shotDmg:14 },
};

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
