import { lessons } from "@/lessons";
import { createModal } from "@/modal";

/* Router */
const views = Array.from(document.querySelectorAll('[data-view]'));
const navLinks = Array.from(document.querySelectorAll('[data-route]'));

function setActive(route) {
  views.forEach(v => v.hidden = true);
  const id = route === '/' ? 'home' : route.replace('/','');
  const el = document.getElementById(id) || document.getElementById('home');
  el.hidden = false;

  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${id === 'home' ? '' : id}`));
}

function onHashChange() {
  const route = location.hash.replace('#','') || '/';
  setActive(route);
}
window.addEventListener('hashchange', onHashChange);
onHashChange();

/* Lessons grid */
const grid = document.getElementById('lesson-grid');
function renderLessons() {
  const frag = document.createDocumentFragment();
  lessons.forEach((l, i) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.setAttribute('aria-haspopup', 'dialog');
    card.innerHTML = `
      <span class="badge">Lesson ${String(i+1).padStart(2,'0')}</span>
      <h3>${l.title}</h3>
      <p>${l.blurb}</p>
    `;
    card.addEventListener('click', () => {
      if (l.url) {
        const iframeHtml = `<iframe src="${l.url}?iframe=true" style="width: 100%; height: 100%; border: none;" title="${l.title}" allowfullscreen></iframe>`;
        const { el } = createModal({ title: l.title, html: iframeHtml });
        el.classList.add('modal-is-iframe');
      } else {
        createModal({ title: l.title, html: l.html });
      }
    });
    frag.appendChild(card);
  });
  grid.appendChild(frag);

  // update module count dynamically
  const countEl = document.getElementById('moduleCount');
  if (countEl) countEl.textContent = String(lessons.length);
}
renderLessons();