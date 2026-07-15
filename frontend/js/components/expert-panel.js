/* Expert panel component. */
/* global api */

const expertPanelComponent = {
  currentExperts: [],

  render(experts) {
    this.currentExperts = experts;
    const grid = document.getElementById('expert-grid');
    grid.innerHTML = experts.map(e => this._cardHTML(e)).join('');
  },

  _cardHTML(expert) {
    const statusLabels = {
      standby: '待命中', preparing: '准备发言', ready: '待发言',
      speaking: '发言中', done: '已发言',
    };
    const color = expert.color_identity || '#6366f1';

    return `<div class="expert-card status-${expert.status}" style="--expert-color:${color}">
      <div class="expert-avatar">
        <div class="avatar-emoji" style="background:${color}22">${expert.avatar_emoji || '🧑'}</div>
        <div>
          <div class="expert-name">${this._escape(expert.name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${this._escape(expert.occupation)}</div>
        </div>
        ${expert.role === 'host' ? '<span class="expert-role-badge">🎙 主持人</span>' : ''}
      </div>
      <div class="expert-title">${this._escape(expert.title)}</div>
      <div class="expert-field">📌 ${this._escape(expert.field)}</div>
      <div class="expert-tags">
        ${(expert.persona_tags || []).map(t => `<span class="expert-tag">${this._escape(t)}</span>`).join('')}
      </div>
      <div class="expert-status-line">
        <span class="status-indicator ${expert.status}"></span>
        <span>${statusLabels[expert.status] || '待命中'}</span>
        ${expert.focus_point ? `<span style="color:var(--text-muted);margin-left:auto;font-size:11px">${this._escape(expert.focus_point)}</span>` : ''}
      </div>
    </div>`;
  },

  updateExpertStatus(data) {
    const { expert_id, status, focus_point, public_thought } = data;
    const expert = this.currentExperts.find(e => e.id === expert_id);
    if (!expert) return;

    expert.status = status || expert.status;
    if (focus_point !== undefined) expert.focus_point = focus_point;
    if (public_thought !== undefined) expert.public_thought = public_thought;

    // Update the card in DOM
    const grid = document.getElementById('expert-grid');
    const cards = grid.querySelectorAll('.expert-card');
    const idx = this.currentExperts.indexOf(expert);
    if (idx >= 0 && cards[idx]) {
      cards[idx].outerHTML = this._cardHTML(expert);
    }
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
