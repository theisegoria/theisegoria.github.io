'use strict';
let stage = 0;
const stages = [
  {
    title: 'A finding and an inference, preserved together.',
    description:
      'Assistant A proposes a research checkpoint. The original result and the inference are separate records.',
    badge: 'Not recorded',
    action: 'Save the synthetic proposal',
    note: 'In the real app, record returns a durable proposal ID.',
  },
  {
    title: 'A person reviews what will be included.',
    description:
      'Both records are pending. Read the supplied passage, conditions, and assumption before accepting the proposal.',
    badge: 'Pending review',
    action: 'Accept this example proposal',
    note: 'This button simulates the local human-review workflow.',
  },
  {
    title: 'A fresh assistant recovers the context.',
    description:
      'Assistant B can retrieve the accepted records with their evidence and assumptions. The inference is still a hypothesis.',
    badge: 'Accepted for inclusion',
    action: 'Introduce conflicting evidence',
    note: 'Acceptance does not certify the proposition as true.',
  },
  {
    title: 'A challenge appears without erasing the history.',
    description:
      'A later proposal reports a different result under different conditions. It stays visible beside the original accepted finding.',
    badge: 'Accepted + pending challenge',
    action: 'Review and include the challenge',
    note: 'The original assessment will not change automatically.',
  },
];
const content = document.querySelector('#demo-content');
let challengeReviewed = false;
function card(kind, title, text, extra = '', state = 'pending') {
  const article = document.createElement('article');
  article.className = 'example-card';
  const top = document.createElement('div');
  top.className = 'example-card-top';
  const k = document.createElement('span');
  k.textContent = kind;
  const badge = document.createElement('span');
  badge.className = 'pill ' + state;
  badge.textContent = state;
  top.append(k, badge);
  const h = document.createElement('h4');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = text;
  article.append(top, h, p);
  if (extra) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Inspect evidence and assumptions';
    const body = document.createElement('p');
    body.className = 'example-source';
    body.textContent = extra;
    detail.append(summary, body);
    article.append(detail);
  }
  return article;
}
function render() {
  const s = stages[stage];
  document.querySelector('#stage-title').textContent = s.title;
  document.querySelector('#stage-description').textContent = s.description;
  document.querySelector('#state-badge').textContent = challengeReviewed
    ? 'Challenge included · history retained'
    : s.badge;
  document.querySelector('#advance').textContent = challengeReviewed
    ? 'Restart the example'
    : s.action;
  document.querySelector('#action-note').textContent = s.note;
  content.replaceChildren();
  const state = stage < 2 ? 'pending' : 'accepted';
  content.append(
    card(
      'REPORTED FINDING',
      'The synthetic study reports better next-day recall.',
      'In a fictional experiment, an eight-hour sleep opportunity was associated with better word recall than a four-hour opportunity.',
      'Source: fictional research notebook, results paragraph 1. Population: 60 simulated adults. Conditions: controlled word-list task. This is demonstration data, not a scientific finding.',
      state,
    ),
  );
  content.append(
    card(
      'HYPOTHESIS',
      'Protecting sleep may help retain newly learned words.',
      'A conditional inference from the reported result—not an established fact.',
      'Premise: the synthetic reported finding. Assumptions: word-list recall approximates vocabulary retention; the fictional association would generalize to real language learning. Assessment: unassessed.',
      state,
    ),
  );
  if (stage === 3)
    content.append(
      card(
        'CHALLENGE',
        'A second fictional result finds no benefit.',
        'Simulated older adults showed no recall benefit under a noisy testing condition. The population and conditions differ.',
        'Source: a second fictional notebook. Relationship: challenges the generalization. The original accepted revision remains available. No automatic refutation occurs.',
        challengeReviewed ? 'accepted' : 'pending',
      ),
    );
  const history = [];
  if (stage >= 1) history.push('Revision event 1 · Assistant A recorded a pending proposal.');
  if (stage >= 2)
    history.push('Revision event 2 · Human review accepted inclusion; hypothesis retained.');
  if (stage >= 3) history.push('Revision event 3 · Assistant B recorded a pending challenge.');
  if (challengeReviewed)
    history.push(
      'Revision event 4 · Human review included the challenge. Original revision retained.',
    );
  const timeline = document.querySelector('#timeline');
  timeline.replaceChildren();
  for (const text of history.length ? history : ['No recorded changes in this example yet.']) {
    const li = document.createElement('li');
    li.textContent = text;
    timeline.append(li);
  }
  for (const button of document.querySelectorAll('[data-stage]')) {
    button.classList.toggle('active', Number(button.dataset.stage) === stage);
    button.setAttribute('aria-current', Number(button.dataset.stage) === stage ? 'step' : 'false');
  }
}
for (const button of document.querySelectorAll('[data-stage]'))
  button.addEventListener('click', () => {
    stage = Number(button.dataset.stage);
    challengeReviewed = false;
    render();
  });
document.querySelector('#advance').addEventListener('click', () => {
  if (challengeReviewed) {
    stage = 0;
    challengeReviewed = false;
  } else if (stage < 3) stage++;
  else challengeReviewed = true;
  render();
});
document.querySelector('#reset').addEventListener('click', () => {
  stage = 0;
  challengeReviewed = false;
  render();
});
document.querySelector('#copy-install').addEventListener('click', async () => {
  const button = document.querySelector('#copy-install');
  try {
    await navigator.clipboard.writeText(document.querySelector('#install-command').textContent);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Select text to copy';
  }
});
render();
