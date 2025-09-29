import { initialPlayerStats, initialInventory } from '../initialState.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const PLAYER_CHARACTERS = [
  {
    key: 'kakashi',
    name: 'Kakashi Hatake',
    codename: 'Copy Ninja',
    description: 'Balanced jōnin proficient with Sharingan techniques and tactical ninjutsu.',
    manifest: './src/components/json/kakashiAnimations.json',
    mugshot: '/src/assets/images/mugshots/kakashi.png',
    scale: 2.8,
    tags: ['Balanced', 'Sharingan', 'Versatile'],
    animation: {
      essential: [
        'Animation_Idle_11_withSkin.glb',
        'Animation_Walking_withSkin.glb',
        'Animation_RunFast_withSkin.glb',
        'Animation_Running_withSkin.glb',
        'Animation_Regular_Jump_withSkin.glb',
        'Animation_Fall1_withSkin.glb',
        'Animation_Punch_Combo_1_withSkin.glb',
        'Animation_Roll_Dodge_withSkin.glb'
      ],
      default: 'idle11'
    },
    statOverrides: {
      name: 'Kakashi Hatake'
    }
  },
  {
    key: 'naruto',
    name: 'Naruto Uzumaki',
    codename: 'Spirited Jinchūriki',
    description: 'Unpredictable dynamo with overwhelming stamina and relentless drive.',
    manifest: './src/components/json/narutoAnimations.json',
    mugshot: '/src/assets/images/mugshots/naruto.png',
    scale: 2.9,
    tags: ['High Stamina', 'Shadow Clones', 'Close Combat'],
    animation: {
      essential: [
        'Animation_Idle_11_withSkin.glb',
        'Animation_Walking_withSkin.glb',
        'Animation_Running_withSkin.glb',
        'Animation_Casual_Walk_withSkin.glb',
        'Animation_Arise_withSkin.glb',
        'Animation_Listening_Gesture_withSkin.glb',
        'Animation_Stand_and_Chat_withSkin.glb',
        'Animation_Charged_Ground_Slam_withSkin.glb'
      ],
      default: 'idle11',
      remap: {
        regularJump: ['arise', 'idle11'],
        fall1: ['idle11'],
        punchCombo1: ['chargedGroundSlam', 'running'],
        rollDodge: ['running', 'casualWalk'],
        runFast: ['running']
      }
    },
    statOverrides: {
      name: 'Naruto Uzumaki',
      vitality: 13,
      strength: 11,
      stamina: 130,
      maxStamina: 150,
      chakra: 320,
      maxChakra: 320,
      attackRating: 148,
      minDamage: 11,
      maxDamage: 17
    }
  },
  {
    key: 'sasuke',
    name: 'Sasuke Uchiha',
    codename: 'Avenger',
    description: 'Sharingan prodigy specializing in precision strikes and lightning style jutsu.',
    manifest: './src/components/json/sasukeAnimations.json',
    mugshot: '/src/assets/images/mugshots/sasuke.png',
    scale: 2.85,
    tags: ['High Chakra', 'Lightning Style', 'Agile'],
    animation: {
      essential: [
        'Animation_Idle_11_withSkin.glb',
        'Animation_Walking_withSkin.glb',
        'Animation_Running_withSkin.glb',
        'Animation_Casual_Walk_withSkin.glb',
        'Animation_Arise_withSkin.glb',
        'Animation_Listening_Gesture_withSkin.glb',
        'Animation_Stand_and_Chat_withSkin.glb',
        'Animation_Charged_Ground_Slam_withSkin.glb'
      ],
      remap: {
        regularJump: ['arise', 'idle11'],
        fall1: ['idle11'],
        punchCombo1: ['chargedGroundSlam', 'running'],
        rollDodge: ['running'],
        runFast: ['running']
      }
    },
    statOverrides: {
      name: 'Sasuke Uchiha',
      dexterity: 13,
      energy: 12,
      chakra: 560,
      maxChakra: 560,
      attackRating: 162,
      minDamage: 13,
      maxDamage: 19,
      defense: 42
    }
  },
  {
    key: 'sakura',
    name: 'Sakura Haruno',
    codename: 'Medic Specialist',
    description: 'Brilliant medical ninja with exceptional chakra control and resilience.',
    manifest: './src/components/json/sakuraAnimations.json',
    mugshot: '/src/assets/images/mugshots/sakura.png',
    scale: 2.8,
    tags: ['Support', 'Chakra Control', 'Resilient'],
    animation: {
      essential: [
        'Animation_Idle_12_withSkin.glb',
        'Animation_Walking_withSkin.glb',
        'Animation_Running_withSkin.glb',
        'Animation_Casual_Walk_withSkin.glb',
        'Animation_Arise_withSkin.glb',
        'Animation_Listening_Gesture_withSkin.glb',
        'Animation_Stand_and_Chat_withSkin.glb',
        'Animation_Charged_Ground_Slam_withSkin.glb',
        'Animation_Charged_Spell_Cast_withSkin.glb'
      ],
      default: 'idle12',
      remap: {
        idle11: ['idle12'],
        regularJump: ['arise', 'idle12'],
        fall1: ['idle12'],
        punchCombo1: ['chargedGroundSlam', 'chargedSpellCast'],
        rollDodge: ['running'],
        runFast: ['running']
      }
    },
    statOverrides: {
      name: 'Sakura Haruno',
      health: 120,
      maxHealth: 120,
      chakra: 440,
      maxChakra: 440,
      vitality: 12,
      energy: 12,
      statPoints: 4
    }
  },
  {
    key: 'shikamaru',
    name: 'Shikamaru Nara',
    codename: 'Shadow Strategist',
    description: 'Tactical genius who leverages intellect, traps, and precise chakra manipulation.',
    manifest: './src/components/json/shikamaruAnimations.json',
    mugshot: '/src/assets/images/mugshots/shikamaru.png',
    scale: 2.8,
    tags: ['Strategist', 'Control', 'High Chakra'],
    animation: {
      essential: [
        'Animation_Idle_11_withSkin.glb',
        'Animation_Listening_Gesture_withSkin.glb',
        'Animation_Regular_Jump_withSkin.glb',
        'Animation_Running_withSkin.glb',
        'Animation_Walking_withSkin.glb'
      ],
      remap: {
        fall1: ['idle11'],
        punchCombo1: ['listeningGesture', 'running'],
        rollDodge: ['running'],
        runFast: ['running']
      }
    },
    statOverrides: {
      name: 'Shikamaru Nara',
      energy: 14,
      chakra: 500,
      maxChakra: 500,
      dexterity: 11,
      defense: 40,
      attackRating: 140
    }
  }
];

export const getCharacterByKey = (key) => {
  if (!key) return PLAYER_CHARACTERS[0];
  return PLAYER_CHARACTERS.find((character) => character.key === key) || PLAYER_CHARACTERS[0];
};

export const getDefaultCharacter = () => PLAYER_CHARACTERS[0];

export const buildStatsForCharacter = (key) => {
  const character = getCharacterByKey(key);
  const base = clone(initialPlayerStats);
  return { ...base, ...(character?.statOverrides || {}) };
};

export const buildInventoryForCharacter = (key) => {
  // Currently all characters share the same starter inventory.
  // Clone to prevent shared references across sessions.
  return clone(initialInventory);
};
