import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  deriveCampaignState,
  completeCampaignMission,
  resetCampaignSave,
  campaignProgressMetrics
} from '../../src/game/campaign.js';
import { campaignArcs } from '../../src/data/campaignArcs.js';

function getMission(state, missionId) {
  for (const arc of state.arcs) {
    const found = arc.missions.find((mission) => mission.id === missionId);
    if (found) {
      return { arc, mission: found };
    }
  }
  return null;
}

test('initial campaign state unlocks only the first mission of the first arc', () => {
  const state = deriveCampaignState();
  assert.equal(state.arcs[0]?.status, 'available');
  assert.equal(state.arcs[0]?.missions[0]?.status, 'available');
  for (const mission of state.arcs[0]?.missions.slice(1) ?? []) {
    assert.equal(mission.status, 'locked');
  }
  for (const arc of state.arcs.slice(1)) {
    assert.equal(arc.status, 'locked');
    for (const mission of arc.missions) {
      assert.notEqual(mission.status, 'available');
      if (mission.status !== 'completed') {
        assert.equal(mission.status, 'locked');
      }
    }
  }
});

test('completing missions advances the arc sequentially and unlocks the next arc', () => {
  let save = resetCampaignSave();
  save = completeCampaignMission(save, 'arc-01-m1');
  let state = deriveCampaignState(save);
  let arc1 = state.arcs[0];
  assert.equal(arc1.missions[0].status, 'completed');
  assert.equal(arc1.missions[1].status, 'available');

  // Locked missions cannot be completed out of order
  const blocked = completeCampaignMission(save, 'arc-02-m1');
  assert.equal(blocked.completedMissionIds.length, save.completedMissionIds.length);

  save = completeCampaignMission(save, 'arc-01-m2');
  save = completeCampaignMission(save, 'arc-01-m3');
  state = deriveCampaignState(save);
  arc1 = state.arcs[0];
  assert.equal(arc1.status, 'completed');
  const arc2 = state.arcs[1];
  assert.equal(arc2.status, 'available');
  assert.equal(arc2.missions[0].status, 'available');

  // Duplicate completions should not duplicate entries
  const before = save.completedMissionIds.length;
  save = completeCampaignMission(save, 'arc-01-m3');
  assert.equal(save.completedMissionIds.length, before);
});

test('campaign progress metrics reflect completed missions and expose the next mission', () => {
  let save = resetCampaignSave();
  save = completeCampaignMission(save, 'arc-01-m1');
  save = completeCampaignMission(save, 'arc-01-m2');
  save = completeCampaignMission(save, 'arc-01-m3');
  const metrics = campaignProgressMetrics(save);
  const totalMissions = campaignArcs.reduce((sum, arc) => sum + arc.missions.length, 0);
  assert.equal(metrics.completedMissions, 3);
  assert.equal(metrics.totalMissions, totalMissions);
  assert.equal(metrics.arcsCompleted, 1);
  assert.equal(metrics.totalArcs, campaignArcs.length);
  const expectedPercent = totalMissions ? Math.round((3 / totalMissions) * 100) : 0;
  assert.equal(metrics.percent, expectedPercent);
  assert(metrics.nextMission, 'next mission should be provided after completing arc one');
  assert.equal(metrics.nextMission.id, 'arc-02-m1');
});

test('deriveCampaignState returns mission metadata for lookups', () => {
  let save = resetCampaignSave();
  save = completeCampaignMission(save, 'arc-01-m1');
  save = completeCampaignMission(save, 'arc-01-m2');
  const state = deriveCampaignState(save);
  const lookup = getMission(state, 'arc-01-m2');
  assert(lookup);
  assert.equal(lookup.mission.status, 'completed');
  assert.equal(lookup.arc.id, 'arc-01');
});
