import { fmtTime } from "../utils/format.js";

export function copyStatsToClipboard(player, state) {
  const text =
`Survivor stats
Hero: ${player.heroName}
Time: ${fmtTime(state.t)}
Level: ${player.lvl}
Kills: ${state.kills}
Damage: ${Math.round(state.dmgDone)}
Rerolls: ${player.rerolls}
Upgrades: ${Object.keys(player.upgrades).map((k) => `${k}:${player.upgrades[k]}`).join(", ")}
`;
  navigator.clipboard?.writeText(text).catch(()=>{});
}
