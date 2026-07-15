/* Studio view — manages the round-table discussion. */
/* global api, SSEClient, expertPanelComponent, consensusComponent */

const studio = {
  currentDiscussionId: null,
  currentDiscussion: null,
  sseClient: null,
  currentExperts: [],
  currentTranscript: [],
  currentConsensusDivergence: [],

  async enter(discussionId) {
    this.currentDiscussionId = discussionId;
    this.resetUI();

    try {
      const data = await api.getDiscussion(discussionId);
      this.currentDiscussion = data;
      this.currentExperts = data.experts || [];
      this.currentTranscript = data.transcript || [];
      this.currentConsensusDivergence = data.consensus_divergence || [];

      document.getElementById('studio-topic').textContent = '🎙 ' + (data.topic || '');
      expertPanelComponent.render(this.currentExperts);
      consensusComponent.renderConsensus(this.currentConsensusDivergence);
      consensusComponent.renderDivergence(this.currentConsensusDivergence);
      this.renderTranscript();
      this.updateStatusBadge(data.status);
      this.connectSSE();
    } catch (err) {
      this.showToast('加载讨论失败：' + err.message, 'error');
    }
  },

  connectSSE() {
    if (this.sseClient) this.sseClient.disconnect();
    this.sseClient = new SSEClient(this.currentDiscussionId, {
      onStatus: (data) => { this.updateStatusBadge(data.status); },
      onExpertsGenerated: (data) => {
        this.currentExperts = data.experts || [];
        expertPanelComponent.render(this.currentExperts);
      },
      onExpertStatus: (data) => { expertPanelComponent.updateExpertStatus(data); },
      onTranscript: (data) => { this.addTranscriptEntry(data); },
      onConsensusDivergence: (data) => {
        this.currentConsensusDivergence.push(data);
        consensusComponent.addConsensusDivergence(data);
      },
      onError: (data) => { this.showToast(data.message || '发生错误', 'error'); },
    });
    this.sseClient.connect();
  },

  resetUI() {
    document.getElementById('studio-topic').textContent = '加载中...';
    document.getElementById('experts-arc').innerHTML = '';
    document.getElementById('transcript-scroll').innerHTML =
      '<div class="transcript-placeholder">🎙 讨论尚未开始...</div>';
    document.getElementById('summary-consensus').innerHTML = '';
    document.getElementById('summary-divergence').innerHTML = '';
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('btn-pause').style.display = 'none';
    document.getElementById('btn-resume').style.display = 'none';
  },

  updateStatusBadge(status) {
    const badge = document.getElementById('discussion-status-badge');
    const labels = { pending: '待开始', preparing: '准备中', active: '讨论中', paused: '已暂停', completed: '已结束' };
    badge.textContent = labels[status] || status;
    badge.className = 'status-badge ' + status;
    document.getElementById('btn-start').style.display = status === 'pending' ? 'inline-flex' : 'none';
    document.getElementById('btn-pause').style.display = status === 'active' ? 'inline-flex' : 'none';
    document.getElementById('btn-resume').style.display = status === 'paused' ? 'inline-flex' : 'none';
  },

  async startDiscussion() {
    try {
      await api.startDiscussion(this.currentDiscussionId);
      this.updateStatusBadge('active');
      this.showToast('圆桌讨论已开始', 'success');
    } catch (err) {
      this.showToast('启动失败：' + err.message, 'error');
    }
  },

  async pauseDiscussion() {
    try { await api.pauseDiscussion(this.currentDiscussionId); this.updateStatusBadge('paused'); }
    catch (err) { this.showToast('暂停失败：' + err.message, 'error'); }
  },

  async resumeDiscussion() {
    try { await api.resumeDiscussion(this.currentDiscussionId); this.updateStatusBadge('active'); }
    catch (err) { this.showToast('恢复失败：' + err.message, 'error'); }
  },

  addTranscriptEntry(entry) {
    const area = document.getElementById('transcript-scroll');
    const ph = area.querySelector('.transcript-placeholder');
    if (ph) ph.remove();

    const div = document.createElement('div');
    div.className = 'transcript-entry';
    if (entry.entry_type === 'system') div.classList.add('entry-system');
    if (entry.entry_type === 'summary') div.classList.add('entry-summary');

    const expert = this.currentExperts.find(e => e.id === entry.expert_id);
    const color = expert ? (expert.color_identity || '#818cf8') : '#818cf8';
    const time = entry.created_at
      ? new Date(entry.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '';

    const label = entry.entry_type === 'system' ? '' :
      `<span class="entry-speaker">${this._escape(entry.speaker_name)}</span>
       <span class="entry-title">${this._escape(entry.speaker_title)}</span>
       ${entry.entry_type === 'summary' ? '<span style="font-size:11px;color:var(--accent)">📋 总结</span>' : ''}`;

    div.style.setProperty('--entry-color', color);
    div.innerHTML = `<div class="entry-header">${label}</div>
      <div class="entry-content">${this._escape(entry.content)}</div>
      <div class="entry-time">${time}</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  },

  renderTranscript() {
    const area = document.getElementById('transcript-scroll');
    if (this.currentTranscript.length === 0) {
      area.innerHTML = '<div class="transcript-placeholder">🎙 讨论尚未开始...</div>';
      return;
    }
    area.innerHTML = '';
    this.currentTranscript.forEach(e => this.addTranscriptEntry(e));
    // Ensure scroll is at bottom after render
    requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
  },

  showToast(msg, type = 'info') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
