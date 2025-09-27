import React from 'react';
import { applyQuestRewards } from '/src/game/quests.js';

const QuestLogPanel = ({
  quests,
  setQuests,
  onClose,
  setPlayerStats,
  setInventory,
  addExperience
}) => {
  const h = React.createElement;
  const [filter, setFilter] = React.useState('active'); // 'active' | 'available' | 'completed' | 'all'

  const updateQuest = (id, patch) => {
    setQuests(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)));
  };

  const acceptQuest = (q) => updateQuest(q.id, { status: 'active' });
  const abandonQuest = (q) => updateQuest(q.id, { status: 'available' });
  const markComplete = (q) => updateQuest(q.id, { status: 'completed' });
  const claimRewards = (q) => {
    try {
      applyQuestRewards(q.rewards, { setPlayerStats, setInventory, addExperience });
    } finally {
      updateQuest(q.id, { status: 'claimed' });
    }
  };

  const filtered = quests.filter(q => {
    if (filter === 'all') return true;
    return (q.status || 'available') === filter;
  });

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    const color = s === 'active' ? 'bg-blue-600' : s === 'completed' ? 'bg-green-600' : s === 'claimed' ? 'bg-gray-600' : 'bg-yellow-600';
    return h('span', { className: `text-xs ${color} text-white px-2 py-0.5 rounded` }, status);
  };

  const TrackBadge = ({ track }) => {
    const t = (track || '?').toUpperCase();
    const colors = { D: 'bg-gray-700', C: 'bg-teal-700', B: 'bg-purple-700', A: 'bg-red-700', S: 'bg-yellow-700' };
    return h('span', { className: `text-xs ${colors[t] || 'bg-gray-700'} text-white px-1.5 py-0.5 rounded` }, t);
  };

  const filters = [
    { key: 'active', label: 'Active' },
    { key: 'available', label: 'Available' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' }
  ];

  return h(
    'div',
    { className: 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm' },
    h(
      'div',
      {
        className: 'bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 border-4 border-yellow-500 rounded-xl shadow-2xl relative overflow-hidden flex flex-col',
        style: { width: 'min(900px, 95vw)', height: 'min(700px, 95vh)' }
      },
      [
        // Corners
        h('div', { key: 'c1', className: 'absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-yellow-300 rounded-tl-lg' }),
        h('div', { key: 'c2', className: 'absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-yellow-300 rounded-tr-lg' }),
        h('div', { key: 'c3', className: 'absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-yellow-300 rounded-bl-lg' }),
        h('div', { key: 'c4', className: 'absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-yellow-300 rounded-br-lg' }),

        // Header
        h(
          'div',
          { key: 'hdr', className: 'flex justify-between items-center p-6 border-b-2 border-yellow-600 flex-shrink-0' },
          [
            h('h1', { key: 't', className: 'text-3xl font-bold text-yellow-200 font-serif tracking-wider drop-shadow-lg' }, 'QUEST LOG'),
            h(
              'button',
              {
                key: 'x',
                onClick: onClose,
                className: 'text-red-400 hover:text-red-300 text-3xl font-bold bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center border-2 border-red-500 hover:border-red-400 transition-all duration-200',
                'aria-label': 'Close Quest Log'
              },
              '×'
            )
          ]
        ),

        // Content
        h(
          'div',
          { key: 'body', className: 'flex-1 p-6 overflow-y-auto' },
          [
            // Filters
            h(
              'div',
              { key: 'flt', className: 'mb-4 flex gap-2' },
              filters.map(t =>
                h(
                  'button',
                  {
                    key: t.key,
                    onClick: () => setFilter(t.key),
                    className: `px-3 py-1 rounded border ${filter === t.key ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-black/50 text-yellow-200 border-yellow-500'}`
                  },
                  t.label
                )
              )
            ),

            // List
            h(
              'div',
              { key: 'lst', className: 'space-y-3' },
              [
                ...filtered.map(q =>
                  h(
                    'div',
                    { key: q.id, className: 'bg-gray-900/50 border border-yellow-600 rounded-lg p-4' },
                    h(
                      'div',
                      { className: 'flex items-start justify-between gap-4' },
                      [
                        h(
                          'div',
                          { key: 'left' },
                          [
                            h(
                              'div',
                              { className: 'flex items-center gap-2 mb-1' },
                              [
                                h(TrackBadge, { key: 'tb', track: q.track }),
                                h('h3', { key: 'ti', className: 'text-lg font-bold text-yellow-200' }, q.title),
                                h(StatusBadge, { key: 'sb', status: q.status })
                              ]
                            ),
                            h('p', { className: 'text-sm text-yellow-100/90' }, q.description),
                            h(
                              'div',
                              { className: 'mt-2 text-xs text-gray-300' },
                              [
                                'Rewards:\u00A0',
                                Array.isArray(q.rewards)
                                  ? q.rewards.map((r, idx) => {
                                      if (!r) return null;
                                      if (r.type === 'xp') return h('span', { key: `r${idx}`, className: 'mr-2' }, `✨ ${r.amount} XP`);
                                      if (r.type === 'gold') return h('span', { key: `r${idx}`, className: 'mr-2' }, `🪙 ${r.amount} Gold`);
                                      if (r.type === 'item') return h('span', { key: `r${idx}`, className: 'mr-2' }, `${r.item?.icon || '🎁'} ${r.item?.name || 'Item'}`);
                                      if (r.type === 'upgrade') return h('span', { key: `r${idx}`, className: 'mr-2' }, `🔧 Upgrade ${r.slot}`);
                                      return null;
                                    })
                                  : null
                              ]
                            )
                          ]
                        ),
                        h(
                          'div',
                          { key: 'right', className: 'flex flex-col gap-2' },
                          [
                            q.status === 'available' &&
                              h(
                                'button',
                                { className: 'px-3 py-1 rounded bg-yellow-500 text-black border-2 border-yellow-300', onClick: () => acceptQuest(q) },
                                'Accept'
                              ),
                            q.status === 'active' && [
                              h(
                                'button',
                                { key: 'mc', className: 'px-3 py-1 rounded bg-blue-500 text-black border-2 border-blue-300', onClick: () => markComplete(q) },
                                'Mark Complete'
                              ),
                              h(
                                'button',
                                { key: 'ab', className: 'px-3 py-1 rounded bg-gray-800 text-yellow-200 border-2 border-gray-600', onClick: () => abandonQuest(q) },
                                'Abandon'
                              )
                            ],
                            q.status === 'completed' &&
                              h(
                                'button',
                                { className: 'px-3 py-1 rounded bg-green-500 text-black border-2 border-green-300', onClick: () => claimRewards(q) },
                                'Claim Rewards'
                              ),
                            q.status === 'claimed' && h('span', { className: 'text-sm text-green-300' }, 'Rewards claimed')
                          ]
                        )
                      ]
                    )
                  )
                ),
                filtered.length === 0 && h('div', { key: 'empty', className: 'text-center text-gray-300' }, 'No quests found.')
              ]
            )
          ]
        )
      ]
    )
  );
};

export default QuestLogPanel;

