/* Expert panel — positions seats around the round table. */
/* global api */

const expertPanelComponent = {
  currentExperts: [],

  render(experts) {
    this.currentExperts = experts;
    const container = document.getElementById('expert-seats');
    container.innerHTML = '';

    const rect = container.getBoundingClientRect();
    const cw = rect.width || (window.innerWidth - 240);
    const ch = rect.height || (window.innerHeight - 60);

    const cx = cw / 2;
    const cy = ch * 0.42;

    const maxBottom = ch - 40;
    const hostAngle = -Math.PI / 2;
    const maxRyByBottom = (maxBottom - cy) / Math.sin(Math.PI * 0.72);

    const rx = Math.min(cw * 0.43, 360);
    const ry = Math.min(Math.max(ch * 0.35, 200), maxRyByBottom, rx * 0.75);

    const n = experts.length;
    const hostIdx = experts.findIndex(e => e.role === 'host');

    experts.forEach((expert, i) => {
      let angle;
        if (hostIdx >= 0 && n > 1) {
          if (i === hostIdx) {
            angle = hostAngle;
          } else {
            const others = experts.filter((_, j) => j !== hostIdx);
            const otherIdx = others.indexOf(expert);
            const totalOthers = others.length;
            const arcStart = -Math.PI * 0.72;
            const arcEnd = Math.PI * 0.72;
            const step = totalOthers > 1 ? (arcEnd - arcStart) / (totalOthers - 1) : 0;
            angle = arcStart + step * otherIdx;
          }
        } else {
          angle = -Math.PI * 0.75 + (Math.PI * 1.5 * i) / Math.max(n, 1);
        }

        const x = cx + rx * Math.cos(angle);
        const y = Math.max(50, Math.min(ch - 50, cy + ry * Math.sin(angle)));

        const seat = document.createElement('div');
      seat.className = `expert-seat ${expert.status}`;
      if (expert.role === 'host') seat.classList.add('host-role');
      seat.style.cssText = `left:${x}px;top:${y}px;--seat-color:${expert.color_identity || '#818cf8'}`;
      seat.dataset.expertId = expert.id;

      seat.innerHTML = `
        <div class="seat-circle">${expert.avatar_emoji || '🧑'}</div>
        <div class="seat-label">${this._escape(expert.name)}</div>
        <div class="seat-role">${expert.role === 'host' ? '🎙 主持人' : this._escape(expert.field)}</div>
        <div class="seat-focus">${expert.focus_point ? this._escape(expert.focus_point) : ''}</div>
      `;
      container.appendChild(seat);
    });
  },

  updateExpertStatus(data) {
    const { expert_id, status, focus_point } = data;
    const expert = this.currentExperts.find(e => e.id === expert_id);
    if (!expert) return;

    if (status) expert.status = status;
    if (focus_point !== undefined) expert.focus_point = focus_point;

    const seat = document.querySelector(`.expert-seat[data-expert-id="${expert_id}"]`);
    if (!seat) return;

    seat.className = `expert-seat ${expert.status}`;
    if (expert.role === 'host') seat.classList.add('host-role');
    const focusEl = seat.querySelector('.seat-focus');
    if (focusEl) focusEl.textContent = expert.focus_point || '';
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
