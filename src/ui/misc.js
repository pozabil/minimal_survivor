import { fmtTime } from "../utils/format.js";

function copyStatsToClipboard(player, state) {
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

export function bindMiscUI({ overlays, player, state }) {
  const { btnCopy, copyBtn } = overlays;
  const onCopy = () => copyStatsToClipboard(player, state);
  btnCopy.addEventListener("click", onCopy);
  copyBtn.addEventListener("click", onCopy);
}
