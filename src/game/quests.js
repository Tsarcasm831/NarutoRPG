// Quest system primitives: quest data + reward application

// Reward helpers
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function firstEmptyStorageIndex(storage) {
  if (!Array.isArray(storage)) return -1;
  for (let i = 0; i < storage.length; i++) {
    if (storage[i] == null) return i;
  }
  return -1;
}

function addItemToStorage(inventoryIn, item) {
  const inventory = clone(inventoryIn);
  if (!inventory.storage) inventory.storage = [];
  let idx = firstEmptyStorageIndex(inventory.storage);
  if (idx === -1) {
    // No empty slot; append
    inventory.storage.push(item);
  } else {
    inventory.storage[idx] = item;
  }
  return inventory;
}

function applyEquipmentUpgrade(inventoryIn, upgrade) {
  // upgrade: { slot: 'weapon'|'helmet'|..., modifiers: { stats?: {..}, rarity?: string, nameSuffix?: string, durability?: { current?: number, max?: number } } }
  const inventory = clone(inventoryIn);
  const { slot, modifiers = {} } = upgrade || {};
  if (!slot || !inventory.equipment) return inventory;
  const existing = inventory.equipment[slot];
  if (!existing) {
    // If nothing equipped in that slot, create an upgraded generic item and place into storage
    const created = {
      name: `${(slot[0] || '').toUpperCase() + slot.slice(1)} Upgrade`,
      icon: '✨',
      slot,
      rarity: modifiers.rarity || 'uncommon',
      stats: { ...modifiers.stats },
      description: 'A crafted upgrade reward from a quest.',
      durability: { current: modifiers?.durability?.current ?? 100, max: modifiers?.durability?.max ?? 100 }
    };
    return addItemToStorage(inventory, created);
  }

  // Mutate copy
  const next = clone(existing);
  if (modifiers.rarity) next.rarity = modifiers.rarity;
  if (modifiers.nameSuffix) next.name = `${next.name} ${modifiers.nameSuffix}`;
  if (modifiers.stats) {
    next.stats = { ...(next.stats || {}) };
    for (const [k, v] of Object.entries(modifiers.stats)) {
      const base = Number(next.stats[k] || 0);
      next.stats[k] = base + Number(v || 0);
    }
  }
  if (modifiers.durability) {
    next.durability = { ...(next.durability || { current: 100, max: 100 }) };
    if (typeof modifiers.durability.max === 'number') {
      next.durability.max = Math.max(1, next.durability.max + modifiers.durability.max);
    }
    if (typeof modifiers.durability.current === 'number') {
      next.durability.current = Math.min(next.durability.max, Math.max(0, (next.durability.current || 0) + modifiers.durability.current));
    }
  }
  inventory.equipment[slot] = next;
  return inventory;
}

export function applyQuestRewards(rewards, { setPlayerStats, setInventory, addExperience }) {
  if (!Array.isArray(rewards)) return;
  if (typeof setPlayerStats !== 'function' || typeof setInventory !== 'function' || typeof addExperience !== 'function') {
    console.warn('applyQuestRewards: missing setters');
  }
  for (const r of rewards) {
    if (!r) continue;
    switch (r.type) {
      case 'xp': {
        const amt = Math.max(0, Math.floor(Number(r.amount) || 0));
        if (amt > 0) addExperience(amt);
        break;
      }
      case 'gold': {
        const amt = Math.max(0, Math.floor(Number(r.amount) || 0));
        if (amt > 0) setPlayerStats(prev => ({ ...prev, gold: Math.max(0, (prev.gold || 0) + amt) }));
        break;
      }
      case 'item': {
        if (!r.item || typeof r.item !== 'object') break;
        setInventory(prev => addItemToStorage(prev, r.item));
        break;
      }
      case 'upgrade': {
        if (!r.slot) break;
        setInventory(prev => applyEquipmentUpgrade(prev, { slot: r.slot, modifiers: r.modifiers || {} }));
        break;
      }
      default:
        console.warn('Unknown reward type:', r?.type);
    }
  }
}

// Sample quest seeds. Status lifecycle: 'available' -> 'active' -> 'completed' -> 'claimed'
export function createInitialQuests() {
  return [
    {
      id: 'd-help-ichiraku',
      title: 'D-Rank: Help at Ichiraku',
      description:
        'Run a quick delivery for Teuchi at Ichiraku Ramen. Return for a small reward.',
      status: 'available',
      track: 'D',
      rewards: [
        { type: 'xp', amount: 150 },
        { type: 'gold', amount: 100 }
      ]
    },
    {
      id: 'c-patrol-gates',
      title: 'C-Rank: Patrol the Village Gates',
      description:
        'Check in at the Konoha Gates and complete a patrol route around the main road.',
      status: 'available',
      track: 'C',
      rewards: [
        {
          type: 'item',
          item: {
            name: 'Chunin Bracers',
            icon: '🧤',
            slot: 'gloves',
            rarity: 'uncommon',
            stats: { defense: 5, dexterity: 2, weight: 1 },
            description: 'Sturdy bracers issued to Chunin patrols.',
            durability: { current: 100, max: 100 }
          }
        },
        { type: 'xp', amount: 300 }
      ]
    },
    {
      id: 'b-spar-arena',
      title: 'B-Rank: Arena Sparring Trial',
      description:
        'Test your mettle in the Chuunin Arena. Return with your head held high.',
      status: 'available',
      track: 'B',
      rewards: [
        { type: 'xp', amount: 500 },
        { type: 'upgrade', slot: 'weapon', modifiers: { stats: { attack: 5 }, rarity: 'epic', nameSuffix: '+1' } }
      ]
    }
  ];
}

