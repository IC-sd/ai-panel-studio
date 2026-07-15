/* Home discussion list component. */
/* global api */

const homeComponent = {
  currentDiscussions: [],

  async loadDiscussions() {
    const list = document.getElementById('discussion-list');
    list.innerHTML = '<div class="loading">加载中...</div>';

    try {
      this.currentDiscussions = await api.listDiscussions();
      this.render();
    } catch (err) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📡</div>
        <p>无法连接服务器：${err.message}</p>
        <p style="font-size:12px;margin-top:8px">请确认后端服务已启动</p>
      </div>`;
    }
  },

  render() {
    const list = document.getElementById('discussion-list');

    if (this.currentDiscussions.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎙️</div>
        <h3 style="margin-bottom:8px">还没有讨论</h3>
        <p>点击上方「新建讨论」开始一场AI圆桌对话</p>
      </div>`;
      return;
    }

    list.innerHTML = this.currentDiscussions.map(d => {
      const statusClass = `status-${d.status}`;
      const statusLabels = {
        pending: '待开始', preparing: '准备中', active: '进行中',
        paused: '已暂停', completed: '已完成',
      };

      return `<div class="discussion-card" onclick="app.openDiscussion('${d.id}')">
        <div class="card-title">${this._escape(d.topic)}</div>
        <div class="card-meta">
          <span>👥 ${d.expert_count} 位专家</span>
          <span class="card-status ${statusClass}">${statusLabels[d.status] || d.status}</span>
        </div>
        <div class="card-footer">
          <span>🕐 ${this._formatTime(d.created_at)}</span>
          <span>${d.host_summary ? '✅ 已总结' : ''}</span>
        </div>
      </div>`;
    }).join('');
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  _formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hour}:${min}`;
  },
};
