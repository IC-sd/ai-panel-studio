/* Main application controller. */
/* global api, homeComponent, studio */

const app = {
  currentView: 'home',
  currentDiscussionId: null,

  async init() {
    // Load discussions on startup
    await homeComponent.loadDiscussions();
    this.updateConnectionStatus(true);

    // Check SSE connection by pinging the API
    this.checkServerHealth();
  },

  async checkServerHealth() {
    try {
      await api.listDiscussions();
      this.updateConnectionStatus(true);
    } catch {
      this.updateConnectionStatus(false);
    }
    setTimeout(() => this.checkServerHealth(), 15000);
  },

  updateConnectionStatus(connected) {
    const el = document.getElementById('connection-status');
    const dot = el.querySelector('.status-dot');
    if (connected) {
      dot.className = 'status-dot connected';
      el.querySelector('span:last-child').textContent = '已连接';
    } else {
      dot.className = 'status-dot disconnected';
      el.querySelector('span:last-child').textContent = '未连接';
    }
  },

  navigate(view) {
    if (view === this.currentView) return;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navEl) navEl.classList.add('active');

    // Update view
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    this.currentView = view;

    if (view === 'home') {
      homeComponent.loadDiscussions();
    }
  },

  async openDiscussion(discussionId) {
    this.currentDiscussionId = discussionId;

    // Show studio nav
    document.getElementById('nav-studio').style.display = 'flex';

    // Navigate to studio
    this.navigate('studio');
    await studio.enter(discussionId);
  },

  showCreateDialog() {
    document.getElementById('dialog-overlay').style.display = 'flex';
    document.getElementById('topic-input').value = '';
    document.getElementById('expert-count-display').textContent = '4';
    document.getElementById('dialog-error').style.display = 'none';
    document.getElementById('btn-create-discussion').disabled = false;
  },

  hideCreateDialog() {
    document.getElementById('dialog-overlay').style.display = 'none';
  },

  incrementExpertCount() {
    const display = document.getElementById('expert-count-display');
    const count = Math.min(8, parseInt(display.textContent) + 1);
    display.textContent = count;
  },

  decrementExpertCount() {
    const display = document.getElementById('expert-count-display');
    const count = Math.max(2, parseInt(display.textContent) - 1);
    display.textContent = count;
  },

  async createDiscussion() {
    const topic = document.getElementById('topic-input').value.trim();
    const expertCount = parseInt(document.getElementById('expert-count-display').textContent);
    const btn = document.getElementById('btn-create-discussion');

    if (!topic) {
      this.showDialogError('请输入讨论议题');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ 生成中...';

    try {
      const disc = await api.createDiscussion(topic, expertCount);
      this.hideCreateDialog();
      this.showToast('讨论创建成功', 'success');

      // Refresh home list
      await homeComponent.loadDiscussions();

      // Open the new discussion in studio
      await this.openDiscussion(disc.id);
    } catch (err) {
      this.showDialogError('创建失败：' + err.message);
      btn.disabled = false;
      btn.textContent = '✨ 生成专家阵容';
    }
  },

  showDialogError(msg) {
    const el = document.getElementById('dialog-error');
    el.textContent = msg;
    el.style.display = 'block';
  },

  showToast(message, type = 'info') {
    studio.showToast(message, type);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => app.init());
