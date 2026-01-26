import { BASE_HP } from "./config.js";

export const PLAYER_CLASSES = [
  {
    id: "scout",
    name: "Скаут",
    desc: "Скорость + магнит. Сундуки сильнее.",
    perk: "Перки: сундук даёт +1 reroll (до лимита) и чаще выпадает rare.",
    dogStartChance: 0.10,
    apply(player){
      player.heroId = "scout";
      player.heroName = "Скаут";
      player.heroPerkText = this.perk;
      player.speed = 295;
      player.baseSpeed = 295;
      player.magnet = 150;
      player.hpMax = BASE_HP * 0.9;
      player.hp = player.hpMax;
      player.fireRate = 4.6;
      player.damage = 15;
      player.baseDamage = 15;

      player.xpGainMult = 1.0;
      player.chestBonusReroll = 1;
      player.chestBonusRare = 0.10;
    },
  },
  {
    id: "tank",
    name: "Танк",
    desc: "HP + реген. Доп. неуязвимость после урона.",
    perk: "Перки: после попадания неуязвимость x1.3 (макс +0.15с).",
    dogStartChance: 0.06,
    apply(player){
      player.heroId = "tank";
      player.heroName = "Танк";
      player.heroPerkText = this.perk;
      player.hpMax = BASE_HP * 1.4;
      player.hp = player.hpMax;
      player.regen = 0.8;
      player.speed = 240;
      player.baseSpeed = 240;
      player.damage = 16;
      player.baseDamage = 16;
      player.fireRate = 4.1;

      player.xpGainMult = 1.0;
      player.chestBonusReroll = 0;
      player.chestBonusRare = 0.0;
    },
  },
  {
    id: "mage",
    name: "Маг",
    desc: "Стартовая орбиталка + урон. Больше XP.",
    perk: "Перки: +10% XP, орбиталки быстрее на 20%.",
    dogStartChance: 0.08,
    apply(player){
      player.heroId = "mage";
      player.heroName = "Маг";
      player.heroPerkText = this.perk;
      player.orbitals = 1;
      player.orbitalDamage = 12;
      player.damage = 18;
      player.baseDamage = 18;
      player.fireRate = 4.0;
      player.hpMax = BASE_HP * 1.0;
      player.hp = player.hpMax;
      player.speed = 255;
      player.baseSpeed = 255;

      player.xpGainMult = 1.10;
      player.orbitalSpeed = 2.4 * 1.20;
      player.chestBonusReroll = 0;
      player.chestBonusRare = 0.0;
    },
  },
];

export function getPlayerClass(id){
  return PLAYER_CLASSES.find((c)=>c.id === id) || null;
}
