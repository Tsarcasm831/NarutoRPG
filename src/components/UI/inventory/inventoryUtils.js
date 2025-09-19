export const computeInventoryStats = (inventory) => {
  const initialStats = {
    totalWeight: 0,
    totalValue: 0,
    averageCondition: null,
    conditionPercentage: null
  };

  if (!inventory || typeof inventory !== "object") {
    return initialStats;
  }

  let totalWeight = 0;
  let totalValue = 0;
  let conditionSum = 0;
  let conditionCount = 0;

  const extractNumeric = (...values) => {
    for (const value of values) {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
      }
    }
    return 0;
  };

  const addItemStats = (item) => {
    if (!item) return;

    const quantity = typeof item.count === "number" && item.count > 0 ? item.count : 1;
    const itemWeight = extractNumeric(item.weight, item.stats?.weight);
    const itemValue = extractNumeric(item.value, item.stats?.value, item.cost, item.price);

    if (itemWeight > 0) {
      totalWeight += itemWeight * quantity;
    }

    if (itemValue > 0) {
      totalValue += itemValue * quantity;
    }

    if (item.durability && typeof item.durability.current === "number" && typeof item.durability.max === "number" && item.durability.max > 0) {
      conditionSum += item.durability.current / item.durability.max;
      conditionCount += 1;
    }
  };

  const possibleCollections = [
    inventory.equipment && Object.values(inventory.equipment),
    Array.isArray(inventory.potions) ? inventory.potions : null,
    Array.isArray(inventory.storage) ? inventory.storage : null
  ];

  for (const collection of possibleCollections) {
    if (!collection) continue;
    for (const item of collection) {
      addItemStats(item);
    }
  }

  const averageCondition = conditionCount > 0 ? conditionSum / conditionCount : null;

  return {
    totalWeight,
    totalValue,
    averageCondition,
    conditionPercentage: averageCondition !== null ? Math.round(averageCondition * 100) : null
  };
};
