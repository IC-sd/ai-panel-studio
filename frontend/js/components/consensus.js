/* Consensus & divergence component. */
/* global api */

const consensusComponent = {
  renderConsensus(items) {
    const list = document.getElementById('cf-consensus');
    const consensuses = items.filter(i => i.category === 'consensus');
    list.innerHTML = consensuses.length === 0
      ? '<div style="font-size:11px;color:var(--text-muted)">暂无</div>'
      : consensuses.map(c => `<div class="consensus-item">${this._escape(c.content)}</div>`).join('');
  },

  renderDivergence(items) {
    const list = document.getElementById('cf-divergence');
    const divergences = items.filter(i => i.category === 'divergence');
    list.innerHTML = divergences.length === 0
      ? '<div style="font-size:11px;color:var(--text-muted)">暂无</div>'
      : divergences.map(d => `<div class="consensus-item">${this._escape(d.content)}</div>`).join('');
  },

  addConsensusDivergence(item) {
    const listId = item.category === 'consensus' ? 'cf-consensus' : 'cf-divergence';
    const list = document.getElementById(listId);
    const placeholder = list.querySelector('div[style]');
    if (placeholder) placeholder.remove();
    const el = document.createElement('div');
    el.className = 'consensus-item';
    el.textContent = item.content;
    list.appendChild(el);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
