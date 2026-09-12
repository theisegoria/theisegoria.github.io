'use strict';
let stage = 0;
const stages = [
  {
    title: "観察結果と推論が、共に保持されている。",
    description:
      "アシスタントAは研究チェックポイントを提案する。元の結果と推論は別々の記録である。",
    badge: "記録されない",
    action: "合成提案を保存",
    note: "実際のアプリでは、記録は持続可能な提案IDを返す。",
  },
  {
    title: "人が含まれる内容を確認する。",
    description:
      "両方の記録は未承認。提案を承認する前に、提供された文章、条件、仮定を読み直すこと。",
    badge: "承認待ち",
    action: "この例の提案を承認します",
    note: "このボタンはローカルでの人間によるレビューフローをシミュレートします。",
  },
  {
    title: "新しいアシスタントはコンテキストを再取得します。",
    description:
      "アシスタントBは、承認された記録とともにその証拠と仮定を取得できます。その推論は依然として仮説です。",
    badge: "承認して含める",
    action: "対立する証拠を導入",
    note: "承認はその主張が真であることを保証しません。",
  },
  {
    title: "挑戦が現れても、その歴史は消されません。",
    description:
      "後の提案は異なる条件下で異なる結果を報告します。元の承認された結果の隣にその結果は常に表示されます。",
    badge: "承認 + 待機中の挑戦",
    action: "挑戦を検討して含める",
    note: "元の評価は自動で変更されません。",
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
  badge.textContent = ({pending:'確認待ち',accepted:'採用済み'})[state] || state;
  top.append(k, badge);
  const h = document.createElement('h4');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = text;
  article.append(top, h, p);
  if (extra) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = "証拠と仮定を検証";
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
    ? "挑戦が含められた · 歴史は保持"
    : s.badge;
  document.querySelector('#advance').textContent = challengeReviewed
    ? "例を再開始"
    : s.action;
  document.querySelector('#action-note').textContent = s.note;
  content.replaceChildren();
  const state = stage < 2 ? 'pending' : 'accepted';
  content.append(
    card(
      "報告された結果",
      "合成研究は翌日記憶の維持において優れた結果を示した。",
      "仮想の実験では、8時間の睡眠機会が4時間の機会よりも語彙の記憶を良くする関連性があると報告されている。",
      "出典：フィクションの研究ノート、結果段落1。対象：60人のシミュレートされた成人。条件：制御された語リストタスク。これは示唆データであり、科学的発見ではない。",
      state,
    ),
  );
  content.append(
    card(
      "仮説",
      "睡眠を守ることで、新たに学習した語を記憶できる可能性がある。",
      "報告された結果から導かれた条件付きの推論であり、確立された事実ではない。",
      'Premise: the synthetic reported finding. Assumptions: word-list recall approximates vocabulary retention; the fictional association would generalize to real language learning. Assessment: unassessed.',
      state,
    ),
  );
  if (stage === 3)
    content.append(
      card(
        "課題",
        "別のフィクションの結果では効果が見られない。",
        "シミュレートされた高齢成人において、ノイズのあるテスト条件下では記憶の維持効果が見られなかった。対象群および条件は異なる。",
        "出典：2つ目のフィクションノート。関係：一般化を否定する。元の承認された修正は依然として利用可能。自動的な否定は発生しない。",
        challengeReviewed ? 'accepted' : 'pending',
      ),
    );
  const history = [];
  if (stage >= 1) history.push("修正イベント1 · アシスタントAが未承認の提案を記録した。");
  if (stage >= 2)
    history.push('Revision event 2 · Human review accepted inclusion; hypothesis retained.');
  if (stage >= 3) history.push("修正イベント3 · アシスタントBが未承認の課題を記録した。");
  if (challengeReviewed)
    history.push(
      "修正イベント4 · 人間によるレビューで課題が含まれた。元の修正は維持された。",
    );
  const timeline = document.querySelector('#timeline');
  timeline.replaceChildren();
  for (const text of history.length ? history : ["この例ではまだ記録された変更はない。"]) {
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
    button.textContent = "コピーしました";
  } catch {
    button.textContent = "コピーしたいテキストを選択";
  }
});
render();
