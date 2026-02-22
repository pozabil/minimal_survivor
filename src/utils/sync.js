function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Set)
  );
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value instanceof Set) return new Set(Array.from(value, cloneValue));
  if (isPlainObject(value)) {
    const next = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = cloneValue(nested);
    }
    return next;
  }
  return value;
}

function syncArray(target, source) {
  target.length = 0;
  for (const item of source) target.push(cloneValue(item));
}

function syncSet(target, source) {
  target.clear();
  for (const item of source) target.add(cloneValue(item));
}

function syncObject(target, source) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) delete target[key];
  }

  for (const [key, sourceValue] of Object.entries(source)) {
    const currentValue = target[key];

    if (Array.isArray(sourceValue)) {
      if (Array.isArray(currentValue)) syncArray(currentValue, sourceValue);
      else target[key] = cloneValue(sourceValue);
      continue;
    }

    if (sourceValue instanceof Set) {
      if (currentValue instanceof Set) syncSet(currentValue, sourceValue);
      else target[key] = cloneValue(sourceValue);
      continue;
    }

    if (isPlainObject(sourceValue)) {
      if (isPlainObject(currentValue)) syncObject(currentValue, sourceValue);
      else target[key] = cloneValue(sourceValue);
      continue;
    }

    target[key] = sourceValue;
  }
}

export {
  isPlainObject,
  cloneValue,
  syncArray,
  syncSet,
  syncObject,
};
