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

      // Set topic
      document.getElementById('studio-topic').textContent = '🎙 ' + (data.topic || '');

      // Render experts around the table
      expertPanelComponent.render(this.currentExperts);
      // Re-render after a tick to get correct container dimensions
      setTimeout(() => expertPanelComponent.render(this.currentExperts), 50);

      // Render consensus/divergence
      consensusComponent.renderConsensus(this.currentConsensusDivergence);
      consensusComponent.renderDivergence(this.currentConsensusDivergence);

      // Render transcript
      this.renderTranscript();

      // Update status
      this.updateStatusBadge(data.status);

      // Connect SSE
      this.connectSSE();
    } catch (err) {
      this.showToast('加载讨论失败：' + err.message, 'error');
    }
  },

  connectSSE() {
    if (this.sseClient) this.sseClient.disconnect();

    this.sseClient = new SSEClient(this.currentDiscussionId, {
      onStatus: (data) => {
        this.updateStatusBadge(data.status);
      },
      onExpertsGenerated: (data) => {
        this.currentExperts = data.experts || [];
        expertPanelComponent.render(this.currentExperts);
        setTimeout(() => expertPanelComponent.render(this.currentExperts), 50);
      },
      onExpertStatus: (data) => {
        expertPanelComponent.updateExpertStatus(data);
      },
      onTranscript: (data) => {
        this.addTranscriptEntry(data);
      },
      onConsensusDivergence: (data) => {
        this.currentConsensusDivergence.push(data);
        consensusComponent.addConsensusDivergence(data);
      },
      onError: (data) => {
        this.showToast(data.message || '发生错误', 'error');
      },
    });
    this.sseClient.connect();
  },

  resetUI() {
    document.getElementById('expert-seats').innerHTML = '';
    document.getElementById('studio-topic').textContent = '加载中...';
    document.getElementById('table-transcript').innerHTML =
      '<div class="transcript-placeholder">🎙 讨论尚未开始...</div>';
    document.getElementById('cf-consensus').innerHTML = '';
    document.getElementById('cf-divergence').innerHTML = '';
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('btn-pause').style.display = 'none';
    document.getElementById('btn-resume').style.display = 'none';
  },

  updateStatusBadge(status) {
    const badge = document.getElementById('discussion-status-badge');
    const labels = {
      pending: '待开始', preparing: '准备中', active: '讨论中',
      paused: '已暂停', completed: '已结束',
    };
    badge.textContent = labels[status] || status;
    badge.className = 'status-badge ' + status;

    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume');

    btnStart.style.display = status === 'pending' ? 'inline-flex' : 'none';
    btnPause.style.display = status === 'active' ? 'inline-flex' : 'none';
    btnResume.style.display = status === 'paused' ? 'inline-flex' : 'none';
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
    try {
      await api.pauseDiscussion(this.currentDiscussionId);
      this.updateStatusBadge('paused');
      this.showToast('讨论已暂停', 'success');
    } catch (err) {
      this.showToast('暂停失败：' + err.message, 'error');
    }
  },

  async resumeDiscussion() {
    try {
      await api.resumeDiscussion(this.currentDiscussionId);
      this.updateStatusBadge('active');
      this.showToast('讨论继续', 'success');
    } catch (err) {
      this.showToast('恢复失败：' + err.message, 'error');
    }
  },

  addTranscriptEntry(entry) {
    const area = document.getElementById('table-transcript');
    const placeholder = area.querySelector('.transcript-placeholder');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.className = 'transcript-entry';
    if (entry.entry_type === 'system') div.classList.add('entry-system');
    if (entry.entry_type === 'summary') div.classList.add('entry-summary');

    const expert = this.currentExperts.find(e => e.id === entry.expert_id);
    const color = expert ? (expert.color_identity || '#818cf8') : '#818cf8';

    const time = entry.created_at
      ? new Date(entry.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '';

    const entryTypeLabel = entry.entry_type === 'summary' ? '📋 总结' : '';
    const speakerLabel = entry.entry_type === 'system' ? '' :
      `<span class="entry-speaker">${this._escape(entry.speaker_name)}</span>
       <span class="entry-title">${this._escape(entry.speaker_title)}</span> ${entryTypeLabel}`;

    div.style.setProperty('--entry-color', color);
    div.innerHTML = `
      <div class="entry-header">${speakerLabel}</div>
      <div class="entry-content">${this._escape(entry.content)}</div>
      <div class="entry-time">${time}</div>
    `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  },

  renderTranscript() {
    const area = document.getElementById('table-transcript');
    if (this.currentTranscript.length === 0) {
      area.innerHTML = '<div class="transcript-placeholder">🎙 讨论尚未开始...</div>';
      return;
    }
    area.innerHTML = '';
    this.currentTranscript.forEach(entry => this.addTranscriptEntry(entry));
  },

  showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },
};
