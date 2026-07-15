/* SSE client for real-time streaming. */

class SSEClient {
  constructor(discussionId, handlers = {}) {
    this.discussionId = discussionId;
    this.handlers = handlers;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnect = 5;
    this.reconnectDelay = 2000;
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/stream/${this.discussionId}`);

    this.eventSource.addEventListener('discussion_status', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onStatus) this.handlers.onStatus(data);
    });

    this.eventSource.addEventListener('experts_generated', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onExpertsGenerated) this.handlers.onExpertsGenerated(data);
    });

    this.eventSource.addEventListener('expert_status', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onExpertStatus) this.handlers.onExpertStatus(data);
    });

    this.eventSource.addEventListener('transcript', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onTranscript) this.handlers.onTranscript(data);
    });

    this.eventSource.addEventListener('consensus_divergence', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onConsensusDivergence) this.handlers.onConsensusDivergence(data);
    });

    this.eventSource.addEventListener('error', (e) => {
      const data = JSON.parse(e.data);
      if (this.handlers.onError) this.handlers.onError(data);
    });

    this.eventSource.addEventListener('ping', () => {
      // Keep-alive, no action needed
    });

    this.eventSource.onerror = () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
