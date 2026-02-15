import { clamp } from "../utils/math.js";

export const SAME_CIRCLE_INTERVAL = 6;
export const SAME_CIRCLE_LIFE = 2;
export const SAME_CIRCLE_RADIUS = 120;
export const SAME_CIRCLE_DAMAGE_MULT = 2.5;

export const DASH_DISTANCE = 140;
export const DASH_DURATION = 0.2;
export const DASH_COOLDOWN = 2;
export const DASH_INVULN = 0.35;
export const DASH_TRAIL_INTERVAL = 0.01;
export const DASH_TRAIL_LIFE = 0.24;
export const DASH_TRAIL_MAX = 36;
export const MAX_SHIRT_SLOW_DURATION = 2.4;
export const MAX_SHIRT_COOLDOWN = 30;
export const MAX_SHIRT_SLOW_SCALE = 0.5;
export const MAX_SHIRT_KILL_CD_REDUCE = 0.2;
export const LIGHTNING_STRIKE_LIFE = 0.22;
export const LIGHTNING_STRIKE_SEGMENTS_MIN = 4;
export const LIGHTNING_STRIKE_SEGMENTS_MAX = 6;
export const LIGHTNING_STRIKE_JITTER = 18;
export const LIGHTNING_STRIKE_HEIGHT_MIN = 180;
export const LIGHTNING_STRIKE_HEIGHT_MAX = 320;
export const PATRIARCH_DOLL_COOLDOWN = 3;
export const PATRIARCH_DOLL_DAMAGE_MULT = 3;
export const PATRIARCH_DOLL_TARGETS_MIN = 8;
export const PATRIARCH_DOLL_TARGETS_MAX = 16;
export const ORBITAL_SPIRAL_MIN_RADIUS_RATIO = 0.6;
export const ORBITAL_SPIRAL_MAX_RADIUS_RATIO = 2.4;
export const ORBITAL_SPIRAL_PHASE_SPEED_BASE = 1.5 * Math.PI;
export const ORBITAL_SPIRAL_PHASE_SPEED_MIN = 0.5 * Math.PI;
export const ORBITAL_SPEED_UP_MAX_LEVEL = 6;

export function createUniques({ player, state, totem, spawnDog }) {
  return {
    spare_tire: {
      title:"Запасное колесо",
      rarity:"epic",
      desc:"Позволяет получить смертельный урон и выжить. Одноразовый предмет.",
      apply(){},
    },
    same_circle: {
      title:"They're the Same Circle",
      rarity:"epic",
      desc:"Периодически оставляет бессмертную копию на некоторое время, которая затем взрывается.",
      apply(){ state.sameCircleCd = SAME_CIRCLE_INTERVAL; },
    },
    british_citizenship: {
      title:"Британское гражданство",
      rarity:"rare",
      action:true,
      desc:"Дает рывок с неуязвимостью. Активируется кнопкой действия.",
      apply(){},
    },
    crutch: {
      title:"Костыль",
      rarity:"rare",
      desc:"Вы и так знаете что это. +55 к скорости передвижения, +25% к сорости атаки.",
      apply(){
        player.flatSpeed += 55;
        player.fireRate *= 1.25;
      },
    },
    rope: {
      title:"Веревка",
      rarity:"common",
      desc:"Колобок повесился.",
      apply(){},
    },
    phenibut: {
      title:"Пачка фенибута",
      rarity:"common",
      desc:"Вы думаете что вы стали умнее. Для получения уровня требуется на 5% меньше опыта.",
      apply(){ player.xpNeedMult *= 0.95; },
    },
    max_shirt: {
      title:"Рубашка Больного Макса",
      rarity:"rare",
      action:true,
      desc:"Замедляет время на 3 сек. КД 30 сек, заряжается убийствами. Активируется кнопкой действия.",
      apply(){},
    },
    patriarch_doll: {
      title:"Куколь патриарха",
      rarity:"rare",
      desc:"Если ты есть Бог, помоги, отец мой небесный, я заколебался.",
      apply(){},
    },
    baltika9: {
      title:"Балтика-9",
      rarity:"common",
      desc:"Вкус терпкий, да и эффект так себе. Немного снижает скорость бега и атаки, увеличивает броню и урон при ранениях.",
      apply(){
        player.speed *= 0.95;
        if (player.baseSpeed) player.baseSpeed *= 0.95;
        player.fireRate *= 0.95;
        player.armor = clamp((player.armor || 0) + 0.08, 0, 0.60);
      },
    },
    cheap_bullets: {
      title:"Дешевые пули",
      rarity:"common",
      desc:"Вместо рикошета эти дешевые пули разлетаются на две части.",
      apply(){},
    },
    dog: {
      title:"Питомец",
      rarity:"common",
      desc:"Питомец лучший друг круга.",
      apply(){ spawnDog(); },
    },
    rf_passport: {
      title:"Паспорт РФ",
      rarity:"common",
      desc:"Жизнь научила терпеть. Вы получаете на 10% меньше урона.",
      apply(){ player.damageTakenMult *= 0.9; },
    },
    nose_ring: {
      title:"Кольцо в носу",
      rarity:"common",
      desc:"Кольцо - это антенна. Вы издалека начинаете чувствовать силу тотема. Увеличивает раздиус тотема на 8%",
      apply(){
        if (totem.active) totem.r *= 1.08;
      },
    },
    peace_pipe: {
      title:"Трубка мира",
      rarity:"common",
      desc:"Духи древних сопровождают вас, вы чувствуете себя лучше. Немного увеличивает регенирацию и скорость передвижения в зоне тотема.",
      apply(){},
    },
    trigonometric_gloves: {
      title:"Тригонометрические перчатки",
      rarity:"common",
      desc:"Орбиталки двигаются по спирали.",
      apply(){},
    },
  };
}
