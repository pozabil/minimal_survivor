import { loadOptions, saveOptions } from "../systems/storage.js";

export function bindOptionsUI({ optShowDamageNumbers }){
  const options = loadOptions();

  function applyOptionsToUI(){
    if (optShowDamageNumbers) optShowDamageNumbers.checked = !!options.showDamageNumbers;
  }

  if (optShowDamageNumbers){
    optShowDamageNumbers.addEventListener("change", (e)=>{
      options.showDamageNumbers = e.target.checked;
      saveOptions(options);
    });
  }

  applyOptionsToUI();
  return { options, applyOptionsToUI };
}
