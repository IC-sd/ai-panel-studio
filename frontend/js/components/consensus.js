/* Consensus component — renders summary items. */

const consensusComponent = {
  renderConsensus(items) {
    const container = document.getElementById('summary-consensus');
    const consensuses = items.filter(i => i.category === 'consensus');
    container.innerHTML = consensuses.length === 0
      ? '<div class="summary-empty">暂无共识</div>'
      : consensuses.map(c => `<div class="summary-item">${this._escape(c.content)}</div>`).join('');
  },

  renderDivergence(items) {
    const container = document.getElementById('summary-divergence');
    const divergences = items.filter(i => i.category === 'divergence');
    container.innerHTML = divergences.length === 0
      ? '<div class="summary-empty">暂无分歧</div>'
      : divergences.map(d => `<div class="summary-item">${this._escape(d.content)}</div>`).join('');
  },

  addConsensusDivergence(item) {
    const id = item.category === 'consensus' ? 'summary-consensus' : 'summary-divergence';
    const container = document.getElementById(id);
    const empty = container.querySelector('.summary-empty');
    if (empty) empty.remove();
    const el = document.createElement('div');
    el.className = 'summary-item';
    el.textContent = item.content;
    container.appendChild(el);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
