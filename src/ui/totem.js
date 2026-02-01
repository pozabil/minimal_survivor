export function createTotemTimerUI({ elements }) {
  const { totemTimerEl } = elements;
  const totemTimerText = document.createTextNode("0");
  const totemTimerSub = document.createElement("span");
  totemTimerSub.className = "sub";
  totemTimerSub.textContent = "Идите в зону тотема";
  totemTimerEl.replaceChildren(totemTimerText, totemTimerSub);

  function updateTotemTimer(totem){
    if (totem.active && totem.grace > 0){
      totemTimerEl.style.display = "block";
      const nextText = String(Math.max(0, Math.ceil(totem.grace)));
      if (totemTimerText.nodeValue !== nextText) totemTimerText.nodeValue = nextText;
    } else {
      totemTimerEl.style.display = "none";
    }
  }

  return updateTotemTimer;
}

export function createTotemWarningUI({ elements }) {
  const { totemWarningEl } = elements;
  function updateTotemWarning(totem){
    const showWarning = totem.active && totem.grace <= 0 && !totem.inZone;
    totemWarningEl.classList.toggle("show", showWarning);
  }

  return updateTotemWarning;
}
