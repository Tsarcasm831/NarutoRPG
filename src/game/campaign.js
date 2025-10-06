import { campaignArcs, totalCampaignMissions } from "../data/campaignArcs.js";

export const CAMPAIGN_STORAGE_KEY = "narutoRPG.campaign.progress";

const missionIndex = new Map();
campaignArcs.forEach((arc, arcIndex) => {
  if (!arc || !Array.isArray(arc.missions)) return;
  arc.missions.forEach((mission, missionIndexInArc) => {
    if (!mission || !mission.id) return;
    missionIndex.set(mission.id, { arcId: arc.id, arcIndex, missionIndex: missionIndexInArc });
  });
});

function sortMissionIds(ids) {
  return Array.from(ids)
    .filter((id) => missionIndex.has(id))
    .sort((a, b) => {
      const aMeta = missionIndex.get(a);
      const bMeta = missionIndex.get(b);
      if (!aMeta || !bMeta) return 0;
      if (aMeta.arcIndex !== bMeta.arcIndex) return aMeta.arcIndex - bMeta.arcIndex;
      return aMeta.missionIndex - bMeta.missionIndex;
    });
}

export function createInitialCampaignSave() {
  return {
    completedMissionIds: [],
    lastUpdated: Date.now()
  };
}

function normalizeSave(raw, { updateTimestamp = false } = {}) {
  const base = createInitialCampaignSave();
  if (!raw || typeof raw !== "object") {
    return updateTimestamp ? { ...base, lastUpdated: Date.now() } : base;
  }
  const unique = new Set();
  if (Array.isArray(raw.completedMissionIds)) {
    for (const id of raw.completedMissionIds) {
      if (typeof id === "string" && missionIndex.has(id)) {
        unique.add(id);
      }
    }
  }
  const normalized = {
    completedMissionIds: sortMissionIds(unique),
    lastUpdated: typeof raw.lastUpdated === "number" ? raw.lastUpdated : base.lastUpdated
  };
  if (updateTimestamp) {
    normalized.lastUpdated = Date.now();
  }
  return normalized;
}

export function loadCampaignSave() {
  if (typeof window === "undefined" || !window?.localStorage) {
    return createInitialCampaignSave();
  }
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) {
      return createInitialCampaignSave();
    }
    const parsed = JSON.parse(raw);
    return normalizeSave(parsed);
  } catch (error) {
    return createInitialCampaignSave();
  }
}

export function persistCampaignSave(save) {
  if (typeof window === "undefined" || !window?.localStorage) {
    return;
  }
  try {
    const normalized = normalizeSave(save, { updateTimestamp: false });
    window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    // Ignore persistence errors (private browsing, storage quotas, etc.)
  }
}

export function resetCampaignSave() {
  return createInitialCampaignSave();
}

function buildArcViews(completedSet) {
  const arcs = [];
  for (const arc of campaignArcs) {
    const missions = Array.isArray(arc.missions)
      ? arc.missions.map((mission) => ({
          ...mission,
          status: completedSet.has(mission.id) ? "completed" : "locked"
        }))
      : [];
    arcs.push({
      ...arc,
      status: "locked",
      missions
    });
  }

  let previousArcComplete = true;
  let nextMission = null;

  for (const arcView of arcs) {
    const allCompleted = arcView.missions.length === 0 || arcView.missions.every((mission) => mission.status === "completed");
    if (allCompleted) {
      arcView.status = "completed";
      previousArcComplete = true;
      continue;
    }

    if (previousArcComplete) {
      arcView.status = "available";
      let foundPlayable = false;
      for (const missionView of arcView.missions) {
        if (missionView.status === "completed") {
          continue;
        }
        if (!foundPlayable) {
          missionView.status = "available";
          if (!nextMission) {
            nextMission = { ...missionView, arcId: arcView.id, arcName: arcView.name };
          }
          foundPlayable = true;
        } else {
          missionView.status = "locked";
        }
      }
      if (!foundPlayable) {
        arcView.status = "completed";
        previousArcComplete = true;
      } else {
        previousArcComplete = false;
      }
    } else {
      arcView.status = arcView.missions.every((mission) => mission.status === "completed") ? "completed" : "locked";
      if (arcView.status !== "completed") {
        for (const missionView of arcView.missions) {
          if (missionView.status !== "completed") {
            missionView.status = "locked";
          }
        }
      }
      previousArcComplete = arcView.status === "completed";
    }
  }

  const activeArc = arcs.find((arc) => arc.status === "available") || arcs[arcs.length - 1] || null;

  return { arcs, nextMission, activeArcId: activeArc ? activeArc.id : null };
}

export function deriveCampaignState(save) {
  const normalized = normalizeSave(save);
  const completedSet = new Set(normalized.completedMissionIds);
  const { arcs, nextMission, activeArcId } = buildArcViews(completedSet);
  return {
    arcs,
    nextMission,
    activeArcId,
    completedMissionIds: Array.from(completedSet),
    lastUpdated: normalized.lastUpdated
  };
}

export function completeCampaignMission(save, missionId) {
  if (!missionIndex.has(missionId)) {
    return normalizeSave(save);
  }
  const normalized = normalizeSave(save);
  if (normalized.completedMissionIds.includes(missionId)) {
    return normalized;
  }
  const state = deriveCampaignState(normalized);
  const missionView = state.arcs
    .flatMap((arc) => arc.missions.map((mission) => ({ arcId: arc.id, mission })))
    .find(({ mission }) => mission.id === missionId);
  if (!missionView || missionView.mission.status === "locked") {
    return normalized;
  }
  const updated = new Set(state.completedMissionIds);
  updated.add(missionId);
  return {
    completedMissionIds: sortMissionIds(updated),
    lastUpdated: Date.now()
  };
}

export function campaignProgressMetrics(save) {
  const state = deriveCampaignState(save);
  const completedMissionIds = state.completedMissionIds;
  const validCompleted = completedMissionIds.filter((id) => missionIndex.has(id));
  const arcsCompleted = state.arcs.filter((arc) => arc.status === "completed").length;
  const percent = totalCampaignMissions
    ? Math.round((validCompleted.length / totalCampaignMissions) * 100)
    : 0;
  return {
    totalMissions: totalCampaignMissions,
    completedMissions: validCompleted.length,
    totalArcs: campaignArcs.length,
    arcsCompleted,
    percent,
    nextMission: state.nextMission,
    activeArcId: state.activeArcId
  };
}
