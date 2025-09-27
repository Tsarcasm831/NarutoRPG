export const WORLD_EVENT_SEQUENCE = [
    {
        id: 'festival_of_lanterns',
        label: 'Lantern Festival',
        type: 'festival',
        description: 'Village artisans flood the market with lanterns and food stalls. Training rewards are boosted while the celebration lasts.',
        startDelayMs: 45000,
        durationMs: 120000,
        assets: [
            './menu.png',
            './loading1.png',
            '/src/assets/Hokage_Monument.glb'
        ],
        districtOverrides: [
            {
                id: 'district-12',
                urls: [
                    'map/district-buildings/events/district-12.festival.json',
                    '/map/district-buildings/events/district-12.festival.json'
                ]
            }
        ],
        buffs: {
            xpMultiplier: 1.25,
            chakraRegen: 1.15
        },
        tags: ['festival', 'buff'],
        worldStatePatch: {
            ambientMood: 'celebration',
            npcSchedule: 'festival_market'
        }
    },
    {
        id: 'sound_invasion_scouts',
        label: 'Sound Scouts Inbound',
        type: 'invasion',
        description: 'Enemy scouts breach the walls. Patrol routes tighten and makeshift barricades appear near the gates.',
        startDelayMs: 90000,
        durationMs: 90000,
        assets: [
            '/src/assets/hokage_office.glb'
        ],
        districtOverrides: [
            {
                id: 'district-3',
                urls: [
                    'map/district-buildings/events/district-3.invasion.json',
                    '/map/district-buildings/events/district-3.invasion.json'
                ]
            }
        ],
        buffs: {
            xpMultiplier: 1.4,
            damageBoost: 1.15
        },
        tags: ['combat', 'threat'],
        worldStatePatch: {
            ambientMood: 'tense',
            npcSchedule: 'lockdown',
            alertLevel: 'high'
        }
    },
    {
        id: 'hospital_emergency',
        label: 'Hospital Emergency',
        type: 'emergency',
        description: 'Medical teams mobilise to treat the wounded. Chakra healers receive temporary efficiency buffs.',
        startDelayMs: 60000,
        durationMs: 90000,
        assets: [
            '/src/assets/Hospital.glb'
        ],
        districtOverrides: [
            {
                id: 'district-18',
                urls: [
                    'map/district-buildings/events/district-18.emergency.json',
                    '/map/district-buildings/events/district-18.emergency.json'
                ]
            }
        ],
        buffs: {
            healingBoost: 1.35,
            chakraRegen: 1.25
        },
        tags: ['healing', 'support'],
        worldStatePatch: {
            ambientMood: 'urgent',
            npcSchedule: 'medical_response'
        }
    }
];

export const WORLD_EVENT_DEFAULTS = {
    durationMs: 60000,
    startDelayMs: 60000
};
