export function createModal({ title, html }) {
  const root = document.createElement('div');
  root.className = 'modal-backdrop';
  root.role = 'dialog';
  root.ariaModal = 'true';

  root.innerHTML = `
    <div class="modal" role="document">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" aria-label="Close">Close</button>
      </div>
      <div class="modal-body">${html}</div>
    </div>
  `;

  const closeBtn = root.querySelector('.modal-close');
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    root.remove();
    lastFocus?.focus();
  };

  let lastFocus = document.activeElement;
  closeBtn.addEventListener('click', close);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.addEventListener('keydown', onKey);

  document.getElementById('modal-root').appendChild(root);
  closeBtn.focus();
  return { close, el: root };
}

