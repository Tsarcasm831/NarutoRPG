import React from 'react';

const STATUS_COLORS = {
  completed: 'bg-green-600',
  available: 'bg-blue-600',
  locked: 'bg-gray-600'
};

const STATUS_LABELS = {
  completed: 'Completed',
  available: 'Available',
  locked: 'Locked'
};

const MissionStatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  const color = STATUS_COLORS[normalized] || STATUS_COLORS.locked;
  const label = STATUS_LABELS[normalized] || 'Locked';
  return React.createElement(
    'span',
    { className: `text-xs ${color} text-white px-2 py-0.5 rounded uppercase tracking-wide` },
    label
  );
};

const CinematicTag = ({ title, trigger }) =>
  React.createElement(
    'span',
    { className: 'inline-flex items-center gap-1 rounded-full bg-purple-700/70 px-3 py-1 text-xs text-purple-100 mr-2 mb-2' },
    [
      React.createElement('span', { key: 'icon' }, '🎞️'),
      React.createElement('span', { key: 'label', className: 'font-semibold' }, title),
      trigger
        ? React.createElement('span', { key: 'trigger', className: 'opacity-70' }, `(${trigger})`)
        : null
    ]
  );

const CampaignPanel = ({
  campaignState,
  campaignMetrics,
  onClose,
  onMarkMissionComplete,
  onResetProgress
}) => {
  const h = React.createElement;
  const arcs = campaignState?.arcs ?? [];
  const nextMission = campaignState?.nextMission ?? campaignMetrics?.nextMission ?? null;
  const progress = campaignMetrics ?? {
    totalMissions: 0,
    completedMissions: 0,
    percent: 0,
    totalArcs: arcs.length,
    arcsCompleted: arcs.filter((arc) => arc.status === 'completed').length
  };

  const progressPercent = Number.isFinite(progress.percent) ? Math.max(0, Math.min(100, progress.percent)) : 0;

  const handleReset = () => {
    if (typeof onResetProgress !== 'function') return;
    const shouldReset = typeof window === 'undefined' ? true : window.confirm('Reset campaign progress?');
    if (shouldReset) {
      onResetProgress();
    }
  };

  return h(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto' },
    h(
      'div',
      {
        className:
          'relative w-full max-w-5xl bg-gradient-to-br from-gray-900 via-gray-950 to-black border-4 border-yellow-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden',
        style: { minHeight: 'min(820px, 95vh)' }
      },
      [
        h('div', { key: 'hdr', className: 'flex items-start justify-between p-6 border-b border-yellow-500/50' }, [
          h('div', { key: 'title' }, [
            h('h1', { key: 'h1', className: 'text-3xl font-bold text-yellow-300 tracking-wide drop-shadow-lg' }, 'STORY CAMPAIGN'),
            progress.totalMissions
              ? h(
                  'p',
                  { key: 'meta', className: 'text-sm text-yellow-100/80 mt-1' },
                  `${progress.completedMissions} of ${progress.totalMissions} story missions cleared (${progressPercent}% complete)`
                )
              : null,
            progress.totalArcs
              ? h(
                  'p',
                  { key: 'arcs', className: 'text-xs uppercase tracking-widest text-yellow-200/60 mt-1' },
                  `${progress.arcsCompleted} of ${progress.totalArcs} arcs complete`
                )
              : null
          ]),
          h(
            'button',
            {
              key: 'close',
              onClick: onClose,
              className:
                'text-red-400 hover:text-red-200 text-3xl font-bold bg-black/50 hover:bg-black/30 rounded-full w-12 h-12 flex items-center justify-center border-2 border-red-500 hover:border-red-300 transition-all duration-200',
              'aria-label': 'Close campaign panel'
            },
            '×'
          )
        ]),
        h(
          'div',
          { key: 'summary', className: 'px-6 pt-4 pb-2 border-b border-yellow-500/40 bg-black/30' },
          [
            h('div', { key: 'progress', className: 'w-full h-3 rounded-full bg-gray-800 overflow-hidden' }, [
              h('div', {
                key: 'bar',
                className: 'h-full bg-yellow-500 transition-all duration-500 ease-out',
                style: { width: `${progressPercent}%` }
              })
            ]),
            nextMission
              ? h(
                  'div',
                  { key: 'next', className: 'mt-3 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3' },
                  [
                    h('div', { key: 'icon', className: 'text-2xl', 'aria-hidden': 'true' }, '⭐'),
                    h('div', { key: 'content' }, [
                      h(
                        'p',
                        { key: 'label', className: 'text-sm text-yellow-200/90 uppercase tracking-wide' },
                        `Next Mission: ${nextMission.title}`
                      ),
                      nextMission.arcName
                        ? h(
                            'p',
                            { key: 'arc', className: 'text-xs text-yellow-100/70 mt-0.5' },
                            `Arc Focus: ${nextMission.arcName}`
                          )
                        : null,
                      nextMission.objective
                        ? h(
                            'p',
                            { key: 'objective', className: 'text-sm text-gray-200 mt-1' },
                            nextMission.objective
                          )
                        : null
                    ])
                  ]
                )
              : null
          ]
        ),
        h(
          'div',
          { key: 'body', className: 'flex-1 overflow-y-auto p-6 space-y-6' },
          arcs.map((arc) =>
            h(
              'section',
              { key: arc.id, className: 'bg-gray-900/60 border border-yellow-600/40 rounded-xl shadow-inner p-5 space-y-4' },
              [
                h('div', { key: 'hdr', className: 'flex flex-wrap items-start justify-between gap-3' }, [
                  h('div', { key: 'titles' }, [
                    h('h2', { key: 'name', className: 'text-2xl font-semibold text-yellow-200' }, arc.name),
                    arc.summary
                      ? h('p', { key: 'summary', className: 'text-sm text-gray-200 mt-1 leading-relaxed' }, arc.summary)
                      : null
                  ]),
                  h(MissionStatusBadge, { key: 'status', status: arc.status })
                ]),
                Array.isArray(arc.escalation) && arc.escalation.length
                  ? h(
                      'ul',
                      { key: 'escalation', className: 'list-disc list-inside text-sm text-gray-300 space-y-1' },
                      arc.escalation.map((beat, idx) => h('li', { key: `${arc.id}-beat-${idx}` }, beat))
                    )
                  : null,
                Array.isArray(arc.cinematics) && arc.cinematics.length
                  ? h(
                      'div',
                      { key: 'cinematics', className: 'flex flex-wrap mt-2' },
                      arc.cinematics.map((cinematic) =>
                        h(CinematicTag, { key: cinematic.id || cinematic.title, title: cinematic.title, trigger: cinematic.trigger })
                      )
                    )
                  : null,
                Array.isArray(arc.missions) && arc.missions.length
                  ? h(
                      'div',
                      { key: 'missions', className: 'space-y-3' },
                      arc.missions.map((mission) =>
                        h(
                          'div',
                          {
                            key: mission.id,
                            className: 'rounded-lg border border-yellow-700/30 bg-black/40 p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4'
                          },
                          [
                            h('div', { key: 'info', className: 'space-y-2 flex-1' }, [
                              h('div', { key: 'titleRow', className: 'flex items-center gap-3 flex-wrap' }, [
                                h('h3', { key: 'title', className: 'text-lg font-semibold text-yellow-100' }, mission.title),
                                h(MissionStatusBadge, { key: 'status', status: mission.status })
                              ]),
                              mission.objective
                                ? h('p', { key: 'objective', className: 'text-sm text-gray-200' }, mission.objective)
                                : null,
                              h(
                                'div',
                                { key: 'meta', className: 'text-xs text-gray-400 flex flex-wrap gap-3 uppercase tracking-wide' },
                                [
                                  mission.type ? h('span', { key: 'type' }, `Type: ${mission.type}`) : null,
                                  Number.isFinite(mission.recommendedLevel)
                                    ? h('span', { key: 'level' }, `Recommended Level ${mission.recommendedLevel}`)
                                    : null,
                                  mission.location ? h('span', { key: 'location' }, mission.location) : null
                                ].filter(Boolean)
                              ),
                              mission.cutscene && mission.cutscene.title
                                ? h(
                                    'p',
                                    { key: 'cutscene', className: 'text-xs text-purple-200/90 bg-purple-900/40 border border-purple-500/40 rounded px-2 py-1 inline-flex items-center gap-2' },
                                    [
                                      h('span', { key: 'icon' }, '🎬'),
                                      h('span', { key: 'label', className: 'font-semibold' }, mission.cutscene.title),
                                      mission.cutscene.description
                                        ? h('span', { key: 'desc', className: 'text-purple-100/70 normal-case' }, mission.cutscene.description)
                                        : null
                                    ]
                                  )
                                : null
                            ]),
                            h(
                              'div',
                              { key: 'actions', className: 'flex flex-col items-stretch gap-2 min-w-[160px]' },
                              [
                                mission.status === 'available' && typeof onMarkMissionComplete === 'function'
                                  ? h(
                                      'button',
                                      {
                                        key: 'complete',
                                        onClick: () => onMarkMissionComplete(mission.id),
                                        className:
                                          'px-3 py-2 rounded-lg bg-yellow-500 text-black font-semibold border border-yellow-300 hover:bg-yellow-400 transition-colors duration-200'
                                      },
                                      'Mark Mission Complete'
                                    )
                                  : null,
                                mission.status === 'completed'
                                  ? h('span', { key: 'done', className: 'text-sm text-green-300 text-center' }, 'Mission cleared')
                                  : null
                              ]
                            )
                          ]
                        )
                      )
                    )
                  : null,
                Array.isArray(arc.rewards) && arc.rewards.length
                  ? h(
                      'div',
                      { key: 'rewards', className: 'bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3' },
                      [
                        h('p', { key: 'label', className: 'text-xs font-semibold text-yellow-300 uppercase tracking-wide mb-1' }, 'Arc Rewards'),
                        h(
                          'ul',
                          { key: 'list', className: 'list-disc list-inside text-sm text-yellow-100 space-y-1' },
                          arc.rewards.map((reward, idx) => h('li', { key: `${arc.id}-reward-${idx}` }, reward))
                        )
                      ]
                    )
                  : null
              ]
            )
          )
        ),
        h(
          'div',
          { key: 'footer', className: 'flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-t border-yellow-500/40 bg-black/40' },
          [
            h(
              'button',
              {
                key: 'reset',
                onClick: handleReset,
                className:
                  'px-4 py-2 rounded-lg border border-red-600 text-red-300 hover:text-red-200 hover:border-red-400 bg-red-900/30 transition-colors duration-200'
              },
              'Reset Campaign Progress'
            ),
            h(
              'button',
              {
                key: 'closeFooter',
                onClick: onClose,
                className:
                  'px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold border border-yellow-300 hover:bg-yellow-400 transition-colors duration-200'
              },
              'Return to Main Menu'
            )
          ]
        )
      ]
    )
  );
};

export default CampaignPanel;
