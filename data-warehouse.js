/**
 * ApexMeeting Data Warehouse & OLAP Engine
 * Star Schema implementation with multidimensional analysis capabilities
 */

const ApexDataWarehouse = (() => {
  // Dimension: Speakers
  let dimSpeakers = [
    { speaker_id: 'spk_sarah', name: 'Sarah Chen', role: 'VP of Product', department: 'Product Management', avatar: 'SC', color: '#3b82f6', avg_wpm: 142, total_meetings: 18 },
    { speaker_id: 'spk_alex', name: 'Alex Rivera', role: 'Staff Infrastructure Architect', department: 'Platform Engineering', avatar: 'AR', color: '#10b981', avg_wpm: 158, total_meetings: 24 },
    { speaker_id: 'spk_marcus', name: 'Marcus Vance', role: 'Head of InfoSec & Compliance', department: 'Security & Risk', avatar: 'MV', color: '#ef4444', avg_wpm: 135, total_meetings: 15 },
    { speaker_id: 'spk_elena', name: 'Elena Rostova', role: 'Director of AI & Applied ML', department: 'Data Science', avatar: 'ER', color: '#8b5cf6', avg_wpm: 149, total_meetings: 21 },
    { speaker_id: 'spk_david', name: 'David Kim', role: 'Principal Front-end Engineer', department: 'Client Applications', avatar: 'DK', color: '#f59e0b', avg_wpm: 165, total_meetings: 14 }
  ];

  // Dimension: Topics
  let dimTopics = [
    { topic_id: 'top_arch', name: 'Database & Cloud Architecture', category: 'Infrastructure', sentiment_bias: 'Neutral' },
    { topic_id: 'top_rag', name: 'Vector Search & RAG Latency', category: 'AI/ML', sentiment_bias: 'Positive' },
    { topic_id: 'top_sec', name: 'Zero-Trust Auth & Compliance', category: 'Security', sentiment_bias: 'Critical' },
    { topic_id: 'top_budget', name: 'Budget, Headcount & Timelines', category: 'Executive', sentiment_bias: 'Positive' },
    { topic_id: 'top_client', name: 'Client Experience & SDKs', category: 'Product', sentiment_bias: 'Positive' },
    { topic_id: 'top_sla', name: 'Customer Escalations & SLAs', category: 'Operations', sentiment_bias: 'Critical' }
  ];

  // Dimension: Projects
  let dimProjects = [
    { project_id: 'prj_titan', name: 'Project Titan: NextGen Data Hub', department: 'Platform Engineering', lead_speaker_id: 'spk_alex' },
    { project_id: 'prj_shield', name: 'Project Shield: Enterprise Trust 2.0', department: 'Security & Risk', lead_speaker_id: 'spk_marcus' },
    { project_id: 'prj_apex', name: 'Project Apex: Unified Meeting AI', department: 'Product Management', lead_speaker_id: 'spk_sarah' },
    { project_id: 'prj_flow', name: 'Project Flow: Realtime Client Engine', department: 'Client Applications', lead_speaker_id: 'spk_david' }
  ];

  // Fact: Meetings
  let factMeetings = [
    {
      meeting_id: 'mtg_001',
      title: 'Q4 Product Strategy & Architecture Migration Sync',
      project_id: 'prj_titan',
      date: '2026-11-18',
      quarter: 'Q4-2026',
      duration_sec: 465, // ~7:45 mins demo
      participant_count: 4,
      words_count: 1148,
      efficiency_score: 94, // 0-100 scale based on decision velocity & focus
      sentiment_score: 0.76, // -1.0 to +1.0
      decision_count: 3,
      action_item_count: 4,
      topic_count: 4,
      status: 'Archived',
      hallucination_score: 98.8,
      coverage_score: 96.2,
      audio_url: 'simulated_audio_01'
    },
    {
      meeting_id: 'mtg_002',
      title: 'AI Gateway Security & Enterprise Privacy Review',
      project_id: 'prj_shield',
      date: '2026-11-12',
      quarter: 'Q4-2026',
      duration_sec: 1820, // ~30 mins
      participant_count: 3,
      words_count: 4420,
      efficiency_score: 88,
      sentiment_score: 0.62,
      decision_count: 4,
      action_item_count: 5,
      topic_count: 3,
      status: 'Archived',
      hallucination_score: 99.1,
      coverage_score: 94.8,
      audio_url: 'simulated_audio_02'
    },
    {
      meeting_id: 'mtg_003',
      title: 'Mobile Experience Redesign & Client SDK Sync',
      project_id: 'prj_flow',
      date: '2026-10-28',
      quarter: 'Q4-2026',
      duration_sec: 2100, // 35 mins
      participant_count: 3,
      words_count: 5310,
      efficiency_score: 82,
      sentiment_score: 0.81,
      decision_count: 3,
      action_item_count: 4,
      topic_count: 3,
      status: 'Archived',
      hallucination_score: 97.9,
      coverage_score: 93.5,
      audio_url: 'simulated_audio_03'
    },
    {
      meeting_id: 'mtg_004',
      title: 'Executive Advisory Council: Multi-Tenant SLA Review',
      project_id: 'prj_apex',
      date: '2026-09-15',
      quarter: 'Q3-2026',
      duration_sec: 2700, // 45 mins
      participant_count: 5,
      words_count: 6890,
      efficiency_score: 91,
      sentiment_score: 0.58,
      decision_count: 5,
      action_item_count: 6,
      topic_count: 4,
      status: 'Archived',
      hallucination_score: 99.4,
      coverage_score: 97.0,
      audio_url: 'simulated_audio_04'
    }
  ];

  // Fact: Decisions
  let factDecisions = [
    {
      decision_id: 'dec_001',
      meeting_id: 'mtg_001',
      topic_id: 'top_rag',
      decided_by: 'spk_alex',
      decision_text: 'Standardize on pgvector with hybrid BM25 search for RAG embeddings, phasing out Pinecone by November 30.',
      timestamp: '02:45',
      timestamp_sec: 165,
      impact_level: 'Critical',
      status: 'Approved',
      rationale: 'Reduces VPC egress latency from 85ms to 14ms and cuts standalone vector database subscription costs by $48,000 annually.'
    },
    {
      decision_id: 'dec_002',
      meeting_id: 'mtg_001',
      topic_id: 'top_sec',
      decided_by: 'spk_marcus',
      decision_text: 'Enforce mutual TLS (mTLS) and zero-trust JWT rotation with a 15-minute TTL across all internal microservices.',
      timestamp: '04:12',
      timestamp_sec: 252,
      impact_level: 'Critical',
      status: 'Approved',
      rationale: 'Mandatory compliance requirement for SOC 2 Type II and FedRAMP readiness ahead of enterprise banking client onboarding.'
    },
    {
      decision_id: 'dec_003',
      meeting_id: 'mtg_001',
      topic_id: 'top_budget',
      decided_by: 'spk_sarah',
      decision_text: 'Cap migration parallel run spend at $14,000/month for Q4 and allocate 3 dedicated DevOps engineers.',
      timestamp: '05:50',
      timestamp_sec: 350,
      impact_level: 'High',
      status: 'Approved',
      rationale: 'Ensures zero downtime cutover while keeping cloud burst infrastructure spend within approved quarterly burn limits.'
    },
    {
      decision_id: 'dec_004',
      meeting_id: 'mtg_002',
      topic_id: 'top_sec',
      decided_by: 'spk_marcus',
      decision_text: 'Implement automated client-side PII masking before transmitting user audio streams to downstream ASR engines.',
      timestamp: '14:20',
      timestamp_sec: 860,
      impact_level: 'Critical',
      status: 'Approved',
      rationale: 'Strict GDPR & HIPAA boundary compliance.'
    },
    {
      decision_id: 'dec_005',
      meeting_id: 'mtg_003',
      topic_id: 'top_client',
      decided_by: 'spk_david',
      decision_text: 'Adopt WebAssembly-accelerated audio pre-processing in the client web SDK to eliminate microphone buffer latency.',
      timestamp: '18:15',
      timestamp_sec: 1095,
      impact_level: 'High',
      status: 'Approved',
      rationale: 'Reduces client memory footprint by 40% and delivers sub-50ms voice packet framing.'
    }
  ];

  // Fact: Action Items
  let factActionItems = [
    {
      action_id: 'act_001',
      meeting_id: 'mtg_001',
      topic_id: 'top_rag',
      assignee_id: 'spk_alex',
      description: 'Draft vector index benchmarking document comparing HNSW vs IVFFlat latency and memory footprints under 10M vectors.',
      due_date: '2026-11-25',
      priority: 'High',
      status: 'In Progress',
      timestamp: '02:58',
      timestamp_sec: 178
    },
    {
      action_id: 'act_002',
      meeting_id: 'mtg_001',
      topic_id: 'top_sec',
      assignee_id: 'spk_marcus',
      description: 'Audit existing microservices for deprecated authentication tokens and deliver compliance matrix to Platform team.',
      due_date: '2026-11-28',
      priority: 'Critical',
      status: 'Todo',
      timestamp: '04:22',
      timestamp_sec: 262
    },
    {
      action_id: 'act_003',
      meeting_id: 'mtg_001',
      topic_id: 'top_rag',
      assignee_id: 'spk_elena',
      description: 'Build automated regression testing suite for hybrid search retrieval pipeline to benchmark recall@10.',
      due_date: '2026-12-05',
      priority: 'Medium',
      status: 'Todo',
      timestamp: '03:40',
      timestamp_sec: 220
    },
    {
      action_id: 'act_004',
      meeting_id: 'mtg_001',
      topic_id: 'top_budget',
      assignee_id: 'spk_sarah',
      description: 'Submit Q4 revised cloud infrastructure budget request and engineer allocation order to Finance Board.',
      due_date: '2026-11-22',
      priority: 'High',
      status: 'Done',
      timestamp: '06:05',
      timestamp_sec: 365
    },
    {
      action_id: 'act_005',
      meeting_id: 'mtg_002',
      topic_id: 'top_sec',
      assignee_id: 'spk_marcus',
      description: 'Publish internal PII regex and NER classification guidelines for speech-to-text token sanitization.',
      due_date: '2026-11-30',
      priority: 'High',
      status: 'In Progress',
      timestamp: '19:40',
      timestamp_sec: 1180
    }
  ];

  // Fact: Utterances (Transcript segments with exact timestamps, speaker, topic, and sentiment)
  let factUtterances = [
    {
      utterance_id: 'utt_001',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_sarah',
      start_time: '00:00',
      end_time: '00:42',
      start_sec: 0,
      end_sec: 42,
      duration: 42,
      word_count: 104,
      topic_id: 'top_budget',
      sentiment: 'positive',
      text: "Good morning team. Thanks for jumping on. Today our primary objective is to finalize our Q4 data architecture roadmap. Specifically, we must resolve the latency bottlenecks in our vector search pipeline, address Marcus's security compliance mandates, and agree on our cutover budget."
    },
    {
      utterance_id: 'utt_002',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_alex',
      start_time: '00:43',
      end_time: '01:52',
      start_sec: 43,
      end_sec: 112,
      duration: 69,
      word_count: 172,
      topic_id: 'top_arch',
      sentiment: 'neutral',
      text: "Thanks Sarah. Over the past three weeks, platform engineering has stress-tested our current dual-database setup. Maintaining Pinecone alongside our primary PostgreSQL cluster has created noticeable data synchronization lag—upwards of 850 milliseconds in p99 queries. We evaluated migrating all vector embeddings directly into PostgreSQL using pgvector."
    },
    {
      utterance_id: 'utt_003',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_elena',
      start_time: '01:53',
      end_time: '02:44',
      start_sec: 113,
      end_sec: 164,
      duration: 51,
      word_count: 138,
      topic_id: 'top_rag',
      sentiment: 'positive',
      text: "I completely echo Alex's findings. From an AI research standpoint, the hybrid search capabilities in pgvector combined with reciprocal rank fusion give us 94% recall, compared to 89% when calling out to separate vector endpoints. Plus, eliminating external network hops drops our RAG generation time significantly."
    },
    {
      utterance_id: 'utt_004',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_alex',
      start_time: '02:45',
      end_time: '03:12',
      start_sec: 165,
      end_sec: 192,
      duration: 27,
      word_count: 78,
      topic_id: 'top_rag',
      sentiment: 'positive',
      text: "So here is my recommendation: let us standardize on pgvector with hybrid BM25 search for all RAG embeddings, and completely phase out Pinecone by November 30th. I will personally deliver the HNSW vs IVFFlat latency benchmarks by November 25th."
    },
    {
      utterance_id: 'utt_005',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_elena',
      start_time: '03:13',
      end_time: '03:45',
      start_sec: 193,
      end_sec: 225,
      duration: 32,
      word_count: 85,
      topic_id: 'top_rag',
      sentiment: 'positive',
      text: "Agreed. I will build an automated regression testing suite for the hybrid retrieval pipeline by December 5th to safeguard recall@10 before we execute the production swap."
    },
    {
      utterance_id: 'utt_006',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_marcus',
      start_time: '03:46',
      end_time: '04:35',
      start_sec: 226,
      end_sec: 275,
      duration: 49,
      word_count: 132,
      topic_id: 'top_sec',
      sentiment: 'critical',
      text: "This consolidation makes InfoSec's job much cleaner, but with one critical prerequisite: we cannot run this migration without enforcing mutual TLS and zero-trust JWT rotation with a 15-minute TTL across every inter-service gRPC connection. Our SOC 2 Type II audit kicks off in January, and static tokens are an automatic flag. I will audit existing microservices and deliver the compliance matrix by November 28th."
    },
    {
      utterance_id: 'utt_007',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_sarah',
      start_time: '04:36',
      end_time: '05:48',
      start_sec: 276,
      end_sec: 348,
      duration: 72,
      word_count: 184,
      topic_id: 'top_budget',
      sentiment: 'neutral',
      text: "Understood Marcus. Security compliance is non-negotiable. Now looking at costs: running both environments in parallel during November will consume additional cloud compute. Alex, what is your projected buffer need?"
    },
    {
      utterance_id: 'utt_008',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_alex',
      start_time: '05:49',
      end_time: '06:15',
      start_sec: 349,
      end_sec: 375,
      duration: 26,
      word_count: 76,
      topic_id: 'top_budget',
      sentiment: 'positive',
      text: "We estimated between $12,000 and $14,000 for the shadow migration window. We also need 3 dedicated DevOps engineers to ensure zero disruption to live customer queries."
    },
    {
      utterance_id: 'utt_009',
      meeting_id: 'mtg_001',
      speaker_id: 'spk_sarah',
      start_time: '06:16',
      end_time: '07:45',
      start_sec: 376,
      end_sec: 465,
      duration: 89,
      word_count: 232,
      topic_id: 'top_budget',
      sentiment: 'positive',
      text: "Approved. We will cap the migration parallel run spend at $14,000 per month for Q4 and allocate the 3 DevOps engineers. I will submit the revised budget request to the Finance Board by November 22nd. Excellent progress today everyone—we have crisp alignment, clear owners, and concrete deliverables. Let us reconvene in two weeks."
    }
  ];

  // Helper functions
  function getMeetingById(id) {
    const meeting = factMeetings.find(m => m.meeting_id === id);
    if (!meeting) return null;

    const project = dimProjects.find(p => p.project_id === meeting.project_id);
    const utterances = factUtterances.filter(u => u.meeting_id === id).map(u => {
      const spk = dimSpeakers.find(s => s.speaker_id === u.speaker_id);
      const top = dimTopics.find(t => t.topic_id === u.topic_id);
      return { ...u, speaker: spk, topic: top };
    });
    const decisions = factDecisions.filter(d => d.meeting_id === id).map(d => {
      const spk = dimSpeakers.find(s => s.speaker_id === d.decided_by);
      const top = dimTopics.find(t => t.topic_id === d.topic_id);
      return { ...d, decided_by_speaker: spk, topic: top };
    });
    const actionItems = factActionItems.filter(a => a.meeting_id === id).map(a => {
      const spk = dimSpeakers.find(s => s.speaker_id === a.assignee_id);
      const top = dimTopics.find(t => t.topic_id === a.topic_id);
      return { ...a, assignee: spk, topic: top };
    });

    // Compute speaker intelligence metrics for this meeting
    const speakerStats = {};
    let totalMeetingSec = 0;
    utterances.forEach(u => {
      totalMeetingSec += u.duration;
      if (!speakerStats[u.speaker_id]) {
        speakerStats[u.speaker_id] = {
          speaker: u.speaker,
          total_sec: 0,
          word_count: 0,
          turns: 0,
          sentiments: { positive: 0, neutral: 0, critical: 0 }
        };
      }
      speakerStats[u.speaker_id].total_sec += u.duration;
      speakerStats[u.speaker_id].word_count += u.word_count;
      speakerStats[u.speaker_id].turns += 1;
      speakerStats[u.speaker_id].sentiments[u.sentiment] = (speakerStats[u.speaker_id].sentiments[u.sentiment] || 0) + 1;
    });

    const speakerMetrics = Object.values(speakerStats).map(s => {
      const talkShare = totalMeetingSec > 0 ? (s.total_sec / totalMeetingSec) * 100 : 0;
      const wpm = s.total_sec > 0 ? Math.round((s.word_count / s.total_sec) * 60) : 0;
      const avgTurnSec = s.turns > 0 ? Math.round(s.total_sec / s.turns) : 0;
      return {
        ...s,
        talkSharePct: Math.round(talkShare * 10) / 10,
        wpm: wpm,
        avgTurnSec: avgTurnSec,
        engagementIndex: Math.min(100, Math.round((s.turns * 12) + (talkShare * 0.8) + (wpm > 130 ? 15 : 5)))
      };
    });

    return {
      ...meeting,
      project,
      utterances,
      decisions,
      actionItems,
      speakerMetrics,
      totalCalculatedSec: totalMeetingSec
    };
  }

  // OLAP Cube Multi-Dimensional Analysis Engine
  function queryOLAP({ rowDim = 'department', colDim = 'quarter', metric = 'decisions', filterProject = 'all' }) {
    // Generate slice-and-dice data aggregation
    // Dimensions available: department, speaker, topic, project, quarter
    // Metrics available: decisions, action_items, meeting_hours, efficiency_avg, words
    const rows = new Set();
    const cols = new Set();
    const matrix = {};

    factMeetings.forEach(m => {
      if (filterProject !== 'all' && m.project_id !== filterProject) return;

      const meetingDecisions = factDecisions.filter(d => d.meeting_id === m.meeting_id);
      const meetingActions = factActionItems.filter(a => a.meeting_id === m.meeting_id);
      const meetingUtterances = factUtterances.filter(u => u.meeting_id === m.meeting_id);
      const project = dimProjects.find(p => p.project_id === m.project_id);

      // Col dimension
      let colVal = m.quarter;
      if (colDim === 'quarter') colVal = m.quarter;
      else if (colDim === 'project') colVal = project ? project.name : 'Unknown';
      cols.add(colVal);

      // Distribute by row dimension
      if (rowDim === 'department') {
        dimSpeakers.forEach(spk => {
          const spkUtterances = meetingUtterances.filter(u => u.speaker_id === spk.speaker_id);
          if (spkUtterances.length === 0 && meetingDecisions.filter(d => d.decided_by === spk.speaker_id).length === 0) return;
          const rowVal = spk.department;
          rows.add(rowVal);
          const key = `${rowVal}___${colVal}`;
          if (!matrix[key]) matrix[key] = { decisions: 0, actions: 0, minutes: 0, count: 0, efficiencySum: 0 };
          
          matrix[key].decisions += meetingDecisions.filter(d => d.decided_by === spk.speaker_id).length;
          matrix[key].actions += meetingActions.filter(a => a.assignee_id === spk.speaker_id).length;
          matrix[key].minutes += Math.round(spkUtterances.reduce((acc, u) => acc + u.duration, 0) / 60);
          matrix[key].count += 1;
          matrix[key].efficiencySum += m.efficiency_score;
        });
      } else if (rowDim === 'speaker') {
        dimSpeakers.forEach(spk => {
          const spkUtterances = meetingUtterances.filter(u => u.speaker_id === spk.speaker_id);
          if (spkUtterances.length === 0 && meetingDecisions.filter(d => d.decided_by === spk.speaker_id).length === 0) return;
          const rowVal = spk.name;
          rows.add(rowVal);
          const key = `${rowVal}___${colVal}`;
          if (!matrix[key]) matrix[key] = { decisions: 0, actions: 0, minutes: 0, count: 0, efficiencySum: 0 };
          
          matrix[key].decisions += meetingDecisions.filter(d => d.decided_by === spk.speaker_id).length;
          matrix[key].actions += meetingActions.filter(a => a.assignee_id === spk.speaker_id).length;
          matrix[key].minutes += Math.round(spkUtterances.reduce((acc, u) => acc + u.duration, 0) / 60);
          matrix[key].count += 1;
          matrix[key].efficiencySum += m.efficiency_score;
        });
      } else if (rowDim === 'topic') {
        dimTopics.forEach(top => {
          const topUtterances = meetingUtterances.filter(u => u.topic_id === top.topic_id);
          const topDecisions = meetingDecisions.filter(d => d.topic_id === top.topic_id);
          if (topUtterances.length === 0 && topDecisions.length === 0) return;
          const rowVal = top.name;
          rows.add(rowVal);
          const key = `${rowVal}___${colVal}`;
          if (!matrix[key]) matrix[key] = { decisions: 0, actions: 0, minutes: 0, count: 0, efficiencySum: 0 };
          matrix[key].decisions += topDecisions.length;
          matrix[key].actions += meetingActions.filter(a => a.topic_id === top.topic_id).length;
          matrix[key].minutes += Math.round(topUtterances.reduce((acc, u) => acc + u.duration, 0) / 60);
          matrix[key].count += 1;
          matrix[key].efficiencySum += m.efficiency_score;
        });
      }
    });

    const rowList = Array.from(rows);
    const colList = Array.from(cols).sort();

    const resultTable = rowList.map(r => {
      const rowItem = { dimension: r };
      let totalRowVal = 0;
      colList.forEach(c => {
        const cell = matrix[`${r}___${c}`] || { decisions: 0, actions: 0, minutes: 0, count: 0, efficiencySum: 0 };
        let val = 0;
        if (metric === 'decisions') val = cell.decisions;
        else if (metric === 'action_items') val = cell.actions;
        else if (metric === 'meeting_hours') val = Math.round((cell.minutes / 60) * 10) / 10;
        else if (metric === 'efficiency_avg') val = cell.count > 0 ? Math.round(cell.efficiencySum / cell.count) : 0;
        rowItem[c] = val;
        totalRowVal += val;
      });
      rowItem.total = metric === 'efficiency_avg' ? Math.round(totalRowVal / (colList.length || 1)) : totalRowVal;
      return rowItem;
    });

    return {
      rowDim,
      colDim,
      metric,
      columns: colList,
      data: resultTable
    };
  }

  // Cross-Meeting Global Knowledge Search
  function searchKnowledgeBase(query, filters = {}) {
    const q = (query || '').toLowerCase().trim();
    let matchedMeetings = [...factMeetings];

    if (filters.quarter && filters.quarter !== 'all') {
      matchedMeetings = matchedMeetings.filter(m => m.quarter === filters.quarter);
    }
    if (filters.project_id && filters.project_id !== 'all') {
      matchedMeetings = matchedMeetings.filter(m => m.project_id === filters.project_id);
    }

    const results = {
      decisions: [],
      actionItems: [],
      utterances: [],
      meetings: []
    };

    const meetingIds = new Set(matchedMeetings.map(m => m.meeting_id));

    // Search Decisions
    factDecisions.forEach(d => {
      if (!meetingIds.has(d.meeting_id)) return;
      if (!q || d.decision_text.toLowerCase().includes(q) || d.rationale.toLowerCase().includes(q)) {
        const spk = dimSpeakers.find(s => s.speaker_id === d.decided_by);
        const mtg = factMeetings.find(m => m.meeting_id === d.meeting_id);
        const top = dimTopics.find(t => t.topic_id === d.topic_id);
        results.decisions.push({ ...d, speaker: spk, meeting: mtg, topic: top });
      }
    });

    // Search Action Items
    factActionItems.forEach(a => {
      if (!meetingIds.has(a.meeting_id)) return;
      if (!q || a.description.toLowerCase().includes(q)) {
        const spk = dimSpeakers.find(s => s.speaker_id === a.assignee_id);
        const mtg = factMeetings.find(m => m.meeting_id === a.meeting_id);
        const top = dimTopics.find(t => t.topic_id === a.topic_id);
        results.actionItems.push({ ...a, assignee: spk, meeting: mtg, topic: top });
      }
    });

    // Search Utterances
    factUtterances.forEach(u => {
      if (!meetingIds.has(u.meeting_id)) return;
      if (!q || u.text.toLowerCase().includes(q)) {
        const spk = dimSpeakers.find(s => s.speaker_id === u.speaker_id);
        const mtg = factMeetings.find(m => m.meeting_id === u.meeting_id);
        const top = dimTopics.find(t => t.topic_id === u.topic_id);
        results.utterances.push({ ...u, speaker: spk, meeting: mtg, topic: top });
      }
    });

    return results;
  }

  // Ingest new meeting created from live mic or upload
  function ingestNewMeeting(meetingData) {
    const newId = `mtg_${String(factMeetings.length + 1).padStart(3, '0')}`;
    const newMeeting = {
      meeting_id: newId,
      title: meetingData.title || `Live Session ${new Date().toLocaleDateString()}`,
      project_id: meetingData.project_id || 'prj_apex',
      date: new Date().toISOString().split('T')[0],
      quarter: 'Q4-2026',
      duration_sec: meetingData.duration_sec || 180,
      participant_count: meetingData.speakers ? meetingData.speakers.length : 2,
      words_count: meetingData.words_count || 320,
      efficiency_score: meetingData.efficiency_score || 92,
      sentiment_score: meetingData.sentiment_score || 0.74,
      decision_count: meetingData.decisions ? meetingData.decisions.length : 0,
      action_item_count: meetingData.actionItems ? meetingData.actionItems.length : 0,
      topic_count: meetingData.topics ? meetingData.topics.length : 2,
      status: 'Live Recorded',
      hallucination_score: 99.2,
      coverage_score: 95.8,
      audio_url: meetingData.audio_url || null
    };

    factMeetings.unshift(newMeeting);

    // Ingest Utterances
    if (meetingData.utterances && meetingData.utterances.length > 0) {
      meetingData.utterances.forEach((u, i) => {
        factUtterances.unshift({
          utterance_id: `utt_${newId}_${i + 1}`,
          meeting_id: newId,
          speaker_id: u.speaker_id || 'spk_sarah',
          start_time: u.start_time || '00:00',
          end_time: u.end_time || '00:15',
          start_sec: u.start_sec || 0,
          end_sec: u.end_sec || 15,
          duration: u.duration || 15,
          word_count: u.word_count || (u.text ? u.text.split(' ').length : 20),
          topic_id: u.topic_id || 'top_arch',
          sentiment: u.sentiment || 'positive',
          text: u.text || ''
        });
      });
    }

    // Ingest Decisions
    if (meetingData.decisions && meetingData.decisions.length > 0) {
      meetingData.decisions.forEach((d, i) => {
        factDecisions.unshift({
          decision_id: `dec_${newId}_${i + 1}`,
          meeting_id: newId,
          topic_id: d.topic_id || 'top_arch',
          decided_by: d.decided_by || 'spk_sarah',
          decision_text: d.decision_text,
          timestamp: d.timestamp || '01:15',
          timestamp_sec: d.timestamp_sec || 75,
          impact_level: d.impact_level || 'High',
          status: 'Approved',
          rationale: d.rationale || 'Agreed in live discussion.'
        });
      });
    }

    // Ingest Action Items
    if (meetingData.actionItems && meetingData.actionItems.length > 0) {
      meetingData.actionItems.forEach((a, i) => {
        factActionItems.unshift({
          action_id: `act_${newId}_${i + 1}`,
          meeting_id: newId,
          topic_id: a.topic_id || 'top_arch',
          assignee_id: a.assignee_id || 'spk_alex',
          description: a.description,
          due_date: a.due_date || '2026-12-01',
          priority: a.priority || 'High',
          status: 'Todo',
          timestamp: a.timestamp || '01:30',
          timestamp_sec: a.timestamp_sec || 90
        });
      });
    }

    return getMeetingById(newId);
  }

  // Update Speaker Info
  function updateSpeaker(speakerId, updatedFields) {
    const idx = dimSpeakers.findIndex(s => s.speaker_id === speakerId);
    if (idx !== -1) {
      dimSpeakers[idx] = { ...dimSpeakers[idx], ...updatedFields };
      return dimSpeakers[idx];
    }
    return null;
  }

  return {
    getMeetings: () => factMeetings,
    getMeetingById,
    getSpeakers: () => dimSpeakers,
    getTopics: () => dimTopics,
    getProjects: () => dimProjects,
    getDecisions: () => factDecisions,
    getActionItems: () => factActionItems,
    getUtterances: () => factUtterances,
    queryOLAP,
    searchKnowledgeBase,
    ingestNewMeeting,
    updateSpeaker
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApexDataWarehouse;
}
