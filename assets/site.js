document.documentElement.classList.remove('no-js');

const root = document.documentElement;
const isJapanese = root.lang.toLowerCase().startsWith('ja');
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const storedTheme = localStorage.getItem('isegoria-theme');
const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function applyTheme(theme) {
  root.dataset.theme = theme;
  if (themeButton) {
    const next = theme === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', isJapanese
      ? `${next === 'dark' ? 'ダーク' : 'ライト'}テーマに切り替える`
      : `Switch to ${next} theme`);
    if (themeLabel) themeLabel.textContent = isJapanese
      ? (next === 'dark' ? '暗く' : '明るく')
      : next[0].toUpperCase() + next.slice(1);
  }
}

applyTheme(storedTheme || preferredTheme);

themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('isegoria-theme', next);
  applyTheme(next);
});

document.querySelectorAll('[data-language-select]').forEach((link) => {
  link.addEventListener('click', () => {
    localStorage.setItem('isegoria-language', link.dataset.languageSelect || 'en');
  });
});

const searchInput = document.querySelector('#publication-search');
const cards = [...document.querySelectorAll('.publication-card')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const visibleCount = document.querySelector('#visible-count');
const publicationWord = document.querySelector('#publication-word');
const noResults = document.querySelector('.no-results');
const clearButton = document.querySelector('#clear-search');
let activeFilter = 'all';

function updateLibrary() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  let count = 0;

  cards.forEach((card) => {
    const haystack = `${card.dataset.search || ''} ${card.textContent}`.toLowerCase();
    const tags = (card.dataset.tags || '').split(' ');
    const matchesSearch = !query || haystack.includes(query);
    const matchesFilter = activeFilter === 'all' || tags.includes(activeFilter);
    card.hidden = !(matchesSearch && matchesFilter);
    if (!card.hidden) count += 1;
  });

  if (visibleCount) visibleCount.textContent = String(count);
  if (publicationWord) publicationWord.textContent = isJapanese ? '冊' : (count === 1 ? 'publication' : 'publications');
  if (noResults) noResults.hidden = count !== 0;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    updateLibrary();
  });
});

searchInput?.addEventListener('input', updateLibrary);
clearButton?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  activeFilter = 'all';
  filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
  updateLibrary();
  searchInput?.focus();
});

const projectSearch = document.querySelector('#project-search');
const projectCards = [...document.querySelectorAll('[data-project]')];
const projectFilterButtons = [...document.querySelectorAll('[data-project-filter]')];
const projectVisibleCount = document.querySelector('#project-visible-count');
const repositoryWord = document.querySelector('#repository-word');
const projectNoResults = document.querySelector('.project-no-results');
const clearProjectButton = document.querySelector('#clear-project-search');
let activeProjectFilter = 'all';

function updateProjects() {
  const query = (projectSearch?.value || '').trim().toLowerCase();
  let count = 0;

  projectCards.forEach((card) => {
    const haystack = `${card.dataset.search || ''} ${card.textContent}`.toLowerCase();
    const tags = (card.dataset.tags || '').split(' ');
    const matchesSearch = !query || haystack.includes(query);
    const matchesFilter = activeProjectFilter === 'all' || tags.includes(activeProjectFilter);
    card.hidden = !(matchesSearch && matchesFilter);
    if (!card.hidden) count += 1;
  });

  if (projectVisibleCount) projectVisibleCount.textContent = String(count);
  if (repositoryWord) repositoryWord.textContent = isJapanese ? '件のリポジトリ' : (count === 1 ? 'repository' : 'repositories');
  if (projectNoResults) projectNoResults.hidden = count !== 0;
}

projectFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.projectFilter || 'all';
    projectFilterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    updateProjects();
  });
});

projectSearch?.addEventListener('input', updateProjects);
clearProjectButton?.addEventListener('click', () => {
  if (projectSearch) projectSearch.value = '';
  activeProjectFilter = 'all';
  projectFilterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.projectFilter === 'all')));
  updateProjects();
  projectSearch?.focus();
});

const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
