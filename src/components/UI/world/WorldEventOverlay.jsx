import React from 'react';

const STATUS_COPY = {
  ready: 'Prepare to deploy resources before returning to the field.',
  loading: 'Coordinating assets and updating the village layout…',
  error: 'The staging pipeline failed. You can retry or dismiss to continue without this event.'
};

function formatBuffs(buffs) {
  const entries = Object.entries(buffs || {});
  return entries.map(([key, value]) => {
    if (typeof value === 'number') {
      const pct = Math.round((value - 1) * 100);
      const sign = pct >= 0 ? '+' : '';
      return `${key}: ${sign}${pct}%`;
    }
    return `${key}: ${String(value)}`;
  });
}

export function WorldEventOverlay({ overlay, onConfirm, onDismiss }) {
  if (!overlay || !overlay.event) return null;
  const { event, status, progress } = overlay;
  const buffs = formatBuffs(event.buffs || {});
  const buttonsDisabled = status === 'loading';
  const h = React.createElement;

  return h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center' },
    h('div', { className: 'absolute inset-0 bg-black bg-opacity-70 backdrop-blur', 'aria-hidden': 'true' }),
    h('div', { className: 'relative w-[min(600px,90vw)] bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-2xl p-6 text-white space-y-4' },
      h('div', { className: 'flex items-start justify-between gap-4' },
        h('div', null,
          h('h2', { className: 'text-2xl font-bold text-yellow-300' }, event.label),
          h('p', { className: 'text-sm text-yellow-100/90 mt-1' }, event.description)
        ),
        h('span', { className: 'px-3 py-1 rounded-full text-sm bg-yellow-600/30 border border-yellow-600 uppercase tracking-wide' }, event.type)
      ),
      (buffs.length > 0) && h('div', { className: 'bg-black/40 border border-yellow-700 rounded-lg p-3' },
        h('h3', { className: 'text-sm font-semibold text-yellow-200 uppercase tracking-wide mb-1' }, 'Temporary Buffs'),
        h('ul', { className: 'text-sm list-disc list-inside space-y-0.5 text-yellow-100' },
          buffs.map((line) => h('li', { key: line }, line))
        )
      ),
      (event.worldStatePatch && Object.keys(event.worldStatePatch).length > 0) && h('div', { className: 'bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-gray-200' },
        h('div', { className: 'font-semibold uppercase tracking-wide text-gray-300 mb-1' }, 'World State Changes'),
        h('ul', { className: 'list-disc list-inside space-y-0.5' },
          Object.entries(event.worldStatePatch).map(([key, value]) => h('li', { key }, `${key}: ${String(value)}`))
        )
      ),
      h('div', { className: 'bg-black/20 border border-gray-800 rounded-lg p-3 text-sm text-gray-300' }, STATUS_COPY[status] || STATUS_COPY.ready),
      (status === 'loading') && h('div', null,
        h('div', { className: 'w-full bg-gray-800 h-2 rounded-full overflow-hidden' },
          h('div', { className: 'h-full bg-yellow-400 transition-all duration-200', style: { width: `${Math.min(100, progress || 0)}%` } })
        ),
        h('div', { className: 'text-xs text-gray-400 mt-1' }, `${Math.min(100, Math.round(progress || 0))}%`)
      ),
      (status === 'error' && overlay.error) && h('div', { className: 'text-sm text-red-300 bg-red-900/30 border border-red-600 rounded-lg p-3' }, overlay.error && (overlay.error.message || 'Unknown error while preparing the event.')),
      h('div', { className: 'flex justify-end gap-2 pt-2' },
        h('button', { className: 'px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-sm hover:bg-gray-700', onClick: onDismiss, disabled: status === 'loading' }, status === 'error' ? 'Dismiss' : 'Skip'),
        (status !== 'loading') && h('button', { className: 'px-4 py-2 rounded-lg border border-yellow-400 bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400', onClick: onConfirm, disabled: buttonsDisabled }, status === 'error' ? 'Retry' : 'Begin Event'),
        (status === 'loading') && h('button', { className: 'px-4 py-2 rounded-lg border border-yellow-500 bg-yellow-600 text-black text-sm font-semibold', disabled: true }, 'Preparing…')
      )
    )
  );
}
