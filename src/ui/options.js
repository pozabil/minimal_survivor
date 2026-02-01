import { loadOptions, saveOptions } from "../systems/storage.js";

export function bindOptionsUI({ optShowDamageNumbers, optShowProfiler, onOptionsChange }){
  const options = loadOptions();

  function emitChange(){
    if (onOptionsChange) onOptionsChange(options);
  }

  function applyOptionsToUI(){
    optShowDamageNumbers.checked = !!options.showDamageNumbers;
    optShowProfiler.checked = !!options.showProfiler;
    emitChange();
  }

  optShowDamageNumbers.addEventListener("change", (e)=>{
    options.showDamageNumbers = e.target.checked;
    saveOptions(options);
    emitChange();
  });

  optShowProfiler.addEventListener("change", (e)=>{
    options.showProfiler = e.target.checked;
    saveOptions(options);
    emitChange();
  });

  applyOptionsToUI();
  return { options, applyOptionsToUI };
}
