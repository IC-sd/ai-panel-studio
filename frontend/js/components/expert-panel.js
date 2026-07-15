/* Expert panel — renders experts in a horizontal arc. */

const expertPanelComponent = {
  currentExperts: [],

  render(experts) {
    this.currentExperts = experts;
    const container = document.getElementById('experts-arc');
    container.innerHTML = '';
    if (!experts || experts.length === 0) return;

    // Sort: host first, then others
    const sorted = [...experts].sort((a, b) => {
      if (a.role === 'host') return -1;
      if (b.role === 'host') return 1;
      return a.speech_order - b.speech_order;
    });

    sorted.forEach(expert => {
      const div = document.createElement('div');
      div.className = `arc-expert ${expert.status}`;
      if (expert.role === 'host') div.classList.add('host');
      div.style.setProperty('--exp-color', expert.color_identity || '#818cf8');
      div.dataset.expertId = expert.id;

      const statusLabels = { standby: '待命', preparing: '准备中', ready: '待发言', speaking: '发言中', done: '已发言' };

      div.innerHTML = `
        <div class="arc-avatar">${expert.avatar_emoji || '🧑'}</div>
        <div class="arc-name">${this._escape(expert.name)}</div>
        <div class="arc-title">${expert.role === 'host' ? '<span class="arc-host-badge">🎙 主持人</span>' : this._escape(expert.field)}</div>
      `;
      container.appendChild(div);
    });
  },

  updateExpertStatus(data) {
    const { expert_id, status } = data;
    const expert = this.currentExperts.find(e => e.id === expert_id);
    if (!expert) return;
    if (status) expert.status = status;

    const el = document.querySelector(`.arc-expert[data-expert-id="${expert_id}"]`);
    if (!el) return;
    el.className = `arc-expert ${expert.status}`;
    if (expert.role === 'host') el.classList.add('host');
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
