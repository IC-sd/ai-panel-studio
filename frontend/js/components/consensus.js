/* Consensus & divergence component. */
/* global api */

const consensusComponent = {
  renderConsensus(items) {
    const list = document.getElementById('consensus-list');
    const consensuses = items.filter(i => i.category === 'consensus');
    list.innerHTML = consensuses.length === 0
      ? '<div style="font-size:12px;color:var(--text-muted)">暂无共识</div>'
      : consensuses.map(c => `<div class="consensus-item">${this._escape(c.content)}</div>`).join('');
  },

  renderDivergence(items) {
    const list = document.getElementById('divergence-list');
    const divergences = items.filter(i => i.category === 'divergence');
    list.innerHTML = divergences.length === 0
      ? '<div style="font-size:12px;color:var(--text-muted)">暂无分歧</div>'
      : divergences.map(d => `<div class="consensus-item">${this._escape(d.content)}</div>`).join('');
  },

  addConsensusDivergence(item) {
    if (item.category === 'consensus') {
      const list = document.getElementById('consensus-list');
      const placeholder = list.querySelector('div[style]');
      if (placeholder) placeholder.remove();
      const el = document.createElement('div');
      el.className = 'consensus-item';
      el.textContent = item.content;
      list.appendChild(el);
    } else {
      const list = document.getElementById('divergence-list');
      const placeholder = list.querySelector('div[style]');
      if (placeholder) placeholder.remove();
      const el = document.createElement('div');
      el.className = 'consensus-item';
      el.textContent = item.content;
      list.appendChild(el);
    }
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
