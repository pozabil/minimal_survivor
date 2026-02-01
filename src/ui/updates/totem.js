export function createTotemTimerUI({ elements }) {
  const { elTotemTimer } = elements;
  const totemTimerText = document.createTextNode("0");
  const totemTimerSub = document.createElement("span");
  totemTimerSub.className = "sub";
  totemTimerSub.textContent = "Идите в зону тотема";
  elTotemTimer.replaceChildren(totemTimerText, totemTimerSub);

  function updateTotemTimer(totem){
    if (totem.active && totem.grace > 0){
      elTotemTimer.style.display = "block";
      const nextText = String(Math.max(0, Math.ceil(totem.grace)));
      if (totemTimerText.nodeValue !== nextText) totemTimerText.nodeValue = nextText;
    } else {
      elTotemTimer.style.display = "none";
    }
  }

  return updateTotemTimer;
}

export function createTotemWarningUI({ elements }) {
  const { elTotemWarning } = elements;
  function updateTotemWarning(totem){
    const showWarning = totem.active && totem.grace <= 0 && !totem.inZone;
    elTotemWarning.classList.toggle("show", showWarning);
  }

  return updateTotemWarning;
}
