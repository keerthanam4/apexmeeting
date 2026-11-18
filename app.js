/**
 * ApexMeeting Main Application Controller
 * Orchestrates Audio Processing, NLP Engine, Data Warehouse, and Interactive UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentMeetingId: 'mtg_001',
    currentMeeting: null,
    currentSummary: null,
    activeTab: 'live',
    summaryLength: 'medium',
    summaryTone: 'executive',
    language: 'en',
    charts: {
      talkTime: null,
      wpm: null
    },
    chatHistory: [
      {
        sender: 'ai',
        text: 'Hello! I am the ApexMeeting Intelligence Assistant. Ask me anything about decisions, action items, participants, or technical discussions in this meeting—every answer is strictly grounded in timestamped transcripts.',
        citations: []
      }
    ]
  };

  // DOM Elements
  const meetingSelect = document.getElementById('meeting-select');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const audioSeekbar = document.getElementById('audio-seekbar');
  const btnAudioPlay = document.getElementById('btn-audio-play');
  const iconAudioPlay = document.getElementById('icon-audio-play');
  const playerMeetingTitle = document.getElementById('player-meeting-title');
  const playerActiveSpeaker = document.getElementById('player-active-speaker');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerTotalTime = document.getElementById('player-total-time');
  const playerSpeed = document.getElementById('player-speed');
  const transcriptContainer = document.getElementById('transcript-container');
  const transcriptSearch = document.getElementById('transcript-search');
  const transcriptSpeakerFilter = document.getElementById('transcript-speaker-filter');

  // Canvases & Mic controls
  const canvasWaveform = document.getElementById('canvas-waveform');
  const canvasSpectrum = document.getElementById('canvas-spectrum');
  const btnStartMic = document.getElementById('btn-start-mic');
  const btnStopMic = document.getElementById('btn-stop-mic');
  const vadIndicator = document.getElementById('vad-indicator');
  const vadDot = document.getElementById('vad-dot');
  const vadText = document.getElementById('vad-text');
  const vadSensitivity = document.getElementById('vad-sensitivity');
  const vadSensLabel = document.getElementById('vad-sens-label');

  // Summary Controls & Export
  const summaryLenBtns = document.querySelectorAll('.summary-len-btn');
  const summaryToneSelect = document.getElementById('summary-tone-select');
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportWord = document.getElementById('btn-export-word');
  const btnExportMd = document.getElementById('btn-export-md');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');

  // OLAP Controls
  const olapRowDim = document.getElementById('olap-row-dim');
  const olapColDim = document.getElementById('olap-col-dim');
  const olapMetric = document.getElementById('olap-metric');
  const olapPivotTable = document.getElementById('olap-pivot-table');
  const whTabBtns = document.querySelectorAll('.wh-tab-btn');
  const warehouseTableViewer = document.getElementById('warehouse-table-viewer');

  // Q&A
  const qaForm = document.getElementById('qa-form');
  const qaInput = document.getElementById('qa-input');
  const qaChatFeed = document.getElementById('qa-chat-feed');

  // Modal
  const modalNewMeeting = document.getElementById('modal-new-meeting');
  const btnNewMeetingModal = document.getElementById('btn-new-meeting-modal');
  const modalClose = document.getElementById('modal-close');
  const modalPresetBtns = document.querySelectorAll('.modal-preset-btn');
  const modalFileInput = document.getElementById('modal-file-input');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    renderMeetingSelector();
    loadMeeting(state.currentMeetingId);
    setupEventListeners();
    setupAudioCallbacks();
    setupIcons();
  }

  function setupIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Load meeting data and render all components
  function loadMeeting(meetingId) {
    state.currentMeetingId = meetingId;
    state.currentMeeting = ApexDataWarehouse.getMeetingById(meetingId);
    if (!state.currentMeeting) return;

    // Generate NLP summary
    state.currentSummary = ApexNLPEngine.generateSummary(state.currentMeeting, {
      length: state.summaryLength,
      tone: state.summaryTone,
      language: state.language
    });

    // Update Header badges & audio bar
    document.getElementById('header-grounding-score').textContent = `${state.currentMeeting.hallucination_score}%`;
    playerMeetingTitle.textContent = state.currentMeeting.title;
    audioSeekbar.max = state.currentMeeting.duration_sec;
    playerTotalTime.textContent = ApexAudioProcessor.formatTime(state.currentMeeting.duration_sec);
    playerCurrentTime.textContent = '00:00';
    audioSeekbar.value = 0;

    // Render active tabs
    renderTranscript();
    renderSpeakerFilters();
    renderSpeakerIntelligence();
    renderSummaries();
    renderOLAP();
    renderWarehouseTable('FactMeetings');
    renderQAChat();
    renderHistoricalArchives();

    setupIcons();
  }

  function renderMeetingSelector() {
    const meetings = ApexDataWarehouse.getMeetings();
    meetingSelect.innerHTML = meetings.map(m => `
      <option value="${m.meeting_id}" ${m.meeting_id === state.currentMeetingId ? 'selected' : ''}>
        ${m.title} (${Math.round(m.duration_sec / 60)}m • ${m.quarter})
      </option>
    `).join('');
  }

  // ==========================================
  // TAB 1: TRANSCRIPT & AUDIO PLAYBACK
  // ==========================================
  function renderSpeakerFilters() {
    const speakers = state.currentMeeting.speakerMetrics.map(sm => sm.speaker);
    transcriptSpeakerFilter.innerHTML = `<option value="all">All Speakers</option>` +
      speakers.map(s => `<option value="${s.speaker_id}">${s.name}</option>`).join('');
  }

  function renderTranscript() {
    const filterSpeaker = transcriptSpeakerFilter.value;
    const searchQ = (transcriptSearch.value || '').toLowerCase().trim();

    let utterances = state.currentMeeting.utterances || [];

    if (filterSpeaker !== 'all') {
      utterances = utterances.filter(u => u.speaker_id === filterSpeaker);
    }
    if (searchQ) {
      utterances = utterances.filter(u => u.text.toLowerCase().includes(searchQ));
    }

    if (utterances.length === 0) {
      transcriptContainer.innerHTML = `
        <div class="text-center py-8 text-slate-500 text-xs">
          No matching transcript utterances found.
        </div>
      `;
      return;
    }

    transcriptContainer.innerHTML = utterances.map(u => {
      const spk = u.speaker || { name: 'Unknown', avatar: '?', color: '#64748b', role: '' };
      const sentimentColor = u.sentiment === 'positive' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : u.sentiment === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        : 'text-slate-400 bg-slate-800 border-slate-700';

      return `
        <div class="utterance-card p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 transition-all hover:border-slate-700 space-y-1.5"
             id="utt-card-${u.utterance_id}" data-start="${u.start_sec}" data-end="${u.end_sec}">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style="background-color: ${spk.color}">
                ${spk.avatar}
              </span>
              <span class="font-semibold text-xs text-slate-200">${spk.name}</span>
              <span class="text-[10px] text-slate-500 hidden sm:inline">(${spk.role})</span>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-[10px] px-2 py-0.5 rounded border capitalize ${sentimentColor}">
                ${u.sentiment}
              </span>
              <button class="citation-chip cursor-pointer" data-time="${u.start_time}" title="Click to play from ${u.start_time}">
                <i data-lucide="play" class="w-2.5 h-2.5"></i>
                <span>${u.start_time}</span>
              </button>
            </div>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed pl-8">
            ${highlightSearch(u.text, searchQ)}
          </p>
        </div>
      `;
    }).join('');

    setupIcons();
  }

  function highlightSearch(text, q) {
    if (!q) return text;
    const regex = new RegExp(`(${q})`, 'gi');
    return text.replace(regex, '<mark class="bg-amber-500/30 text-amber-200 rounded px-1">$1</mark>');
  }

  // Audio Playback synchronization
  function setupAudioCallbacks() {
    ApexAudioProcessor.onVadChange((isActive, rms) => {
      if (isActive) {
        vadIndicator.className = 'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 pulsing-ring';
        vadDot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]';
        vadText.textContent = 'Speech Detected';
      } else {
        vadIndicator.className = 'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700';
        vadDot.className = 'w-2 h-2 rounded-full bg-slate-500';
        vadText.textContent = 'Silence / Pause';
      }
    });

    ApexAudioProcessor.onTranscriptChunk((chunk) => {
      if (!chunk.final) return;
      // Append real-time speech to transcript container
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 space-y-1.5 animate-fadeIn';
      div.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white">LIVE</span>
            <span class="font-semibold text-xs text-brand-300">Live Microphone Input</span>
          </div>
          <span class="citation-chip">${chunk.timestamp}</span>
        </div>
        <p class="text-xs text-slate-200 pl-8">${chunk.final}</p>
      `;
      transcriptContainer.prepend(div);
      setupIcons();
    });
  }

  function toggleAudioPlayback() {
    if (ApexAudioProcessor.isPlaying()) {
      ApexAudioProcessor.pauseMeetingAudio();
      iconAudioPlay.setAttribute('data-lucide', 'play');
      iconAudioPlay.classList.add('ml-0.5');
    } else {
      ApexAudioProcessor.playMeetingAudio(
        state.currentMeeting.duration_sec,
        (currentSec, totalSec) => {
          syncAudioProgress(currentSec, totalSec);
        },
        () => {
          iconAudioPlay.setAttribute('data-lucide', 'play');
          setupIcons();
        }
      );
      iconAudioPlay.setAttribute('data-lucide', 'pause');
      iconAudioPlay.classList.remove('ml-0.5');
    }
    setupIcons();
  }

  function syncAudioProgress(currentSec, totalSec) {
    audioSeekbar.value = Math.floor(currentSec);
    playerCurrentTime.textContent = ApexAudioProcessor.formatTime(currentSec);

    // Find active utterance
    const activeUtterance = (state.currentMeeting.utterances || []).find(
      u => currentSec >= u.start_sec && currentSec <= u.end_sec
    );

    if (activeUtterance) {
      if (activeUtterance.speaker) {
        playerActiveSpeaker.textContent = activeUtterance.speaker.name;
      }

      // Highlight active utterance card
      document.querySelectorAll('.utterance-card').forEach(el => el.classList.remove('utterance-active'));
      const activeCard = document.getElementById(`utt-card-${activeUtterance.utterance_id}`);
      if (activeCard) {
        activeCard.classList.add('utterance-active');
        // Smooth scroll if playing
        if (state.activeTab === 'live' && ApexAudioProcessor.isPlaying()) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  function jumpToTimestamp(timeStr) {
    const sec = ApexAudioProcessor.parseTime(timeStr);
    ApexAudioProcessor.seekMeetingAudio(sec, (cur, tot) => syncAudioProgress(cur, tot));
    if (!ApexAudioProcessor.isPlaying()) {
      toggleAudioPlayback();
    }
  }

  // ==========================================
  // TAB 2: SPEAKER INTELLIGENCE
  // ==========================================
  function renderSpeakerIntelligence() {
    const sm = state.currentMeeting.speakerMetrics || [];
    const container = document.getElementById('speaker-cards-container');
    const tbody = document.getElementById('speaker-dynamics-tbody');

    // Cards
    container.innerHTML = sm.map(s => `
      <div class="glass-panel p-4 space-y-3 border-t-2" style="border-top-color: ${s.speaker.color}">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md"
               style="background-color: ${s.speaker.color}">
            ${s.speaker.avatar}
          </div>
          <div>
            <div class="font-bold text-xs text-white">${s.speaker.name}</div>
            <div class="text-[11px] text-slate-400 truncate">${s.speaker.role}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div class="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div class="text-[10px] text-slate-500">Talk Share</div>
            <div class="font-bold font-mono text-brand-400 text-sm">${s.talkSharePct}%</div>
          </div>
          <div class="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div class="text-[10px] text-slate-500">Cadence</div>
            <div class="font-bold font-mono text-emerald-400 text-sm">${s.wpm} <span class="text-[10px] font-normal text-slate-400">WPM</span></div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Engagement:</span>
          <span class="font-bold text-white font-mono">${s.engagementIndex}/100</span>
        </div>
      </div>
    `).join('');

    // Dynamics Table
    tbody.innerHTML = sm.map(s => `
      <tr class="hover:bg-slate-800/30">
        <td class="py-2.5 px-3">
          <div class="flex items-center space-x-2">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style="background-color: ${s.speaker.color}">
              ${s.speaker.avatar}
            </span>
            <span class="font-semibold text-slate-200">${s.speaker.name}</span>
          </div>
        </td>
        <td class="py-2.5 px-3 text-slate-400">${s.speaker.role}</td>
        <td class="py-2.5 px-3 font-mono font-bold text-brand-400">${s.talkSharePct}%</td>
        <td class="py-2.5 px-3 font-mono text-emerald-400">${s.wpm} WPM</td>
        <td class="py-2.5 px-3 font-mono text-slate-300">${s.avgTurnSec}s</td>
        <td class="py-2.5 px-3 font-mono text-slate-300">${s.turns}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ${s.sentiments.positive > s.sentiments.critical ? 'Constructive' : 'Critical Analysis'}
          </span>
        </td>
        <td class="py-2.5 px-3">
          <div class="flex items-center space-x-2">
            <div class="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="bg-brand-500 h-full rounded-full" style="width: ${s.engagementIndex}%"></div>
            </div>
            <span class="font-mono text-slate-300 text-[11px]">${s.engagementIndex}</span>
          </div>
        </td>
      </tr>
    `).join('');

    renderSpeakerCharts(sm);
  }

  function renderSpeakerCharts(sm) {
    const ctxTalk = document.getElementById('chart-talk-time');
    const ctxWpm = document.getElementById('chart-wpm');

    if (state.charts.talkTime) state.charts.talkTime.destroy();
    if (state.charts.wpm) state.charts.wpm.destroy();

    // Donut Talk-time Chart
    state.charts.talkTime = new Chart(ctxTalk, {
      type: 'doughnut',
      data: {
        labels: sm.map(s => s.speaker.name),
        datasets: [{
          data: sm.map(s => s.talkSharePct),
          backgroundColor: sm.map(s => s.speaker.color),
          borderColor: '#111827',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { size: 11 } }
          }
        },
        cutout: '68%'
      }
    });

    // Bar Cadence Chart
    state.charts.wpm = new Chart(ctxWpm, {
      type: 'bar',
      data: {
        labels: sm.map(s => s.speaker.name.split(' ')[0]),
        datasets: [{
          label: 'Words Per Minute',
          data: sm.map(s => s.wpm),
          backgroundColor: sm.map(s => s.speaker.color + 'cc'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: '#1f2937' },
            ticks: { color: '#94a3b8', font: { size: 10 } },
            suggestedMax: 180
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // ==========================================
  // TAB 3: SUMMARIZATION & REPORTS
  // ==========================================
  function renderSummaries() {
    const summary = state.currentSummary;
    if (!summary) return;

    // Executive Summary
    const execContainer = document.getElementById('executive-summary-content');
    execContainer.innerHTML = (summary.executiveSummary || []).map((item, idx) => `
      <div class="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
        <span class="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
          ${idx + 1}
        </span>
        <div class="flex-1 text-xs text-slate-200 leading-relaxed">
          ${item.text}
        </div>
        <button class="citation-chip shrink-0" data-time="${item.citation}" title="Jump to verbatim source in audio [${item.citation} • ${item.speaker}]">
          <i data-lucide="link" class="w-3 h-3"></i>
          <span>${item.citation} • ${item.speaker ? item.speaker.split(' ')[0] : 'Src'}</span>
        </button>
      </div>
    `).join('');

    // Decisions Log
    const decContainer = document.getElementById('decisions-container');
    const decisions = state.currentMeeting.decisions || [];
    document.getElementById('decision-count-badge').textContent = `${decisions.length} Decisions`;

    decContainer.innerHTML = decisions.map(d => {
      const spk = d.decided_by_speaker || { name: 'Unknown', avatar: '?' };
      const impactClass = d.impact_level === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

      return `
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="text-xs font-bold text-white leading-snug">${d.decision_text}</div>
              <div class="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Decided By: <strong class="text-slate-200">${spk.name}</strong></span>
                <span>•</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${impactClass}">${d.impact_level}</span>
                <span>•</span>
                <span class="text-slate-400">Topic: ${d.topic ? d.topic.name : 'Architecture'}</span>
              </div>
            </div>

            <button class="citation-chip shrink-0" data-time="${d.timestamp}" title="Jump to timestamp ${d.timestamp}">
              <i data-lucide="play" class="w-3 h-3"></i>
              <span>[${d.timestamp}]</span>
            </button>
          </div>

          <div class="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <strong>Rationale:</strong> ${d.rationale}
          </div>
        </div>
      `;
    }).join('');

    // Action Items
    const actContainer = document.getElementById('action-items-container');
    const actionItems = state.currentMeeting.actionItems || [];
    document.getElementById('action-count-badge').textContent = `${actionItems.length} Action Items`;

    actContainer.innerHTML = actionItems.map(a => {
      const spk = a.assignee || { name: 'Unassigned', avatar: '?', color: '#64748b' };
      const prioClass = a.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        : a.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

      return `
        <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <input type="checkbox" ${a.status === 'Done' ? 'checked' : ''} class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-0 cursor-pointer">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-slate-100 ${a.status === 'Done' ? 'line-through text-slate-500' : ''}">${a.description}</div>
              <div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span class="flex items-center space-x-1">
                  <span class="w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style="background-color: ${spk.color}">${spk.avatar}</span>
                  <span class="text-slate-300 font-medium">${spk.name}</span>
                </span>
                <span>•</span>
                <span>Due: <strong class="text-slate-300">${a.due_date}</strong></span>
                <span>•</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold border ${prioClass}">${a.priority}</span>
              </div>
            </div>
          </div>

          <button class="citation-chip shrink-0" data-time="${a.timestamp}">
            <i data-lucide="play" class="w-3 h-3"></i>
            <span>[${a.timestamp}]</span>
          </button>
        </div>
      `;
    }).join('');

    // Detailed Section Breakdown
    const detailedContainer = document.getElementById('detailed-breakdown-container');
    detailedContainer.innerHTML = (summary.detailedSections || []).map(sec => `
      <div class="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs text-white">${sec.heading}</h4>
          <div class="flex items-center space-x-1">
            ${(sec.citations || []).map(c => `
              <button class="citation-chip text-[10px]" data-time="${c}">[${c}]</button>
            `).join('')}
          </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">${sec.content}</p>
      </div>
    `).join('');

    // Speaker-wise accountability recaps
    const spkRecapContainer = document.getElementById('speaker-summaries-container');
    spkRecapContainer.innerHTML = (summary.speakerSummaries || []).map(s => `
      <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style="background-color: ${s.speaker.color}">
              ${s.speaker.avatar}
            </span>
            <span class="font-bold text-xs text-white">${s.speaker.name}</span>
          </div>
          <button class="citation-chip text-[10px]" data-time="${s.citation}">[${s.citation}]</button>
        </div>
        <p class="text-[11px] text-slate-300 leading-normal">${s.contribution}</p>
        <div class="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/60">
          "${s.keyQuote}"
        </div>
      </div>
    `).join('');

    // Grounding Panel
    document.getElementById('guardrail-consistency').textContent = `${summary.groundingAudit.consistencyScore}%`;
    document.getElementById('guardrail-coverage').textContent = `${summary.groundingAudit.coverageScore}%`;

    setupIcons();
  }

  // ==========================================
  // TAB 4: DATA WAREHOUSE & OLAP
  // ==========================================
  function renderOLAP() {
    const rowDim = olapRowDim.value;
    const colDim = olapColDim.value;
    const metric = olapMetric.value;

    const result = ApexDataWarehouse.queryOLAP({ rowDim, colDim, metric });

    let metricLabel = 'Decisions';
    if (metric === 'action_items') metricLabel = 'Actions';
    else if (metric === 'meeting_hours') metricLabel = 'Hours';
    else if (metric === 'efficiency_avg') metricLabel = 'Score';

    let html = `
      <thead>
        <tr>
          <th>${rowDim.toUpperCase()}</th>
          ${result.columns.map(c => `<th class="text-right">${c}</th>`).join('')}
          <th class="text-right text-brand-400">TOTAL / AVG</th>
        </tr>
      </thead>
      <tbody>
    `;

    result.data.forEach(row => {
      html += `
        <tr>
          <td class="font-semibold text-slate-200">${row.dimension}</td>
          ${result.columns.map(c => `
            <td class="text-right font-mono text-slate-300 font-medium">
              ${row[c]} <span class="text-[10px] text-slate-500">${metricLabel}</span>
            </td>
          `).join('')}
          <td class="text-right font-mono font-bold text-brand-400">
            ${row.total}
          </td>
        </tr>
      `;
    });

    html += `</tbody>`;
    olapPivotTable.innerHTML = html;
  }

  function renderWarehouseTable(tableName) {
    let data = [];
    if (tableName === 'FactMeetings') data = ApexDataWarehouse.getMeetings();
    else if (tableName === 'FactDecisions') data = ApexDataWarehouse.getDecisions();
    else if (tableName === 'FactActionItems') data = ApexDataWarehouse.getActionItems();
    else if (tableName === 'DimSpeakers') data = ApexDataWarehouse.getSpeakers();
    else if (tableName === 'DimTopics') data = ApexDataWarehouse.getTopics();

    if (data.length === 0) {
      warehouseTableViewer.innerHTML = '<tr><td class="p-4 text-center text-slate-500">No records found</td></tr>';
      return;
    }

    const keys = Object.keys(data[0]);

    let html = `
      <thead>
        <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
          ${keys.map(k => `<th class="py-2.5 px-3 whitespace-nowrap">${k}</th>`).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
    `;

    data.forEach(item => {
      html += `<tr class="hover:bg-slate-800/30">`;
      keys.forEach(k => {
        let val = item[k];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        html += `<td class="py-2 px-3 text-slate-300 max-w-[200px] truncate" title="${val}">${val}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody>`;
    warehouseTableViewer.innerHTML = html;
  }

  // ==========================================
  // TAB 5: KNOWLEDGE BASE & Q&A
  // ==========================================
  function renderQAChat() {
    qaChatFeed.innerHTML = state.chatHistory.map(msg => {
      const isAi = msg.sender === 'ai';
      return `
        <div class="flex items-start space-x-3 ${isAi ? '' : 'justify-end'}">
          ${isAi ? `
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
              <i data-lucide="bot" class="w-4 h-4"></i>
            </div>
          ` : ''}

          <div class="max-w-2xl rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
            isAi 
              ? 'bg-slate-900 border border-slate-800 text-slate-200' 
              : 'bg-brand-600 text-white shadow-md'
          }">
            <div class="whitespace-pre-line">${msg.text}</div>

            ${(msg.citations && msg.citations.length > 0) ? `
              <div class="pt-2 border-t border-slate-800/80 space-y-1">
                <div class="text-[10px] uppercase font-bold text-slate-400">Verifiable Grounding Citations:</div>
                <div class="flex flex-wrap gap-2">
                  ${msg.citations.map(c => `
                    <button class="citation-chip" data-time="${c.timestamp}" title="Jump to transcript: &quot;${c.quote || ''}&quot;">
                      <i data-lucide="play" class="w-3 h-3"></i>
                      <span>[${c.timestamp} • ${c.speaker}]</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          ${!isAi ? `
            <div class="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              U
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    setupIcons();
  }

  function handleQAQuery(query) {
    if (!query) return;

    // Add user message
    state.chatHistory.push({
      sender: 'user',
      text: query,
      citations: []
    });
    renderQAChat();

    // Query NLP Engine
    setTimeout(() => {
      const resp = ApexNLPEngine.answerQuestion(state.currentMeeting, query);
      state.chatHistory.push({
        sender: 'ai',
        text: resp.answer,
        citations: resp.citations
      });
      renderQAChat();
    }, 250);
  }

  function renderHistoricalArchives() {
    const decisions = ApexDataWarehouse.getDecisions();
    const actions = ApexDataWarehouse.getActionItems();
    const meetings = ApexDataWarehouse.getMeetings();

    // Decisions List
    document.getElementById('archive-decisions-list').innerHTML = decisions.slice(0, 5).map(d => `
      <div class="p-2 rounded bg-slate-950/60 border border-slate-800/80 space-y-1">
        <div class="font-semibold text-slate-200 truncate">${d.decision_text}</div>
        <div class="text-[10px] text-slate-500 flex justify-between">
          <span>${d.meeting_id}</span>
          <span class="text-brand-400">[${d.timestamp}]</span>
        </div>
      </div>
    `).join('');

    // Actions List
    document.getElementById('archive-actions-list').innerHTML = actions.slice(0, 5).map(a => `
      <div class="p-2 rounded bg-slate-950/60 border border-slate-800/80 space-y-1">
        <div class="font-semibold text-slate-200 truncate">${a.description}</div>
        <div class="text-[10px] text-slate-500 flex justify-between">
          <span>Due: ${a.due_date}</span>
          <span class="text-amber-400 font-bold">${a.priority}</span>
        </div>
      </div>
    `).join('');

    // Metrics
    document.getElementById('archive-metrics-list').innerHTML = `
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1">
        <div class="text-slate-400 text-[11px]">Avg Decision Velocity</div>
        <div class="text-lg font-bold font-mono text-emerald-400">4.2 / hr</div>
      </div>
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1">
        <div class="text-slate-400 text-[11px]">Meeting Efficiency Index</div>
        <div class="text-lg font-bold font-mono text-brand-400">89.4 / 100</div>
      </div>
    `;
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Meeting Selector
    meetingSelect.addEventListener('change', (e) => {
      loadMeeting(e.target.value);
    });

    // Navigation Tabs
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        state.activeTab = target;

        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabPanes.forEach(pane => {
          if (pane.id === `tab-content-${target}`) {
            pane.classList.remove('hidden');
          } else {
            pane.classList.add('hidden');
          }
        });

        if (target === 'speaker') {
          renderSpeakerIntelligence();
        } else if (target === 'warehouse') {
          renderOLAP();
        }
      });
    });

    // Audio Player Controls
    btnAudioPlay.addEventListener('click', toggleAudioPlayback);

    audioSeekbar.addEventListener('input', (e) => {
      const sec = parseFloat(e.target.value);
      ApexAudioProcessor.seekMeetingAudio(sec, (cur, tot) => syncAudioProgress(cur, tot));
    });

    playerSpeed.addEventListener('change', (e) => {
      ApexAudioProcessor.setPlaybackSpeed(parseFloat(e.target.value));
    });

    // Global Citation Click Delegation
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.citation-chip');
      if (chip) {
        const timeStr = chip.getAttribute('data-time');
        if (timeStr) {
          jumpToTimestamp(timeStr);
        }
      }
    });

    // Transcript Search & Filter
    transcriptSearch.addEventListener('input', renderTranscript);
    transcriptSpeakerFilter.addEventListener('change', renderTranscript);

    // Live Mic Controls
    btnStartMic.addEventListener('click', async () => {
      btnStartMic.disabled = true;
      btnStartMic.classList.add('opacity-50');
      btnStopMic.disabled = false;
      btnStopMic.classList.remove('cursor-not-allowed', 'bg-rose-600/40', 'text-rose-300');
      btnStopMic.classList.add('bg-rose-600', 'text-white', 'hover:bg-rose-500');

      await ApexAudioProcessor.startMicrophone(canvasWaveform, canvasSpectrum);
    });

    btnStopMic.addEventListener('click', () => {
      ApexAudioProcessor.stopMicrophone();
      btnStartMic.disabled = false;
      btnStartMic.classList.remove('opacity-50');
      btnStopMic.disabled = true;
      btnStopMic.classList.add('cursor-not-allowed', 'bg-rose-600/40', 'text-rose-300');
      btnStopMic.classList.remove('bg-rose-600', 'text-white', 'hover:bg-rose-500');
    });

    vadSensitivity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ApexAudioProcessor.setVadSensitivity(val);
      if (val <= 0.015) vadSensLabel.textContent = 'High';
      else if (val >= 0.045) vadSensLabel.textContent = 'Low';
      else vadSensLabel.textContent = 'Normal';
    });

    // Summary Length Toggle
    summaryLenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        summaryLenBtns.forEach(b => {
          b.classList.remove('active', 'bg-brand-600', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'bg-brand-600', 'text-white');
        btn.classList.remove('text-slate-400');

        state.summaryLength = btn.getAttribute('data-load') || btn.getAttribute('data-len');
        state.currentSummary = ApexNLPEngine.generateSummary(state.currentMeeting, {
          length: state.summaryLength,
          tone: state.summaryTone,
          language: state.language
        });
        renderSummaries();
      });
    });

    // Summary Tone Selector
    summaryToneSelect.addEventListener('change', (e) => {
      state.summaryTone = e.target.value;
      state.currentSummary = ApexNLPEngine.generateSummary(state.currentMeeting, {
        length: state.summaryLength,
        tone: state.summaryTone,
        language: state.language
      });
      renderSummaries();
    });

    // Export Buttons
    btnExportPdf.addEventListener('click', () => ApexExportEngine.exportPDF(state.currentMeeting, state.currentSummary));
    btnExportWord.addEventListener('click', () => ApexExportEngine.exportWordDoc(state.currentMeeting, state.currentSummary));
    btnExportMd.addEventListener('click', () => ApexExportEngine.exportMarkdown(state.currentMeeting, state.currentSummary));
    btnExportCsv.addEventListener('click', () => ApexExportEngine.exportCSV(state.currentMeeting));
    btnExportJson.addEventListener('click', () => ApexExportEngine.exportJSON(state.currentMeeting, state.currentSummary));

    // OLAP Query Selectors
    olapRowDim.addEventListener('change', renderOLAP);
    olapColDim.addEventListener('change', renderOLAP);
    olapMetric.addEventListener('change', renderOLAP);

    // Warehouse Table Tabs
    whTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        whTabBtns.forEach(b => {
          b.classList.remove('active', 'bg-brand-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-slate-400');
        });
        btn.classList.add('active', 'bg-brand-600', 'text-white');
        btn.classList.remove('bg-slate-800', 'text-slate-400');

        renderWarehouseTable(btn.getAttribute('data-table'));
      });
    });

    // Q&A Form
    qaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = qaInput.value.trim();
      if (!val) return;
      handleQAQuery(val);
      qaInput.value = '';
    });

    // Q&A Suggestions
    document.querySelectorAll('.qa-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.replace(/["']/g, '').trim();
        handleQAQuery(text);
      });
    });

    // Modal Events
    btnNewMeetingModal.addEventListener('click', () => {
      modalNewMeeting.classList.remove('hidden');
    });
    modalClose.addEventListener('click', () => {
      modalNewMeeting.classList.add('hidden');
    });
    modalPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-load');
        modalNewMeeting.classList.add('hidden');
        loadMeeting(id);
        meetingSelect.value = id;
      });
    });
  }

  // Kickoff
  init();
});
