export const initialPlayerStats = {
    name: 'Kakashi',
    level: 1,
    health: 100,
    maxHealth: 100,
    chakra: 500,
    maxChakra: 500,
    experience: 0,
    maxExperience: 250,
    gold: 150,

    // Core Stats
    strength: 10,
    dexterity: 10,
    vitality: 10,
    energy: 10,
    
    // Combat Stats
    stamina: 95,
    maxStamina: 110,
    
    // Attack Stats
    attackRating: 150,
    minDamage: 12,
    maxDamage: 18,
    
    // Defense Stats
    defense: 45,
    
    // Resistances
    fireResist: 5,
    coldResist: 10,
    lightResist: -5,
    poisonResist: 8,
    
    // Available Points
    statPoints: 3,
    skillPoints: 1,
};

export const initialInventory = {
  equipment: {
    helmet: { 
      name: 'Iron Helmet', 
      icon: '⛑️', 
      slot: 'helmet',
      rarity: 'common',
      stats: { defense: 8, weight: 3 },
      description: 'A sturdy iron helmet that provides basic head protection.',
      durability: { current: 85, max: 100 }
    },
    armor: { 
      name: 'Chainmail Hauberk', 
      icon: '🥼', 
      slot: 'armor',
      rarity: 'uncommon',
      stats: { defense: 15, weight: 8 },
      description: 'Interlocked metal rings form a flexible yet protective armor.',
      durability: { current: 92, max: 100 }
    },
    weapon: { 
      name: 'Enchanted Steel Sword', 
      icon: '⚔️', 
      slot: 'weapon',
      rarity: 'rare',
      stats: { attack: 22, weight: 4, magic: 5 },
      description: 'A masterfully crafted sword with a faint magical aura.',
      durability: { current: 78, max: 100 }
    },
    shield: { 
      name: 'Oak Tower Shield', 
      icon: '🛡️', 
      slot: 'shield',
      rarity: 'common',
      stats: { defense: 12, block: 85, weight: 6 },
      description: 'A large wooden shield reinforced with iron bands.',
      durability: { current: 68, max: 100 }
    },
    gloves: null,
    boots: { 
      name: 'Leather Boots', 
      icon: '🥾', 
      slot: 'boots',
      rarity: 'common',
      stats: { defense: 3, agility: 2, weight: 2 },
      description: 'Well-worn leather boots, comfortable for long journeys.',
      durability: { current: 55, max: 100 }
    },
    ring1: null,
    ring2: { 
      name: 'Ring of Minor Healing', 
      icon: '💍', 
      slot: 'ring',
      rarity: 'uncommon',
      stats: { magic: 3, health_regen: 1 },
      description: 'A simple gold ring that slowly mends wounds.',
      durability: { current: 100, max: 100 }
    },
    amulet: null
  },
  potions: [
    { id: 'health1', name: 'Health Potion', type: 'health', color: 'red', count: 5, effect: '+50 HP' },
    { id: 'health2', name: 'Greater Health', type: 'health', color: 'red', count: 2, effect: '+150 HP' },
    { id: 'chakra1', name: 'Chakra Potion', type: 'chakra', color: 'blue', count: 3, effect: '+75 Chakra' },
    { id: 'chakra2', name: 'Greater Chakra', type: 'chakra', color: 'blue', count: 1, effect: '+200 Chakra' },
    { id: 'special', name: 'Elixir of Power', type: 'special', color: 'purple', count: 1, effect: '+25% DMG (5min)' }
  ],
  storage: [
    { name: 'Gold Coins', icon: '🪙', count: 150, rarity: 'common', description: 'Standard currency of the realm.' },
    { name: 'Ancient Scroll', icon: '📜', count: 1, rarity: 'legendary', description: 'An mysterious scroll with ancient runes.' },
    { name: 'Dragon Scale', icon: '🐲', count: 3, rarity: 'epic', description: 'A shimmering scale from an ancient dragon.' },
    null, null, null, null, null,
    { name: 'Iron Ore', icon: '🪨', count: 8, rarity: 'common', description: 'Raw iron ore, useful for crafting.' },
    null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null
  ]
};
