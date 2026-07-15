/* Expert panel — renders experts in a flex row with arc transforms. */

const expertPanelComponent = {
  currentExperts: [],

  render(experts) {
    this.currentExperts = experts;
    const container = document.getElementById('experts-arc');
    container.innerHTML = '';
    if (!experts || experts.length === 0) return;

    // Sort: host first, then by speech_order
    const sorted = [...experts].sort((a, b) => {
      if (a.role === 'host') return -1;
      if (b.role === 'host') return 1;
      return a.speech_order - b.speech_order;
    });

    const n = sorted.length;

    sorted.forEach((expert, i) => {
      // Calculate angle along a sine curve: center lowest, edges higher
      // Normalize i to [-1, 1] range
      const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0; // -1 to 1
      const arcAngle = t * 18; // degrees of tilt
      const yOffset = -Math.abs(t) * 14; // center experts sit lower (closer to table)

      const div = document.createElement('div');
      div.className = `arc-expert ${expert.status}`;
      if (expert.role === 'host') div.classList.add('host');
      div.style.setProperty('--exp-color', expert.color_identity || '#818cf8');
      div.dataset.expertId = expert.id;
      div.style.transform = `rotate(${arcAngle}deg) translateY(${yOffset}px)`;

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
