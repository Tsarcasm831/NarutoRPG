export const campaignArcs = Object.freeze([
  {
    id: "arc-01",
    name: "Arc I — Embers of the Leaf",
    summary:
      "Return to Konoha to investigate sabotage that threatens the village's new chakra relay network while old allies reunite.",
    escalation: [
      "Investigate the outskirts of the village after a string of coordinated supply thefts.",
      "Uncover mercenary operatives field-testing unstable chakra fuses beneath the Hokage monument.",
      "Race to disarm a cache of explosive tags primed to black out the entire village district."
    ],
    missions: [
      {
        id: "arc-01-m1",
        title: "Homecoming Briefing",
        objective: "Attend Lady Tsunade's debrief in the Hokage office and survey the damaged relay spires.",
        recommendedLevel: 1,
        location: "Hokage Office & Memorial Plaza",
        type: "Story",
        cutscene: {
          title: "Opening Cinematic: Rekindled Flames",
          description: "A sweeping flythrough of Konoha at dusk as the squad reunites and Tsunade outlines the sabotage threat."
        }
      },
      {
        id: "arc-01-m2",
        title: "Sabotage Sweep",
        objective: "Track stolen chakra cores to the abandoned training grounds and neutralize the rogue mercenary team.",
        recommendedLevel: 2,
        location: "Training Grounds Sector 3",
        type: "Assault",
        cutscene: {
          title: "Shadow Interrogation",
          description: "Shikamaru restrains a mercenary in shadow paralysis as the squad learns of a larger conspiracy."
        }
      },
      {
        id: "arc-01-m3",
        title: "Midnight Defusal",
        objective: "Infiltrate the storage depot, disarm the chakra fuses, and evacuate civilians before detonation.",
        recommendedLevel: 3,
        location: "South Market Depot",
        type: "Infiltration",
        cutscene: {
          title: "Last-Light Countdown",
          description: "A tense montage of simultaneous bomb defusals capped by a rooftop celebration over the sleeping village."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-01-cs-01",
        title: "Rekindled Flames",
        trigger: "Before Mission 1",
        description: "Establishes the squad's return and sets the political tone after months away on separate assignments."
      },
      {
        id: "arc-01-cs-02",
        title: "Shadow Interrogation",
        trigger: "After Mission 2",
        description: "Reveals that an unseen commander is arming multiple factions with experimental chakra tech."
      }
    ],
    rewards: [
      "Unlocks squad passive 'Leaf Resolve' granting +5% damage reduction during village defense missions.",
      "Opens access to the Border Outpost region for Arc II."
    ]
  },
  {
    id: "arc-02",
    name: "Arc II — Tempest on the Border",
    summary:
      "Pursue the mercenary network across the Land of Rivers and intercept shipments meant to destabilize Konoha's allies.",
    escalation: [
      "Trace forged travel permits to a caravan hub controlled by smugglers loyal to the mysterious commander.",
      "Defend an outpost while deciphering encoded orders that point toward a larger invasion plan.",
      "Challenge a rogue jonin who is orchestrating supply lines for a cross-border assault."
    ],
    missions: [
      {
        id: "arc-02-m1",
        title: "Caravan Sting",
        objective: "Run a covert checkpoint sting to seize contraband chakra amplifiers hidden within merchant caravans.",
        recommendedLevel: 4,
        location: "Takanami Crossing",
        type: "Stealth",
        cutscene: {
          title: "Riverfront Chase",
          description: "Naruto and Sasuke race across the riverbanks pursuing a courier while Sakura disables the caravan seals."
        }
      },
      {
        id: "arc-02-m2",
        title: "Outpost Stand",
        objective: "Fortify the border outpost, repel waves of mercenaries, and protect allied medics decoding enemy orders.",
        recommendedLevel: 5,
        location: "Kawa Outpost",
        type: "Defense",
        cutscene: {
          title: "Shattered Ramparts",
          description: "Cinematic slow motion of the squad defending the outpost as explosive tags rain down from the cliffs."
        }
      },
      {
        id: "arc-02-m3",
        title: "Duel at Dawn",
        objective: "Defeat Captain Reiga, the rogue jonin commanding the mercenary cells, before his assault can launch.",
        recommendedLevel: 6,
        location: "River Plateau",
        type: "Boss",
        cutscene: {
          title: "Breaking the Chain",
          description: "Reiga's mask shatters as he reveals the name of the mastermind—an exile planning to unite the great nations in war."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-02-cs-01",
        title: "Riverfront Chase",
        trigger: "After Mission 1",
        description: "Highlights the team's coordination as they prevent the amplifiers from crossing into allied territory."
      },
      {
        id: "arc-02-cs-02",
        title: "Breaking the Chain",
        trigger: "After Mission 3",
        description: "Sets up the looming threat of the exile known as the Wraith Daimyo."
      }
    ],
    rewards: [
      "Unlocks elemental fuse crafting in the village workshop for enhanced kunai and shuriken.",
      "Adds elite patrol encounters to the overworld with improved loot tables."
    ]
  },
  {
    id: "arc-03",
    name: "Arc III — Veil of Mist",
    summary:
      "Journey to Kirigakure to broker information with the Mist ANBU while uncovering traitors feeding intel to the Wraith Daimyo.",
    escalation: [
      "Sneak through the mist cloisters to contact an undercover ANBU informant.",
      "Track a defector through the Blood Marsh while avoiding hunter-nin patrols.",
      "Expose a hidden armory powering the Wraith Daimyo's amphibious siege engines."
    ],
    missions: [
      {
        id: "arc-03-m1",
        title: "Silent Envoy",
        objective: "Meet the Mist ANBU liaison without alerting the purges still sweeping through the inner districts.",
        recommendedLevel: 7,
        location: "Hidden Mist Cloisters",
        type: "Stealth",
        cutscene: {
          title: "Whispers in the Fog",
          description: "Kakashi trades coded phrases with the ANBU agent while masked hunters stalk the alleys in the background."
        }
      },
      {
        id: "arc-03-m2",
        title: "Marsh Pursuit",
        objective: "Track the defector Yasuri across the Blood Marsh, capturing him before he reaches the smuggler boats.",
        recommendedLevel: 8,
        location: "Blood Marsh Delta",
        type: "Chase",
        cutscene: {
          title: "Reflections",
          description: "A mirrored duel on the marsh water that showcases advanced water-style counters between Sasuke and Yasuri."
        }
      },
      {
        id: "arc-03-m3",
        title: "Armory of Echoes",
        objective: "Sabotage the hidden armory, overload the chakra boilers, and escape before the mist collapses.",
        recommendedLevel: 9,
        location: "Tidal Armory",
        type: "Sabotage",
        cutscene: {
          title: "Boiling Point",
          description: "The squad outruns cascading explosions as the armory sinks beneath the fog-shrouded bay."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-03-cs-01",
        title: "Whispers in the Fog",
        trigger: "After Mission 1",
        description: "Hints at divisions inside Kirigakure and seeds doubt about who can be trusted."
      },
      {
        id: "arc-03-cs-02",
        title: "Boiling Point",
        trigger: "After Mission 3",
        description: "Reveals the Wraith Daimyo's plan to strike all five nations in a single night of chaos."
      }
    ],
    rewards: [
      "Unlocks Mist traversal challenges and water-style training nodes in free roam.",
      "Adds ANBU support requests as rotating side missions."
    ]
  },
  {
    id: "arc-04",
    name: "Arc IV — Siege of Sand",
    summary:
      "Rush to Sunagakure to assist Gaara as the Wraith Daimyo's siege engines bombard the sand barricades.",
    escalation: [
      "Reinforce the outer walls while civilians evacuate into the canyon shelters.",
      "Disable colossal chakra cannons buried beneath shifting dunes.",
      "Coordinate with Gaara to counter a summoned glass dragon leading the siege."
    ],
    missions: [
      {
        id: "arc-04-m1",
        title: "Dune Phalanx",
        objective: "Hold the outer barricade and escort engineers repairing collapsing shield pylons.",
        recommendedLevel: 10,
        location: "Sunagakure Outer Wall",
        type: "Defense",
        cutscene: {
          title: "Shifting Lines",
          description: "Gaara raises towering sand ramparts as the squad deflects a barrage of crystal-tipped projectiles."
        }
      },
      {
        id: "arc-04-m2",
        title: "Buried Cannons",
        objective: "Dive beneath the dunes to destroy the chakra conduits powering the siege cannons before they recharge.",
        recommendedLevel: 11,
        location: "Crimson Dune Network",
        type: "Sabotage",
        cutscene: {
          title: "Collapse",
          description: "The caverns implode while Gaara tunnels an escape route that erupts into a desert whirlwind."
        }
      },
      {
        id: "arc-04-m3",
        title: "Glass Dragon",
        objective: "Defeat the summoned glass dragon in aerial combat alongside Gaara's sand avatar.",
        recommendedLevel: 12,
        location: "Sky over Sunagakure",
        type: "Boss",
        cutscene: {
          title: "Skyfall",
          description: "A dazzling aerial duel culminating in Gaara crystallizing the dragon mid-flight before it shatters."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-04-cs-01",
        title: "Shifting Lines",
        trigger: "After Mission 1",
        description: "Shows the desperation inside Sunagakure and foreshadows the dragon assault."
      },
      {
        id: "arc-04-cs-02",
        title: "Skyfall",
        trigger: "After Mission 3",
        description: "Gaara pledges the Sand's full alliance in the final assault on the Wraith Daimyo."
      }
    ],
    rewards: [
      "Unlocks aerial traversal trials and sand-manipulation jutsu augment paths.",
      "Adds Gaara as a support summon for world boss encounters."
    ]
  },
  {
    id: "arc-05",
    name: "Arc V — Serpent's Gambit",
    summary:
      "Infiltrate the hidden lairs of the Wraith Daimyo only to discover Orochimaru's splinter cell manipulating events behind the scenes.",
    escalation: [
      "Breach a labyrinth of cursed seals that feed chakra into the Wraith Daimyo's war engines.",
      "Rescue allied captains undergoing forced experimentation to create perfect jinchuriki vessels.",
      "Confront Orochimaru's lieutenant and shatter the ritual siphoning power from the captured hosts."
    ],
    missions: [
      {
        id: "arc-05-m1",
        title: "Serpent Labyrinth",
        objective: "Disarm cursed seal totems while evading shifting walls and venomous traps in Orochimaru's lair.",
        recommendedLevel: 13,
        location: "Hidden Burrow",
        type: "Puzzle",
        cutscene: {
          title: "Threads of Fate",
          description: "Hinata maps the chakra threads binding the lair, giving the squad a path through the collapsing tunnels."
        }
      },
      {
        id: "arc-05-m2",
        title: "Rescue the Captains",
        objective: "Free the imprisoned captains and escort them out while waves of enhanced clones assault the corridors.",
        recommendedLevel: 14,
        location: "Orochimaru's Chambers",
        type: "Rescue",
        cutscene: {
          title: "Fractured Bonds",
          description: "The captains reveal Orochimaru planned to seize the Wraith Daimyo's army once the nations fell."
        }
      },
      {
        id: "arc-05-m3",
        title: "Ritual Rupture",
        objective: "Defeat Kabuto's perfected clone, sever the ritual pillar, and reclaim the siphoned chakra cores.",
        recommendedLevel: 15,
        location: "Ritual Nexus",
        type: "Boss",
        cutscene: {
          title: "Serpent's Fall",
          description: "Kabuto's defeat forces Orochimaru to reveal himself via astral projection, taunting the heroes before retreating."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-05-cs-01",
        title: "Threads of Fate",
        trigger: "After Mission 1",
        description: "Highlights Hinata's Byakugan ingenuity as she navigates the cursed maze."
      },
      {
        id: "arc-05-cs-02",
        title: "Serpent's Fall",
        trigger: "After Mission 3",
        description: "Sets the stakes for the final confrontation and shows Orochimaru losing control of the narrative."
      }
    ],
    rewards: [
      "Unlocks high-tier cursed seal crafting and serpent-themed cosmetics.",
      "Adds elite rescue contracts with powerful support rewards."
    ]
  },
  {
    id: "arc-06",
    name: "Arc VI — Dawn of the Shinobi",
    summary:
      "Launch a united assault on the Wraith Daimyo's floating citadel to end the war before sunrise.",
    escalation: [
      "Ascend the citadel's outer defenses while allied villages hold off the remaining mercenary armies.",
      "Disrupt the chakra siphon fueling the citadel's levitation core.",
      "Confront the Wraith Daimyo in a multi-phase battle that shifts between reality and the spirit realm."
    ],
    missions: [
      {
        id: "arc-06-m1",
        title: "Assault on the Citadel",
        objective: "Coordinate with allied squads to breach the floating fortress and secure teleport anchors.",
        recommendedLevel: 16,
        location: "Sky Citadel Exterior",
        type: "Assault",
        cutscene: {
          title: "Alliance Charge",
          description: "All five Kage lead their forces across the skyline as portals open to the citadel battlements."
        }
      },
      {
        id: "arc-06-m2",
        title: "Heart of the Storm",
        objective: "Disable the levitation core by rerouting chakra conduits while defending engineers from spectral guardians.",
        recommendedLevel: 17,
        location: "Citadel Core",
        type: "Objective Defense",
        cutscene: {
          title: "Fractured Reality",
          description: "The citadel destabilizes, shifting between physical and ethereal planes as the heroes fight on floating shards."
        }
      },
      {
        id: "arc-06-m3",
        title: "Final Dawn",
        objective: "Defeat the Wraith Daimyo across three phases that blend taijutsu, ninjutsu, and spirit realm duels.",
        recommendedLevel: 18,
        location: "Citadel Throne",
        type: "Final Boss",
        cutscene: {
          title: "Dawn of the Shinobi",
          description: "A triumphant sunrise over a rebuilt Konoha as the allied villages commit to a new era of cooperation."
        }
      }
    ],
    cinematics: [
      {
        id: "arc-06-cs-01",
        title: "Alliance Charge",
        trigger: "Before Mission 1",
        description: "Assembles every allied village on-screen for the final push."
      },
      {
        id: "arc-06-cs-02",
        title: "Dawn of the Shinobi",
        trigger: "After Mission 3",
        description: "Closes the campaign with a cinematic epilogue celebrating peace and honoring the fallen."
      }
    ],
    rewards: [
      "Unlocks New Game+ difficulty modifiers and legendary gear schematics.",
      "Enables replay of completed arcs with score tracking for leaderboards."
    ]
  }
]);

export const totalCampaignMissions = campaignArcs.reduce(
  (total, arc) => total + (Array.isArray(arc.missions) ? arc.missions.length : 0),
  0
);
